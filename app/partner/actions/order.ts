// app/partner/actions/orders.ts
'use server'

import { prisma } from '@/lib/prisma'

export type PartnerOrder = {
  id: string
  customerId: number
  paid: boolean
  paymentid: string
  delivered: boolean
  complete: boolean
  total: number
  createdAt: Date
  updatedAt: Date
  customer: {
    id: number
    name: string
    phone: string
    email: string | null
    isDistributor: boolean
  }
  items: Array<{
    id: number
    quantity: number
    price: number
    product: {
      id: number
      name: string
      sku: string
      unit: string
    }
  }>
}

export async function getPartnerOrders(partnerId: string) {
  try {
    // Get all products for this partner
    const products = await prisma.product.findMany({
      where: { partnerId },
      select: { id: true },
    })

    const productIds = products.map(p => p.id)

    // Get all order items that contain this partner's products
    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId: { in: productIds },
      },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        product: true,
      },
    })

    // Get unique orders
    const uniqueOrdersMap = new Map()
    orderItems.forEach(item => {
      if (!uniqueOrdersMap.has(item.order.id)) {
        uniqueOrdersMap.set(item.order.id, item.order)
      }
    })

    const orders: PartnerOrder[] = Array.from(uniqueOrdersMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return {
      success: true,
      data: orders,
    }
  } catch (error) {
    console.error('Error fetching partner orders:', error)
    return {
      success: false,
      error: 'Failed to fetch orders',
      data: [],
    }
  }
}

export async function getPartnerOrderById(orderId: string, partnerId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      }
    }

    // Check if any of the order items belong to this partner
    const hasPartnerProduct = order.items.some(item => item.product.partnerId === partnerId)

    if (!hasPartnerProduct) {
      return {
        success: false,
        error: 'Unauthorized access to this order',
      }
    }

    return {
      success: true,
      data: order,
    }
  } catch (error) {
    console.error('Error fetching order:', error)
    return {
      success: false,
      error: 'Failed to fetch order details',
    }
  }
}