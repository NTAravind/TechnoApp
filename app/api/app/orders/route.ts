import { NextResponse } from 'next/server'
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
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    imgurl: true,
                    unit: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone, items, total, paymentId } = body

    if (!phone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      )
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { phone },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        paid: !!paymentId,
        paymentid: paymentId || 'pending',
        delivered: false,
        complete: false,
        total: total || 0,
        items: {
          create: items.map((item: { productId: number; quantity: number; price: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        total: order.total,
        paid: order.paid,
        createdAt: order.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
