import { NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otpstore'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

function generateToken(): string {
  return uuidv4()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone, otp } = body

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone and OTP are required' },
        { status: 400 }
      )
    }

    const verified = await verifyOtp(phone, otp)

    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 401 }
      )
    }

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { phone },
    })

    if (!customer) {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          name: phone,
          phone,
        },
      })
    }

    // Generate a simple token (in production, use JWT)
    const token = generateToken()

    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        isDistributor: customer.isDistributor,
        address: customer.Address,
        pincode: customer.pincode,
      },
    })
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
