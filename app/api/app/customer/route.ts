import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { phone },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      isDistributor: customer.isDistributor,
      address: customer.Address,
      pincode: customer.pincode,
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { phone, name, email, address, pincode, isDistributor } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.update({
      where: { phone },
      data: {
        name: name || undefined,
        email: email || null,
        Address: address || null,
        pincode: pincode || null,
        isDistributor: isDistributor || undefined,
      },
    })

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
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}
