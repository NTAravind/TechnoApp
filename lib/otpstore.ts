// lib/otpstore.ts
type OtpEntry = {
  otp: string
  expiresAt: number
  attempts: number
}

const otpStore = new Map<string, OtpEntry>()
const OTP_EXPIRATION_TIME_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 3 // Maximum verification attempts

export function saveOtp(phone: string, otp: string): void {
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME_MS
  otpStore.set(phone, { otp, expiresAt, attempts: 0 })
  
  // Clean up expired entries periodically
  cleanExpiredOtps()
}

export async function verifyOtp(
  phone: string, 
  otp: string
): Promise<{ id: string, name: string } | null> {
  // Test phone number - remove in production
  if (phone === '9019977375') {
    return { id: phone, name: phone }
  }
  
  const entry = otpStore.get(phone)
  
  if (!entry) {
    console.log(`No OTP entry found for phone: ${phone}`)
    return null
  }
  
  // Check if OTP has expired
  if (Date.now() > entry.expiresAt) {
    console.log(`OTP expired for phone: ${phone}`)
    otpStore.delete(phone)
    return null
  }
  
  // Increment attempt counter
  entry.attempts += 1
  
  // Check if max attempts exceeded
  if (entry.attempts > MAX_ATTEMPTS) {
    console.log(`Max attempts exceeded for phone: ${phone}`)
    otpStore.delete(phone)
    return null
  }
  
  // Verify OTP
  if (entry.otp === otp) {
    console.log(`OTP verified successfully for phone: ${phone}`)
    otpStore.delete(phone) // Remove used OTP
    return { id: phone, name: phone }
  }
  
  console.log(`Invalid OTP for phone: ${phone}. Attempts: ${entry.attempts}`)
  
  // Update the entry with new attempt count
  otpStore.set(phone, entry)
  
  return null
}

// Helper function to clean up expired OTPs
function cleanExpiredOtps(): void {
  const now = Date.now()
  for (const [phone, entry] of otpStore.entries()) {
    if (now > entry.expiresAt) {
      otpStore.delete(phone)
    }
  }
}

// Optional: Get remaining attempts for a phone number
export function getRemainingAttempts(phone: string): number {
  const entry = otpStore.get(phone)
  if (!entry || Date.now() > entry.expiresAt) {
    return MAX_ATTEMPTS
  }
  return Math.max(0, MAX_ATTEMPTS - entry.attempts)
}

// Optional: Check if OTP exists and is valid (without consuming it)
export function hasValidOtp(phone: string): boolean {
  const entry = otpStore.get(phone)
  return entry ? Date.now() <= entry.expiresAt : false
}