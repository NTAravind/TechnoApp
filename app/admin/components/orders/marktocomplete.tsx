'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"

interface MarkToCompleteProps {
  prop: {
    id: string,
    phone: string
  }
}

export default function MarkToComplete({ prop }: MarkToCompleteProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)

  const handleMarkComplete = async () => {
    setIsLoading(true)
    setHasFailed(false)
    try {
      await markAsComplete(prop.id, prop.phone)
      setIsCompleted(true)
    } catch (error) {
      console.error('Failed to mark as complete:', error)
      setHasFailed(true)
      // Reset failed state after 3 seconds to allow retry
      setTimeout(() => setHasFailed(false), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonVariant = () => {
    if (isCompleted) return "secondary"
    if (hasFailed) return "destructive"
    return "default"
  }

  const getButtonText = () => {
    if (isLoading) return "Marking..."
    if (isCompleted) return "✓ Completed"
    if (hasFailed) return "✗ Failed - Retry"
    return "Mark To Complete"
  }

  return (
    <Button
      onClick={handleMarkComplete}
      disabled={isLoading || isCompleted}
      variant={getButtonVariant()}
      className="w-full"
    >
      {getButtonText()}
    </Button>
  )
}

async function markAsComplete(id: string, phone: string) {
  try {
    // Convert string id to number for the API
    const orderId = parseInt(id)
    
    const response = await fetch('/api/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: orderId, phone }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to mark order as complete')
    }

    const result = await response.json()
    console.log('Order marked as complete:', result)
    
    // Log if WhatsApp notification failed but order was still updated
    if (result.warning) {
      console.warn('Order update warning:', result.warning)
    }
    
    return result
  } catch (error) {
    console.error('Error marking order as complete:', error)
    throw error // Re-throw to be handled by the component
  }
}