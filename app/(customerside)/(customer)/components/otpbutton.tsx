'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Check, RotateCcw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface OTPButtonProps {
  phone: string
  onOtpSent?: () => void
  disabled?: boolean
  className?: string
}

interface OTPResponse {
  success: boolean
  error?: string
  message?: string
}

export default function OTPButton({
  phone,
  onOtpSent,
  disabled = false,
  className
}: OTPButtonProps) {
  const [loading, setLoading] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const isValidPhone = (phoneNumber: string): boolean => {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '')
    // Check if it's a valid 10-digit Indian phone number starting with 6-9
    return cleaned.length === 10 && /^[6-9]/.test(cleaned)
  }

  const sendOTP = async (): Promise<void> => {
    if (!phone.trim() || !isValidPhone(phone)) {
      setError('Please enter a valid Indian mobile number (starting with 6-9)')
      return
    }

    setLoading(true)
    setSuccess(false)
    setError('')

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phone.replace(/\D/g, '') }),
      })

      const data: OTPResponse = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        onOtpSent?.()
      } else {
        setError(data.error || 'Failed to send verification code. Please try again.')
      }
    } catch (err) {
      console.error('OTP send error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetState = (): void => {
    setSuccess(false)
    setError('')
  }

  const isDisabled = loading || success || disabled || !phone.trim() || !isValidPhone(phone)

  return (
    <div className="space-y-3">
      <Button
        onClick={success ? resetState : sendOTP}
        disabled={loading || (disabled && !success)}
        className={cn("w-full h-11 transition-all duration-200", className)}
        variant={success ? "secondary" : error ? "destructive" : "default"}
      >
        {loading ? (
          <>
            <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : success ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Code Sent Successfully
          </>
        ) : error ? (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            Try Again
          </>
        ) : (
          "Send Verification Code"
        )}
      </Button>
      
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {/* Success Message */}
      {success && !error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/30">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-700 dark:text-green-300">
            <p className="font-medium">Verification code sent!</p>
            <p className="text-green-600 dark:text-green-400 mt-1">
              Check your WhatsApp for a 6-digit code
            </p>
          </div>
        </div>
      )}
      
      {/* Helper Text */}
      {!success && !error && !loading && (
        <p className="text-xs text-muted-foreground text-center">
          {"We'll send you a 6-digit verification code via WhatsApp"}
        </p>
      )}
    </div>
  )
}