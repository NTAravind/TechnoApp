"use client"

import { useState, ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Phone, ArrowRight, Check, Edit2, RotateCcw, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { authenticateUser } from "@/lib/auth_actions"

interface SignInFormData {
  phone: string
  otp: string
}

interface OTPResponse {
  success: boolean
  error?: string
  message?: string
}

export function SignIn() {
  // Main state
  const [phone, setPhone] = useState<string>("")
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [otp, setOtp] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false)
  
  // OTP related state
  const [otpLoading, setOtpLoading] = useState<boolean>(false)
  const [otpSuccess, setOtpSuccess] = useState<boolean>(false)
  const [otpError, setOtpError] = useState<string>('')

  const router = useRouter()

  const credentialsAction = async (formData: SignInFormData): Promise<void> => {
    setIsSubmitting(true)
    setOtpError('')
    
    try {
      const result = await authenticateUser(formData.phone, formData.otp)

      if (result.success) {
        console.log("Authentication successful - redirecting to home page")
        
        setIsRedirecting(true)
        
        // Small delay to show success state
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Use client-side navigation
        router.push("/")
        router.refresh()
        return
      } else {
        setOtpError(result.error || "Invalid OTP. Please try again.")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      setOtpError("An error occurred during sign-in. Please try again.")
    } finally {
      if (!isRedirecting) {
        setIsSubmitting(false)
      }
    }
  }

  const isValidPhone = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, '')
    return cleaned.length === 10 && /^[6-9]/.test(cleaned)
  }

  const sendOTP = async (): Promise<void> => {
    if (!phone.trim() || !isValidPhone(phone)) {
      setOtpError('Please enter a valid Indian mobile number')
      return
    }

    setOtpLoading(true)
    setOtpSuccess(false)
    setOtpError('')

    try {
      const cleanedPhone = phone.replace(/\D/g, '')
      
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanedPhone }),
      })

      const data: OTPResponse = await response.json()

      if (response.ok && data.success) {
        setOtpSuccess(true)
        setOtpSent(true)
        setOtpError('')
      } else {
        setOtpError(data.error || 'Failed to send verification code. Please try again.')
      }
    } catch (err) {
      console.error('OTP send error:', err)
      setOtpError('Network error. Please check your connection and try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleEditPhone = (): void => {
    setOtpSent(false)
    setOtp("")
    setOtpSuccess(false)
    setOtpError("")
  }

  const handleResendOTP = async (): Promise<void> => {
    setOtpSent(false)
    setOtp("")
    setOtpSuccess(false)
    setOtpError("")
    await sendOTP()
  }

  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
    if (otpError) setOtpError("")
  }

  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
    if (otpError) setOtpError("")
  }

  const handleSubmit = async (): Promise<void> => {
    if (otp.length === 6) {
      await credentialsAction({ phone, otp })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      if (!otpSent && isValidPhone(phone)) {
        sendOTP()
      } else if (otpSent && otp.length === 6) {
        handleSubmit()
      }
    }
  }

  const isValidPhoneInput = (): boolean => {
    return isValidPhone(phone)
  }

  const isValidOtp = (): boolean => {
    return otp.length === 6
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" onKeyPress={handleKeyPress}>
      {/* Status Bar Space */}
      <div className="h-safe-top bg-background" />
      
      {/* Header */}
      <div className="flex-none px-6 pt-8 pb-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            {otpSent ? "Enter code" : "Welcome back"}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {otpSent 
              ? `We sent a 6-digit code to\n${phone}`
              : "Sign in with your phone number to continue"
            }
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 flex flex-col justify-center">
        <div className="max-w-sm mx-auto w-full">
          <div className="space-y-6">
            
            {/* Phone Number Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone" className="text-base font-medium">
                  Phone number
                </Label>
                {otpSent && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={handleEditPhone}
                    className="h-8 px-3 text-sm"
                    disabled={isSubmitting}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
              
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  +91
                </div>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="XXX XXX XXXX"
                  className="h-14 pl-12 text-lg font-mono tracking-wider rounded-2xl border-2 focus:border-primary transition-colors"
                  disabled={otpSent || isSubmitting}
                  required
                  maxLength={12}
                />
                {otpSent && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Badge variant="secondary" className="h-7 px-3 rounded-full">
                      <Check className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* OTP Section */}
            {otpSent && (
              <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                <Label htmlFor="otp" className="text-base font-medium">
                  Verification code
                </Label>
                
                <Input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="• • • • • •"
                  className="h-14 text-center text-2xl tracking-[0.5em] font-mono rounded-2xl border-2 focus:border-primary transition-colors"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={isSubmitting}
                />
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Expires in 5 min</span>
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm"
                    className="h-auto p-0 text-sm font-medium text-primary"
                    onClick={handleResendOTP}
                    disabled={otpLoading || isSubmitting}
                  >
                    Resend code
                  </Button>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              {!otpSent ? (
                <Button 
                  onClick={sendOTP}
                  disabled={otpLoading || !isValidPhoneInput()}
                  className="w-full h-14 text-base font-semibold rounded-2xl shadow-sm"
                  size="lg"
                >
                  {otpLoading ? (
                    <>
                      <RotateCcw className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send verification code
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  className="w-full h-14 text-base font-semibold rounded-2xl shadow-sm"
                  disabled={!isValidOtp() || isSubmitting}
                  size="lg"
                >
                  {isRedirecting ? (
                    <>
                      <Check className="mr-2 h-5 w-5 text-green-500" />
                      Redirecting...
                    </>
                  ) : isSubmitting ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Error Message */}
            {otpError && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">{otpError}</p>
              </div>
            )}

            {/* Helper Text */}
            {!otpSent && !otpError && (
              <p className="text-center text-sm text-muted-foreground px-2">
                We'll send a 6-digit code via SMS to verify your number
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Privacy - Fixed Bottom */}
      <div className="flex-none px-6 pb-6 pb-safe-bottom">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            By continuing, you agree to our{" "}
            <button 
              type="button"
              className="underline underline-offset-2 hover:text-foreground transition-colors font-medium"
            >
              Terms
            </button>{" "}
            and{" "}
            <button 
              type="button"
              className="underline underline-offset-2 hover:text-foreground transition-colors font-medium"
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}