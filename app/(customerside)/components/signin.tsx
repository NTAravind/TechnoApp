"use client"

import { signIn } from "next-auth/react"
import { useState, ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, ArrowRight, Check, Edit2 } from "lucide-react"
import OTPButton from "./otpbutton"

interface SignInFormData {
  phone: string
  otp: string
}

export function SignIn() {
  const [phone, setPhone] = useState<string>("")
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [otp, setOtp] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const credentialsAction = async (formData: SignInFormData): Promise<void> => {
    setIsSubmitting(true)
    
    try {
      const result = await signIn("credentials", {
        phone: formData.phone.replace(/\D/g, ''), // Send only digits
        otp: formData.otp,
        redirect: false, // Handle redirect manually for better UX
      })

      if (result?.ok) {
        // Redirect to checkout or dashboard
        window.location.href = "/checkout"
      } else {
        console.error("Sign in failed:", result?.error)
        // Handle error - you might want to show an error message
      }
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOtpSent = (): void => {
    setOtpSent(true)
  }

  const handleEditPhone = (): void => {
    setOtpSent(false)
    setOtp("")
  }

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '')
    
    // Apply formatting
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
  }

  const handleSubmit = (): void => {
    if (otp.length === 6) {
      credentialsAction({ phone, otp })
    }
  }

  const isValidPhone = (): boolean => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length === 10
  }

  const isValidOtp = (): boolean => {
    return otp.length === 6
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-full border-2 border-border flex items-center justify-center mb-4">
            <Phone className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            {otpSent ? "Check your phone" : "Sign in"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {otpSent 
              ? `Enter the 6-digit code sent to ${phone}`
              : "Enter your phone number to continue"
            }
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="space-y-6">
              
              {/* Phone Number Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone number
                  </Label>
                  {otpSent && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={handleEditPhone}
                      className="h-auto p-0 text-xs"
                    >
                      <Edit2 className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  )}
                </div>
                
                <div className="relative">
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="123-456-7890"
                    className="h-11"
                    disabled={otpSent}
                    required
                    maxLength={12} // XXX-XXX-XXXX format
                  />
                  {otpSent && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge variant="secondary" className="h-6 px-2 text-xs">
                        <Check className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Phone validation hint */}
                {phone && !isValidPhone() && !otpSent && (
                  <p className="text-xs text-muted-foreground">
                    Please enter a valid 10-digit phone number
                  </p>
                )}
              </div>

              {/* OTP Section */}
              {otpSent && (
                <div className="space-y-2 animate-in slide-in-from-bottom-3 duration-300">
                  <Label htmlFor="otp" className="text-sm font-medium">
                    Verification code
                  </Label>
                  
                  <Input
                    type="text"
                    id="otp"
                    name="otp"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="123456"
                    className="h-11 text-center text-lg tracking-widest font-mono"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Code expires in 5 minutes</span>
                    <Button 
                      type="button" 
                      variant="link" 
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setOtpSent(false)}
                    >
                      Resend code
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                {!otpSent ? (
                  <OTPButton 
                    phone={phone} 
                    onOtpSent={handleOtpSent}
                    disabled={!isValidPhone()}
                  />
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    className="w-full h-11"
                    disabled={!isValidOtp() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <button 
              type="button"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Terms
            </button>{" "}
            and{" "}
            <button 
              type="button"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}