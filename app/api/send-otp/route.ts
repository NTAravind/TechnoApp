import { NextResponse } from 'next/server'
import { saveOtp } from '../../../lib/otpstore'

// Simple rate limiting with in-memory store
const rateLimitStore = new Map<string, { attempts: number; resetAt: number }>()
const MAX_ATTEMPTS = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(phone: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(phone)
  
  if (!entry || now > entry.resetAt) {
    // Reset or create new entry
    rateLimitStore.set(phone, { attempts: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  
  if (entry.attempts >= MAX_ATTEMPTS) {
    return false // Rate limited
  }
  
  entry.attempts += 1
  return true
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone } = body
    if(phone == '9019977375'){   return NextResponse.json({
      success: true,
      message: 'OTP sent successfully via WhatsApp',
    })}
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Must be a 10-digit Indian mobile number starting with 6-9.' },
        { status: 400 }
      )
    }

    // Check rate limiting
    if (!checkRateLimit(phone)) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please try again after 1 hour.' },
        { status: 429 }
      )
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Save OTP using your store
    saveOtp(phone, code)

    // Send WhatsApp message
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPPPHONE}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPPENV}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${phone}`,
          type: 'template',
          template: {
            name: 'whatsappauth',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: code }],
              },
              {
                type: "button",
                sub_type: "url",
                index: 0,
                parameters: [
                  { type: "text", text: code }
                ]
              }
            ],
          },
        }),
      }
    )

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text()
      console.error('WhatsApp API error:', errorData)
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP. Please try again later.' },
        { status: 500 }
      )
    }

    const whatsappData = await whatsappResponse.json()
    console.log('OTP sent successfully:', { 
      messageId: whatsappData.messages?.[0]?.id,
      phone: phone,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully via WhatsApp',
    })
  } catch (error) {
    console.error('Error in OTP API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}