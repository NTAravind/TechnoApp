'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Phone, Mail, MapPin, Hash } from 'lucide-react'
import { createCustomer, updateCustomer } from '@/lib/customer-actions'

interface ClientProfileFormProps {
  customer?: {
    id: number
    name: string
    phone: string
    email: string | null
    Address: string | null
    pincode: string | null
  }
  mode?: 'create' | 'edit'
  onSuccess?: () => void
}

export default function ClientProfileForm({ customer, mode = 'create', onSuccess }: ClientProfileFormProps) {
  const { data: session } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.Address || '',
    pincode: customer?.pincode || ''
  })
  const router = useRouter()

  // Effect to set phone number from session on component mount
  useEffect(() => {
    if (mode === 'create' && session?.user?.name && !formData.phone) {
      setFormData(prev => ({ 
        ...prev, 
        phone: session.user.name 
      }))
    }
  }, [session, mode, formData.phone])

  const handleInputChange = (field: string, value: string) => {
    // Don't allow phone number changes in create mode when it's from session
    if (field === 'phone' && mode === 'create' && session?.user?.name) {
      return
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      try {
        // Create FormData object
        const data = new FormData()
        data.append('name', formData.name)
        data.append('phone', formData.phone)
        data.append('email', formData.email)
        data.append('address', formData.address)
        data.append('pincode', formData.pincode)

        let result

        if (mode === 'edit' && customer) {
          result = await updateCustomer(customer.id, data)
        } else {
          result = await createCustomer(data)
        }

        if (result.success) {
          setSuccess(
            mode === 'edit' 
              ? `Profile updated successfully!`
              : `Profile created successfully!`
          )
          
          // Call custom success handler if provided
          if (onSuccess) {
            onSuccess()
          }
          
          // For new customer creation, we need to refresh the page to update server-side cache
          if (mode === 'create') {
            // Use window.location.href for a full page refresh to clear server cache
            setTimeout(() => {
              window.location.href = '/'
            }, 1500)
          } else {
            // For edits, just go back
            setTimeout(() => {
              router.back()
            }, 1500)
          }
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.')
        console.error('Form submission error:', err)
      }
    })
  }

  // Determine if phone field should be disabled
  const isPhoneDisabled = isPending || (mode === 'create' && session?.user?.name)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {mode === 'edit' ? 'Edit Profile' : 'Setup Your Profile'}
            </CardTitle>
            <CardDescription className="text-base">
              {mode === 'edit' 
                ? 'Update your information below'
                : 'Tell us a bit about yourself to get started'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={isPending}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!!isPhoneDisabled}
                    className={`pl-10 h-12 ${isPhoneDisabled && mode === 'create' ? 'bg-muted cursor-not-allowed' : ''}`}
                  />
                </div>
                {mode === 'create' && session?.user?.name && (
                  <p className="text-xs text-muted-foreground">
                    Phone number from your login session
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isPending}
                    className="pl-10 h-12"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Optional - for updates and notifications</p>
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    type="text"
                    placeholder="Enter your full address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={isPending}
                    className="pl-10 h-12"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Optional - for delivery purposes</p>
              </div>

              {/* Pincode Field */}
              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-sm font-medium">
                  PIN Code
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pincode"
                    type="text"
                    placeholder="Enter 6-digit PIN code"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    disabled={isPending}
                    maxLength={6}
                    className="pl-10 h-12"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Optional - helps us serve you better</p>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || !formData.name || !formData.phone}
                  className="w-full h-12"
                  size="lg"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === 'edit' ? 'Updating...' : 'Setting up...'}
                    </>
                  ) : (
                    mode === 'edit' ? 'Update Profile' : 'Complete Setup'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isPending}
                  className="w-full h-12"
                  size="lg"
                >
                  Cancel
                </Button>
              </div>

              {/* Required fields note */}
              <p className="text-xs text-muted-foreground text-center pt-2">
                * Required fields
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}