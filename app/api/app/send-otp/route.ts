import { NextResponse } from 'next/server'
import { saveOtp } from '@/lib/otpstore'

const rateLimitStore = new Map<string, { attempts: number; resetAt: number }>()
const MAX_ATTEMPTS = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(phone: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(phone)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(phone, { attempts: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    return false
  }

  entry.attempts += 1
  return true
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    if (!checkRateLimit(phone)) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please try again after 1 hour.' },
        { status: 429 }
      )
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    saveOtp(phone, code)

    // For demo purposes, return success
    // In production, integrate with WhatsApp/Twilio
    console.log(`OTP for ${phone}: ${code}`)

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    })
  } catch (error) {
    console.error('Error sending OTP:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
