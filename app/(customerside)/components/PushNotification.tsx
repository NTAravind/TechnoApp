'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, BellOff, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'
import {
  subscribeUserToPushNotifications,
  unsubscribeUserFromPushNotifications,
  checkSubscriptionExists,
  type PushSubscriptionData
} from '@/lib/notifications'

/* ---------- helpers ---------- */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function serializePushSubscription(sub: PushSubscription): PushSubscriptionData {
  const p256dh = sub.getKey('p256dh')
  const auth = sub.getKey('auth')
  const safeBtoa = (buf: ArrayBuffer | null) =>
    buf ? btoa(String.fromCharCode(...new Uint8Array(buf))) : ''
  return {
    endpoint: sub.endpoint,
    keys: { p256dh: safeBtoa(p256dh), auth: safeBtoa(auth) }
  }
}

/* ---------- component ---------- */
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
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string }>({
    type: '',
    message: ''
  })
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')
  const [isInitialized, setIsInitialized] = useState(false)

  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef(false)

  /* ---------- toast ---------- */
  const showNotification = useCallback(
    (type: 'success' | 'error', message: string, duration = 4000) => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current)
      setNotification({ type, message })
      notificationTimeoutRef.current = setTimeout(() => setNotification({ type: '', message: '' }), duration)
    },
    []
  )

  /* ---------- sync parent ---------- */
  useEffect(() => {
    if (isInitialized) onSubscriptionChange?.(isSubscribed)
  }, [isSubscribed, onSubscriptionChange, isInitialized])

  /* ---------- init ---------- */
  useEffect(() => {
    let mounted = true
    const init = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        if (mounted) setIsInitialized(true)
        return
      }

      setIsSupported(true)
      setPermissionState(Notification.permission)

      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()

      if (existing) {
        const ser = serializePushSubscription(existing)
        const { success, exists } = await checkSubscriptionExists(ser.endpoint)
        if (success && exists) {
          setSubscription(existing)
          setIsSubscribed(true)
        } else {
          // stale subscription → wipe it
          await existing.unsubscribe()
        }
      }

      if (mounted) setIsInitialized(true)
    }

    init()
    return () => {
      mounted = false
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current)
    }
  }, [])

  /* ---------- core toggle helpers ---------- */
  const ensureCleanState = async () => {
    const reg = await navigator.serviceWorker.ready
    const cur = await reg.pushManager.getSubscription()
    if (cur) await cur.unsubscribe()
    setSubscription(null)
    setIsSubscribed(false)
  }

  const subscribeFresh = async () => {
    const reg = await navigator.serviceWorker.ready
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapid) throw new Error('VAPID key missing')

    const appServerKey = urlBase64ToUint8Array(vapid)
    const newSub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey
    })

    const ser = serializePushSubscription(newSub)
    const res = await subscribeUserToPushNotifications(ser, customerId)
    if (!res.success) throw new Error(res.error ?? 'Server error')

    return newSub
  }

  const unsubscribeAll = async () => {
    if (!subscription) return
    const ser = serializePushSubscription(subscription)
    const res = await unsubscribeUserFromPushNotifications(ser)
    if (!res.success) throw new Error(res.error ?? 'Server error')
    await subscription.unsubscribe()
  }

  /* ---------- subscribe handler ---------- */
  const handleSubscribe = async () => {
    if (!isSupported || isLoading || isProcessingRef.current) return
    if (permissionState === 'denied') {
      showNotification('error', 'Notifications blocked in browser settings.', 6000)
      return
    }

    isProcessingRef.current = true
    setIsLoading(true)

    try {
      // 1. make sure we start clean
      await ensureCleanState()

      // 2. request permission (idempotent if already granted)
      const perm = await Notification.requestPermission()
      setPermissionState(perm)
      if (perm !== 'granted') throw new Error('Permission denied')

      // 3. create a *new* subscription
      const newSub = await subscribeFresh()
      setSubscription(newSub)
      setIsSubscribed(true)

      showNotification('success', 'Subscribed to order notifications!')
      localStorage.removeItem('notification-prompt-permanently-dismissed')
      onClose?.()
    } catch (err: any) {
      console.error('Subscribe error:', err)
      showNotification('error', err.message || 'Failed to subscribe.', 5000)
    } finally {
      setIsLoading(false)
      isProcessingRef.current = false
    }
  }

  /* ---------- unsubscribe handler ---------- */
  const handleUnsubscribe = async () => {
    if (!subscription || isLoading || isProcessingRef.current) return
    isProcessingRef.current = true
    setIsLoading(true)

    try {
      await unsubscribeAll()
      await ensureCleanState() // guarantees UI state
      showNotification('success', 'Unsubscribed from notifications.')
      localStorage.removeItem('notification-prompt-permanently-dismissed')
      onClose?.()
    } catch (err: any) {
      console.error('Unsubscribe error:', err)
      showNotification('error', err.message || 'Failed to unsubscribe.', 5000)
      // even if server fails, clean locally
      await ensureCleanState()
    } finally {
      setIsLoading(false)
      isProcessingRef.current = false
    }
  }

  /* ---------- dismiss ---------- */
  const dismissPrompt = useCallback(
    (permanent = false) => {
      if (permanent) localStorage.setItem('notification-prompt-permanently-dismissed', 'true')
      onClose?.()
    },
    [onClose]
  )

  /* ---------- render ---------- */
  if (!isSupported || !isInitialized) return null

  return (
    <>
      {/* Toast */}
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

      {/* Modal */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        onClick={e => e.target === e.currentTarget && onClose?.()}
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
            {/* ---- NOT SUBSCRIBED ---- */}
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
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <span>Order confirmation & status updates</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <span>Delivery tracking notifications</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
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
                        <span>Enabling…</span>
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
                      Don’t ask again
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ---- SUBSCRIBED ---- */}
            {isSubscribed && (
              <>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <BellOff className="h-8 w-8 text-red-600" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Unsubscribe from Notifications?
                </h3>

                <p className="text-gray-600 mb-6 leading-6">
                  You’ll no longer receive order updates, delivery notifications, and special offers. You can always resubscribe later.
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
                        <span>Unsubscribing…</span>
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