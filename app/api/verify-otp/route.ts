import { NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otpstore'
import { prisma } from '@/lib/prisma'

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

    // Test account bypass
    if (phone === '9019997375' && otp === '123456') {
      let customer = await prisma.customer.findUnique({
        where: { phone },
      })

      if (!customer) {
        customer = await prisma.customer.create({
          data: { name: phone, phone },
        })
      }

      return NextResponse.json({
        success: true,
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
      customer = await prisma.customer.create({
        data: {
          name: phone,
          phone,
        },
      })
    }

    return NextResponse.json({
      success: true,
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
