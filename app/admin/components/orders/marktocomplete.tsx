'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markOrderComplete } from '@/app/admin/actions/orders'
import { useRouter } from 'next/navigation'

interface MarkToCompleteProps {
  prop: {
    id: string
    phone: string
  }
}

export default function MarkToComplete({ prop }: MarkToCompleteProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [notificationResult, setNotificationResult] = useState<{
    sent: boolean
    count: number
  } | null>(null)
  const router = useRouter()

  const handleMarkComplete = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const result = await markOrderComplete(prop.id, prop.phone)

      if (result.success) {
        setNotificationResult({
          sent: result.notificationSent,
          count: result.notificationsSent
        })
        setShowSuccess(true)
        
        // Show success message briefly then refresh
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        console.error('Failed to mark order complete:', result.error)
        // You could show an error toast here
      }
    } catch (error) {
      console.error('Error marking order complete:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-green-900 mb-2">Order Completed Successfully!</h3>
            <p className="text-sm text-green-700">
              The order has been marked as complete and the customer has been notified.
            </p>
            {notificationResult && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-green-600">
                <Bell className="h-4 w-4" />
                <span>
                  {notificationResult.sent 
                    ? `Notification sent to ${notificationResult.count} device${notificationResult.count !== 1 ? 's' : ''}`
                    : 'Customer notification not available'
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Complete Order</h3>
        <p className="text-sm text-slate-600 mb-4">
          Mark this order as complete and notify the customer.
        </p>
      </div>

      <Button
        onClick={handleMarkComplete}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 text-base"
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Completing Order...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>Mark as Complete & Notify Customer</span>
          </div>
        )}
      </Button>

      <div className="text-xs text-slate-500 text-center">
        This will mark the order as delivered and complete, and send a push notification to the customer if they are subscribed.
      </div>
    </div>
  )
}