'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, BellOff, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'
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
    if (!buffer) return '';
    const uint8 = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...uint8));
  };

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: safeBtoa(p256dh),
      auth: safeBtoa(auth)
    }
  }
}

interface NotificationSubscriptionPromptProps {
  customerId: string
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
  
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef(false)

  const showNotification = useCallback((type: 'success' | 'error', message: string, duration = 4000) => {
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
      onSubscriptionChange?.(isSubscribed)
    }
  }, [isSubscribed, onSubscriptionChange, isInitialized])

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
              
              if (result.success && result.exists) {
                setSubscription(existingSub)
                setIsSubscribed(true)
                setPermissionState('granted')
              } else {
                await existingSub.unsubscribe()
                setSubscription(null)
                setIsSubscribed(false)
              }
            }
            setIsInitialized(true)
          }
        } else {
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Error initializing notifications:', error)
        if (isMounted) {
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

    // Check current browser permission state first
    const currentPermission = Notification.permission
    setPermissionState(currentPermission)
    
    if (currentPermission === 'denied') {
      showNotification('error', 'Notifications are blocked. Please enable them in your browser settings.', 6000)
      return
    }

    isProcessingRef.current = true
    setIsLoading(true)
    
    try {
      // Request permission if not already granted
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
        throw new Error('VAPID key not configured')
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidKey)
      
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      if (!newSubscription) {
        throw new Error('Failed to create push subscription')
      }

      const serializedSub = serializePushSubscription(newSubscription)
      const result = await subscribeUserToPushNotifications(serializedSub, customerId)

      if (result.success) {
        setSubscription(newSubscription)
        setIsSubscribed(true)
        showNotification('success', 'Successfully subscribed to order notifications!')
        
        localStorage.removeItem('notification-prompt-permanently-dismissed')
        
        if (Notification.permission === 'granted') {
          new Notification('Notifications Enabled!', {
            body: 'You\'ll now receive updates about your orders.',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png'
          })
        }
        
        onClose?.()
      } else {
        const errorMsg = !result.success && 'error' in result ? result.error : 'Failed to save subscription'
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      const errorMessage = error instanceof Error 
        ? error.message === 'VAPID key not configured'
          ? 'Notification service is not properly configured. Please contact support.'
          : error.message.includes('permission')
          ? 'Notification permission was denied. Please enable in browser settings.'
          : 'Failed to subscribe to notifications. Please try again.'
        : 'An unexpected error occurred.'
      
      showNotification('error', errorMessage, 5000)
      
      if (subscription) {
        try {
          await subscription.unsubscribe()
          setSubscription(null)
        } catch (cleanupError) {
          console.error('Error cleaning up subscription:', cleanupError)
        }
      }
    } finally {
      setIsLoading(false)
      isProcessingRef.current = false
    }
  }

  const handleUnsubscribe = async (): Promise<void> => {
    if (!subscription || isLoading || isProcessingRef.current) return

    isProcessingRef.current = true
    setIsLoading(true)
    
    try {
      // First, unsubscribe from the browser
      await subscription.unsubscribe()
      
      // Then remove ALL subscriptions for this customer from the database
      const result = await unsubscribeAllCustomerSubscriptions(customerId)
      
      if (result.success) {
        // Clear all service worker registrations to reset state
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const registration of registrations) {
            const existingSub = await registration.pushManager.getSubscription()
            if (existingSub) {
              await existingSub.unsubscribe()
            }
          }
        }
        
        setSubscription(null)
        setIsSubscribed(false)
        setPermissionState('default')
        
        const count = result.count || 1
        showNotification(
          'success', 
          `Successfully unsubscribed ${count} device${count > 1 ? 's' : ''}. Browser permissions have been reset.`, 
          5000
        )
        
        localStorage.removeItem('notification-prompt-permanently-dismissed')
        
        onClose?.()
      } else {
        const errorMsg = result.error || 'Failed to remove subscription'
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Error unsubscribing:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to unsubscribe. Please try again.'
      
      showNotification('error', errorMessage)
      
      // Cleanup local state even if server call failed
      try {
        if (subscription) {
          await subscription.unsubscribe()
        }
        setSubscription(null)
        setIsSubscribed(false)
        setPermissionState('default')
      } catch (localError) {
        console.error('Local unsubscribe failed:', localError)
      }
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
      {/* Notification Toast */}
      {notification.message && (
        <div 
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 animate-in slide-in-from-top ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
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

      {/* Main Modal */}
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
            {/* Show Subscribe UI when not subscribed */}
            {!isSubscribed && (
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
                      Don't ask again
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Show Unsubscribe UI when subscribed */}
            {isSubscribed && (
              <>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <BellOff className="h-8 w-8 text-red-600" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Unsubscribe from Notifications?
                </h3>
                
                <p className="text-gray-600 mb-6 leading-6">
                  You'll no longer receive order updates, delivery notifications, and special offers. You can always resubscribe later.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => onClose?.()}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    disabled={isLoading}
                  >
                    Keep Notifications
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
          </div>
        </div>
      </div>
    </>
  )
}