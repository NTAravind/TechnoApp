// app/partner/actions/dashboard.ts
'use server'

import { prisma } from '@/lib/prisma'

export async function getPartnerStats(partnerId: string) {
  try {
    // Get all products for this partner
    const products = await prisma.product.findMany({
      where: { partnerId },
      select: {
        id: true,
        isVisible: true,
      },
    })

    const productIds = products.map(p => p.id)

    // Get all orders that contain this partner's products
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
    const uniqueOrders = new Map()
    orderItems.forEach(item => {
      if (!uniqueOrders.has(item.order.id)) {
        uniqueOrders.set(item.order.id, item.order)
      }
    })

    const orders = Array.from(uniqueOrders.values())

    // Calculate statistics
    const totalRevenue = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalOrders = orders.length
    const completedOrders = orders.filter(o => o.complete).length
    const pendingOrders = orders.filter(o => !o.complete && o.paid).length
    const unpaidOrders = orders.filter(o => !o.paid).length

    // Monthly stats (current month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const monthlyOrderItems = orderItems.filter(item => 
      new Date(item.order.createdAt) >= startOfMonth
    )
    
    const monthlyOrderMap = new Map()
    monthlyOrderItems.forEach(item => {
      if (!monthlyOrderMap.has(item.order.id)) {
        monthlyOrderMap.set(item.order.id, item.order)
      }
    })

    const monthlyRevenue = monthlyOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const monthlyOrders = monthlyOrderMap.size

    // Get unique customers
    const customerIds = new Set(orders.map(o => o.customerId))

    // Get recent orders (last 5)
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)

    return {
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        completedOrders,
        pendingOrders,
        unpaidOrders,
        totalProducts: products.length,
        visibleProducts: products.filter(p => p.isVisible).length,
        totalCustomers: customerIds.size,
        monthlyRevenue,
        monthlyOrders,
        recentOrders,
      },
    }
  } catch (error) {
    console.error('Error fetching partner stats:', error)
    return {
      success: false,
      error: 'Failed to fetch dashboard statistics',
    }
  }
}