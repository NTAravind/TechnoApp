'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, BellOff, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'
import { 
  subscribeUserToPushNotifications, 
  unsubscribeUserFromPushNotifications,
  checkSubscriptionExists,
  type PushSubscriptionData 
} from '@/lib/notifications'

// Utility function to convert VAPID key with proper typing
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

// Convert PushSubscription to our data format with null checks and safe string conversion
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
}

export default function NotificationSubscriptionPrompt({ 
  customerId, 
  onSubscriptionChange 
}: NotificationSubscriptionPromptProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: string; message: string }>({ type: '', message: '' })
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [userEngaged, setUserEngaged] = useState(false)
  
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dailyPromptTimeoutRef = useRef<NodeJS.Timeout | null>(null)
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

  // Track user engagement
  useEffect(() => {
    const handleEngagement = () => {
      if (!userEngaged) setUserEngaged(true)
    }
    window.addEventListener('scroll', handleEngagement, { once: true })
    window.addEventListener('click', handleEngagement, { once: true })
    return () => {
      window.removeEventListener('scroll', handleEngagement)
      window.removeEventListener('click', handleEngagement)
    }
  }, [userEngaged])

  // Enhanced function to check if we can show prompt (2 times per day)
  const canShowPrompt = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastShown = localStorage.getItem('notification-prompt-last-shown')
    const promptCount = parseInt(localStorage.getItem('notification-prompt-count') || '0', 10)
    const permanentDismissal = localStorage.getItem('notification-prompt-permanently-dismissed')

    // Don't show if permanently dismissed
    if (permanentDismissal === 'true') {
      return false
    }

    // Reset count if it's a new day
    if (lastShown !== today) {
      localStorage.setItem('notification-prompt-count', '0')
      localStorage.setItem('notification-prompt-last-shown', today)
      return true
    }

    // Allow prompt if under 2 displays today
    return promptCount < 2
  }, [])

  // Function to increment prompt count
  const incrementPromptCount = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    const promptCount = parseInt(localStorage.getItem('notification-prompt-count') || '0', 10)
    
    localStorage.setItem('notification-prompt-count', (promptCount + 1).toString())
    localStorage.setItem('notification-prompt-last-shown', today)
  }, [])

  // Schedule automatic prompts throughout the day for unsubscribed users
  const scheduleAutomaticPrompts = useCallback(() => {
    if (isSubscribed || !isSupported || !canShowPrompt()) {
      return
    }

    // Clear existing timeout
    if (dailyPromptTimeoutRef.current) {
      clearTimeout(dailyPromptTimeoutRef.current)
    }

    const now = new Date()
    const today = new Date().toISOString().split('T')[0]
    const promptCount = parseInt(localStorage.getItem('notification-prompt-count') || '0', 10)

    // If we haven't shown any prompts today, schedule the first one
    if (promptCount === 0) {
      // Show first prompt after 30 seconds if user is engaged
      dailyPromptTimeoutRef.current = setTimeout(() => {
        if (!isSubscribed && userEngaged && canShowPrompt()) {
          setShowPrompt(true)
          incrementPromptCount()
        }
      }, 30000) // 30 seconds
    }
    // If we've shown 1 prompt today, schedule the second one
    else if (promptCount === 1) {
      // Calculate time for second prompt (e.g., 4 hours after first prompt)
      const fourHoursInMs = 4 * 60 * 60 * 1000
      dailyPromptTimeoutRef.current = setTimeout(() => {
        if (!isSubscribed && canShowPrompt()) {
          setShowPrompt(true)
          incrementPromptCount()
        }
      }, fourHoursInMs)
    }
  }, [isSubscribed, isSupported, canShowPrompt, incrementPromptCount, userEngaged])

  useEffect(() => {
    let isMounted = true
    
    const initialize = async () => {
      try {
        await checkSupport()
        if (isMounted) {
          await checkExistingSubscription()
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Error initializing notifications:', error)
        if (isMounted) {
          setIsInitialized(true)
          showNotification('error', 'Failed to initialize notifications')
        }
      }
    }

    initialize()

    return () => {
      isMounted = false
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
      if (promptTimeoutRef.current) {
        clearTimeout(promptTimeoutRef.current)
      }
      if (dailyPromptTimeoutRef.current) {
        clearTimeout(dailyPromptTimeoutRef.current)
      }
    }
  }, [customerId, showNotification])

  // Schedule automatic prompts when conditions change
  useEffect(() => {
    if (isInitialized && !isSubscribed && userEngaged) {
      scheduleAutomaticPrompts()
    }

    return () => {
      if (dailyPromptTimeoutRef.current) {
        clearTimeout(dailyPromptTimeoutRef.current)
      }
    }
  }, [isInitialized, isSubscribed, userEngaged, scheduleAutomaticPrompts])

  const checkSupport = async (): Promise<void> => {
    return new Promise((resolve) => {
      if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
        setIsSupported(true)
        setPermissionState(Notification.permission)
      } else {
        console.warn('Push notifications not supported in this browser/TWA')
      }
      resolve()
    })
  }

  const checkExistingSubscription = async (): Promise<void> => {
    if (!isSupported) return

    try {
      const registration = await navigator.serviceWorker.ready
      const existingSub = await registration.pushManager.getSubscription()
      
      if (existingSub) {
        const serializedSub = serializePushSubscription(existingSub)
        const result = await checkSubscriptionExists(serializedSub.endpoint)
        
        if (result.success && result.exists) {
          setSubscription(existingSub)
          setIsSubscribed(true)
          setShowPrompt(false)
          setPermissionState('granted')
        } else {
          await existingSub.unsubscribe()
          setSubscription(null)
          setIsSubscribed(false)
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const handleSubscribe = async (): Promise<void> => {
    if (!isSupported || isLoading || isProcessingRef.current || permissionState === 'denied') return

    isProcessingRef.current = true
    setIsLoading(true)
    
    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission)
      
      if (permission !== 'granted') {
        showNotification('error', 'Please enable notifications in your app settings to receive order updates.', 6000)
        return
      }

      const registration = await navigator.serviceWorker.ready
      
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        throw new Error('VAPID key not configured')
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidKey)
      
      let newSubscription: PushSubscription | null = null
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts && !newSubscription) {
        try {
          newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          })
        } catch (error) {
          attempts++
          if (attempts === maxAttempts) {
            throw error
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (!newSubscription) {
        throw new Error('Failed to create push subscription')
      }

      const serializedSub = serializePushSubscription(newSubscription)
      const result = await subscribeUserToPushNotifications(serializedSub, customerId)

      if (result.success) {
        setSubscription(newSubscription)
        setIsSubscribed(true)
        setShowPrompt(false)
        showNotification('success', 'Successfully subscribed to order notifications!')
        
        // Clear all prompt-related localStorage when successfully subscribed
        localStorage.removeItem('notification-prompt-count')
        localStorage.removeItem('notification-prompt-last-shown')
        localStorage.removeItem('notification-prompt-permanently-dismissed')
        
        // Clear any scheduled prompts
        if (dailyPromptTimeoutRef.current) {
          clearTimeout(dailyPromptTimeoutRef.current)
        }
        
        // Welcome notification
        if (Notification.permission === 'granted') {
          new Notification('Notifications Enabled!', {
            body: 'You\'ll now receive updates about your orders.',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png'
          })
        }
      } else {
        const errorMsg = !result.success && 'error' in result ? result.error : 'Failed to save subscription'
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      const errorMessage = error instanceof Error 
        ? error.message === 'VAPID key not configured'
          ? 'Notification service is not properly configured. Please contact support.'
          : error.message.includes('permission denied')
          ? 'Notification permission was denied. Please enable in app settings.'
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
    setShowUnsubscribeConfirm(false)
    
    try {
      const serializedSub = serializePushSubscription(subscription)
      const result = await unsubscribeUserFromPushNotifications(serializedSub)
      
      if (result.success) {
        await subscription.unsubscribe()
        setSubscription(null)
        setIsSubscribed(false)
        showNotification('success', 'Successfully unsubscribed from notifications.')
        
        // Reset prompt counts to allow showing prompts again
        localStorage.removeItem('notification-prompt-count')
        localStorage.removeItem('notification-prompt-last-shown')
        localStorage.removeItem('notification-prompt-permanently-dismissed')
        
        // Schedule new prompts for the unsubscribed user
        scheduleAutomaticPrompts()
      } else {
        const errorMsg = !result.success && 'error' in result ? result.error : 'Failed to remove subscription'
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Error unsubscribing:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to unsubscribe. Please try again.'
      
      showNotification('error', errorMessage)
      
      try {
        if (subscription) {
          await subscription.unsubscribe()
        }
        setSubscription(null)
        setIsSubscribed(false)
      } catch (localError) {
        console.error('Local unsubscribe failed:', localError)
      }
    } finally {
      setIsLoading(false)
      isProcessingRef.current = false
    }
  }

  const dismissPrompt = useCallback((permanent = false) => {
    setShowPrompt(false)
    
    if (permanent) {
      // Permanently dismiss - won't show again until they unsubscribe/resubscribe
      localStorage.setItem('notification-prompt-permanently-dismissed', 'true')
    }
    
    // Always increment count when dismissing
    incrementPromptCount()
  }, [incrementPromptCount])

  useEffect(() => {
    if (isSubscribed) {
      setShowPrompt(false)
      setShowUnsubscribeConfirm(false)
    }
  }, [isSubscribed])

  useEffect(() => {
    const handleExternalTrigger = () => {
      if (isSubscribed) {
        setShowUnsubscribeConfirm(true)
      } else if (canShowPrompt()) {
        setShowPrompt(true)
        incrementPromptCount()
      }
    }

    if (typeof window !== 'undefined') {
      ;(window as any).showNotificationPrompt = handleExternalTrigger
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).showNotificationPrompt
      }
    }
  }, [isSubscribed, canShowPrompt, incrementPromptCount])

  if (!isSupported || !isInitialized) {
    return null
  }

  return (
    <>
      {notification.message && (
        <div 
          className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 animate-in slide-in-from-right ${
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

      {showPrompt && !isSubscribed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-prompt-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in-0 zoom-in-95 duration-300">
            <button
              onClick={() => dismissPrompt(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              
              <h3 id="notification-prompt-title" className="text-xl font-semibold text-gray-900 mb-2">
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
                  className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
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
                    Remind me later
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
            </div>
          </div>
        </div>
      )}

      {showUnsubscribeConfirm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsubscribe-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in-0 zoom-in-95 duration-300">
            <button
              onClick={() => setShowUnsubscribeConfirm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <BellOff className="h-8 w-8 text-red-600" />
              </div>
              
              <h3 id="unsubscribe-title" className="text-xl font-semibold text-gray-900 mb-2">
                Unsubscribe from Notifications?
              </h3>
              
              <p className="text-gray-600 mb-6 leading-6">
                You'll no longer receive order updates, delivery notifications, and special offers. You can always resubscribe later from your account settings.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnsubscribeConfirm(false)}
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <BellOff className="h-4 w-4" />
                      Unsubscribe
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}