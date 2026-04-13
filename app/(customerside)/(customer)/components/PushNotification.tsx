'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, BellOff, CheckCircle, AlertCircle, X, Loader2, RefreshCw } from 'lucide-react'
import { 
  subscribeUserToPushNotifications, 
  unsubscribeUserFromPushNotifications,
  unsubscribeAllCustomerSubscriptions,
  checkSubscriptionExists,
  type PushSubscriptionData 
} from '@/lib/notifications'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  try {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  } catch (error) {
    throw new Error('Invalid VAPID key format')
  }
}

function serializePushSubscription(subscription: PushSubscription): PushSubscriptionData {
  const p256dh = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')
  
  const safeBtoa = (buffer: ArrayBuffer | null): string => {
    if (!buffer) return ''
    const uint8 = new Uint8Array(buffer)
    return btoa(String.fromCharCode(...uint8))
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: safeBtoa(p256dh),
      auth: safeBtoa(auth)
    }
  }
}

interface NotificationSubscriptionPromptProps {
  customerId: string | number
  onSubscriptionChange?: (isSubscribed: boolean) => void
  onClose?: () => void
}

export default function NotificationSubscriptionPrompt({ 
  customerId, 
  onSubscriptionChange,
  onClose
}: NotificationSubscriptionPromptProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: string; message: string }>({ type: '', message: '' })
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')
  const [isInitialized, setIsInitialized] = useState(false)
  const [dbSynced, setDbSynced] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef(false)
  const customerIdNum = typeof customerId === 'string' ? parseInt(customerId, 10) : customerId

  const showNotification = useCallback((type: 'success' | 'error' | 'warning', message: string, duration = 4000) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
    
    setNotification({ type, message })
    
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification({ type: '', message: '' })
    }, duration)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      onSubscriptionChange?.(isSubscribed && dbSynced)
    }
  }, [isSubscribed, dbSynced, onSubscriptionChange, isInitialized])

  useEffect(() => {
    let isMounted = true
    
    const initialize = async () => {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
          setIsSupported(true)
          setPermissionState(Notification.permission)
          
          if (isMounted) {
            const registration = await navigator.serviceWorker.ready
            const existingSub = await registration.pushManager.getSubscription()
            
            if (existingSub) {
              const serializedSub = serializePushSubscription(existingSub)
              const result = await checkSubscriptionExists(serializedSub.endpoint)
              
              if (result.success) {
                if (result.exists) {
                  setSubscription(existingSub)
                  setIsSubscribed(true)
                  setDbSynced(true)
                  setPermissionState('granted')
                } else {
                  try {
                    await existingSub.unsubscribe()
                  } catch (unsubscribeError) {
                    console.warn('Failed to unsubscribe stale subscription:', unsubscribeError)
                  }
                  setSubscription(null)
                  setIsSubscribed(false)
                  setDbSynced(false)
                }
              } else {
                setSyncError(result.error || 'Failed to check subscription status')
                setSubscription(existingSub)
                setIsSubscribed(true)
                setDbSynced(false)
              }
            } else {
              setSubscription(null)
              setIsSubscribed(false)
              setDbSynced(false)
            }
            setIsInitialized(true)
          }
        } else {
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Error initializing notifications:', error)
        if (isMounted) {
          setSyncError(error instanceof Error ? error.message : 'Failed to initialize notifications')
          setIsInitialized(true)
        }
      }
    }

    initialize()

    return () => {
      isMounted = false
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
    }
  }, [])

  const handleSubscribe = async (): Promise<void> => {
    if (!isSupported || isLoading || isProcessingRef.current) {
      return
    }

    if (isNaN(customerIdNum)) {
      showNotification('error', 'Invalid customer ID. Please log out and log back in.', 6000)
      return
    }

    const currentPermission = Notification.permission
    setPermissionState(currentPermission)
    
    if (currentPermission === 'denied') {
      showNotification('error', 'Notifications are blocked. Please enable them in your browser settings to receive order updates.', 6000)
      return
    }

    isProcessingRef.current = true
    setIsLoading(true)
    setSyncError(null)
    
    try {
      const permission = currentPermission === 'granted' 
        ? currentPermission 
        : await Notification.requestPermission()
      
      setPermissionState(permission)
      
      if (permission !== 'granted') {
        showNotification('error', 'Please enable notifications in your browser settings to receive order updates.', 6000)
        return
      }

      const registration = await navigator.serviceWorker.ready
      
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        throw new Error('VAPID_KEY_NOT_CONFIGURED')
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidKey)
      
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      if (!newSubscription) {
        throw new Error('SUBSCRIPTION_FAILED')
      }

      const serializedSub = serializePushSubscription(newSubscription)
      const result = await subscribeUserToPushNotifications(serializedSub, String(customerIdNum))

      if (result.success) {
        setSubscription(newSubscription)
        setIsSubscribed(true)
        setDbSynced(true)
        setSyncError(null)
        showNotification('success', 'Successfully subscribed to order notifications!')
        
        localStorage.removeItem('notification-prompt-permanently-dismissed')
        
        if (Notification.permission === 'granted') {
          try {
            new Notification('Notifications Enabled!', {
              body: 'You\'ll now receive updates about your orders.',
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png'
            })
          } catch (notifError) {
            console.warn('Could not show confirmation notification:', notifError)
          }
        }
        
        onClose?.()
      } else {
        const errorMsg = 'error' in result ? result.error : 'Failed to save subscription'
        
        if (errorMsg === 'CUSTOMER_NOT_FOUND') {
          throw new Error('ACCOUNT_NOT_FOUND')
        }
        
        try {
          await newSubscription.unsubscribe()
        } catch (unsubscribeError) {
          console.warn('Failed to cleanup subscription after DB error:', unsubscribeError)
        }
        
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      let errorMessage: string
      let errorType: 'error' | 'warning' = 'error'
      
      if (error instanceof Error) {
        if (error.message === 'VAPID_KEY_NOT_CONFIGURED') {
          errorMessage = 'Notification service is not configured on this server. Please contact support.'
        } else if (error.message === 'ACCOUNT_NOT_FOUND') {
          errorMessage = 'Your account could not be found. Please log out and log back in.'
        } else if (error.message === 'SUBSCRIPTION_FAILED') {
          errorMessage = 'Failed to create push subscription. Please try again.'
        } else if (error.message.toLowerCase().includes('permission')) {
          errorMessage = 'Notification permission was denied. Please enable in browser settings.'
        } else if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
          errorType = 'warning'
        } else if (error.message.toLowerCase().includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.'
          errorType = 'warning'
        } else {
          errorMessage = `Failed to subscribe: ${error.message}`
        }
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.'
      }
      
      showNotification(errorType, errorMessage, 5000)
      
      setSubscription(null)
      setIsSubscribed(false)
      setDbSynced(false)
    } finally {
      setIsLoading(false)
      isProcessingRef.current = false
    }
  }

  const handleUnsubscribe = async (): Promise<void> => {
    if (!subscription && !isSubscribed && !dbSynced) {
      showNotification('success', 'Already unsubscribed from notifications.')
      onClose?.()
      return
    }

    if (isLoading || isProcessingRef.current) return

    isProcessingRef.current = true
    setIsLoading(true)
    
    try {
      let localUnsubscribed = false
      let serverDeleted = false

      if (subscription) {
        try {
          localUnsubscribed = await subscription.unsubscribe()
        } catch (localError) {
          console.warn('Local unsubscribe failed (may already be unsubscribed):', localError)
          localUnsubscribed = true
        }
      } else {
        localUnsubscribed = true
      }

      try {
        const result = await unsubscribeAllCustomerSubscriptions(String(customerIdNum))
        
        if (result.success) {
          serverDeleted = true
          const count = result.count || 0
          
          if (!localUnsubscribed) {
            showNotification('warning', `Removed from server but browser sync may have failed. Please refresh the page.`, 6000)
          } else if (count > 0) {
            showNotification(
              'success', 
              `Successfully unsubscribed ${count} device${count > 1 ? 's' : ''} from notifications.`, 
              5000
            )
          } else {
            showNotification('success', 'Successfully unsubscribed from notifications.', 5000)
          }
        } else {
          throw new Error(result.error || 'Failed to remove subscription from server')
        }
      } catch (serverError) {
        console.error('Server unsubscribe failed:', serverError)
        
        if (localUnsubscribed) {
          showNotification(
            'warning', 
            'Browser unsubscribed but server sync failed. Please try again or contact support if issue persists.', 
            8000
          )
        } else {
          throw serverError
        }
      }
      
      setSubscription(null)
      setIsSubscribed(false)
      setDbSynced(false)
      setSyncError(null)
      
      localStorage.removeItem('notification-prompt-permanently-dismissed')
      
      onClose?.()
    } catch (error) {
      console.error('Error unsubscribing:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to unsubscribe. Please try again.'
      
      showNotification('error', errorMessage)
    } finally {
      setIsLoading(false)
      isProcessingRef.current = false
    }
  }

  const handleSync = async (): Promise<void> => {
    if (isLoading || isProcessingRef.current || !subscription) return

    isProcessingRef.current = true
    setIsLoading(true)
    
    try {
      const serializedSub = serializePushSubscription(subscription)
      const result = await subscribeUserToPushNotifications(serializedSub, String(customerIdNum))
      
      if (result.success) {
        setDbSynced(true)
        setSyncError(null)
        showNotification('success', 'Sync completed successfully!')
      } else {
        const errorMsg = 'error' in result ? result.error : 'Sync failed'
        setSyncError(errorMsg)
        showNotification('error', `Sync failed: ${errorMsg || 'Please try again.'}`, 5000)
      }
    } catch (error) {
      console.error('Sync error:', error)
      setSyncError(error instanceof Error ? error.message : 'Sync failed')
      showNotification('error', 'Sync failed. Please try again.', 5000)
    } finally {
      setIsLoading(false)
      isProcessingRef.current = false
    }
  }

  const dismissPrompt = useCallback((permanent = false) => {
    if (permanent) {
      localStorage.setItem('notification-prompt-permanently-dismissed', 'true')
    }
    onClose?.()
  }, [onClose])

  if (!isSupported || !isInitialized) {
    return null
  }

  return (
    <>
      {notification.message && (
        <div 
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 animate-in slide-in-from-top ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : notification.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : notification.type === 'warning' ? (
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium leading-5">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification({ type: '', message: '' })}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose?.()
          }
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in-0 zoom-in-95 duration-300">
          <button
            onClick={() => onClose?.()}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
            aria-label="Close"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            {!isSubscribed && !dbSynced && (
              <>
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Stay Updated on Your Orders
                </h3>
                
                <p className="text-gray-600 mb-6 leading-6">
                  Get real-time updates about your order status, delivery information, and exclusive offers directly to your device.
                </p>
                
                <div className="space-y-3 mb-6 text-left">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                    <span>Order confirmation & status updates</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                    <span>Delivery tracking notifications</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                    <span>Exclusive deals & promotions</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Enabling...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" />
                        Enable Notifications
                      </>
                    )}
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => dismissPrompt(false)}
                      className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      disabled={isLoading}
                    >
                      Not now
                    </button>
                    <button
                      onClick={() => dismissPrompt(true)}
                      className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      disabled={isLoading}
                    >
                      Don&apos;t ask again
                    </button>
                  </div>
                </div>
              </>
            )}

            {isSubscribed && dbSynced && (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-green-600" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Notifications Enabled
                </h3>
                
                <p className="text-gray-600 mb-6 leading-6">
                  You&apos;re all set! You&apos;ll receive order updates, delivery notifications, and special offers.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => onClose?.()}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    disabled={isLoading}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Unsubscribing...</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="h-4 w-4" />
                        Unsubscribe
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {isSubscribed && !dbSynced && (
              <>
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sync Required
                </h3>
                
                <p className="text-gray-600 mb-4 leading-6">
                  Your notification settings need to be synced with our servers.
                  {syncError && (
                    <span className="block text-sm text-red-500 mt-2">Error: {syncError}</span>
                  )}
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleSync}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Sync Now
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <BellOff className="h-4 w-4" />
                    Unsubscribe
                  </button>
                </div>
                
                <button
                  onClick={() => onClose?.()}
                  className="mt-3 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isLoading}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
