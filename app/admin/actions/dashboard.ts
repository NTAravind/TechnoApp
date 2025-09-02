// actions/dashboard-actions.ts
'use server'
import { prisma } from '@/lib/prisma'
import { DashboardStats } from '@/types/dashboard'
import { revalidatePath, revalidateTag } from 'next/cache'
import { unstable_cache } from 'next/cache'

// Cache the dashboard stats for 5 minutes
export const getCachedDashboardStats = unstable_cache(
  async (): Promise<DashboardStats> => {
    return getDashboardStatsInternal()
  },
  ['dashboard-stats'],
  {
    revalidate: 300, // 5 minutes
    tags: ['dashboard']
  }
)

async function getDashboardStatsInternal(): Promise<DashboardStats> {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      totalCategories,
      revenueData,
      paidOrders,
      pendingOrders,
      deliveredOrders,
      todayOrders,
      todayRevenueData,
      monthlyRevenueData,
      topCustomersData,
      recentOrders,
      topProductsData,
      salesTrendData
    ] = await Promise.all([
      // Basic counts
      prisma.product.count({
        where: { isVisible: true }
      }),
      prisma.order.count(),
      prisma.customer.count(),
      prisma.category.count(),

      // Revenue from paid orders only
      prisma.order.aggregate({
        where: { paid: true },
        _sum: { total: true }
      }),

      // Order status counts
      prisma.order.count({
        where: { paid: true }
      }),
      prisma.order.count({
        where: {
          paid: false,
          complete: false
        }
      }),
      prisma.order.count({
        where: { delivered: true }
      }),

      // Today's stats
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfDay
          }
        }
      }),
      prisma.order.aggregate({
        where: {
          paid: true,
          createdAt: {
            gte: startOfDay
          }
        },
        _sum: { total: true }
      }),

      // Monthly revenue
      prisma.order.aggregate({
        where: {
          paid: true,
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: { total: true }
      }),

      // Top customers by total spent
      prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          orders: {
            where: { paid: true },
            select: {
              total: true
            }
          }
        },
        take: 10
      }),

      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              name: true,
              phone: true
            }
          },
          items: {
            select: {
              quantity: true,
              price: true,
              product: {
                select: {
                  name: true,
                  sku: true
                }
              }
            }
          }
        }
      }),

      // Optimized top products query - get product details in single query
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true
        },
        where: {
          order: {
            paid: true
          }
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 10
      }),

      // Sales trend for last 30 days
      prisma.order.findMany({
        where: {
          paid: true,
          createdAt: {
            gte: last30Days
          }
        },
        select: {
          total: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
    ])

    // Process top customers data
    const topCustomers = topCustomersData
      .map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalOrders: customer.orders.length,
        totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0)
      }))
      .filter(customer => customer.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)

    // Optimized: Get all product details in one query
    const productIds = topProductsData.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true
      }
    })

    // Create product lookup map
    const productMap = new Map(products.map(p => [p.id, p]))

    // Process top products data with product details
    const topProductsWithDetails = topProductsData.map((item) => {
      const product = productMap.get(item.productId)
      return {
        id: item.productId,
        name: product?.name || 'Unknown Product',
        sku: product?.sku || 'N/A',
        totalSold: item._sum.quantity || 0,
        revenue: (item._sum.quantity || 0) * (product?.price || 0)
      }
    })

    // Process sales trend data - group by date
    const salesByDate = salesTrendData.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { orders: 0, revenue: 0 }
      }
      acc[date].orders += 1
      acc[date].revenue += order.total
      return acc
    }, {} as Record<string, { orders: number; revenue: number }>)

    // Fill in missing dates with zero values
    const salesTrend = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      salesTrend.push({
        date: dateStr,
        orders: salesByDate[dateStr]?.orders || 0,
        revenue: salesByDate[dateStr]?.revenue || 0
      })
    }

    return {
      totalProducts,
      totalOrders,
      totalCustomers,
      totalCategories,
      totalRevenue: revenueData._sum.total || 0,
      paidOrders,
      pendingOrders,
      deliveredOrders,
      todayOrders,
      todayRevenue: todayRevenueData._sum.total || 0,
      monthlyRevenue: monthlyRevenueData._sum.total || 0,
      topCustomers,
      recentOrders,
      topProducts: topProductsWithDetails,
      salesTrend
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    throw new Error('Failed to fetch dashboard statistics')
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return getCachedDashboardStats()
}

export async function refreshDashboard() {
  try {
    // Revalidate specific paths
    revalidatePath('/admin')
    revalidatePath('/admin/dashboard')
    
    // Revalidate the cache tag directly (this is the correct Next.js 14+ way)
    revalidateTag('dashboard')
    
    return { success: true }
  } catch (error) {
    console.error('Failed to refresh dashboard:', error)
    throw new Error('Failed to refresh dashboard')
  }
}

// Additional action for real-time stats (not cached)
export async function getDashboardStatsRealtime(): Promise<DashboardStats> {
  return getDashboardStatsInternal()
}

// Action to get order analytics
export async function getOrderAnalytics(days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        id: true,
        total: true,
        paid: true,
        delivered: true,
        complete: true,
        createdAt: true,
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const paidOrders = orders.filter(o => o.paid)
    const analytics = {
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      deliveredOrders: orders.filter(o => o.delivered).length,
      completedOrders: orders.filter(o => o.complete).length,
      totalRevenue: paidOrders.reduce((sum, o) => sum + o.total, 0),
      averageOrderValue: paidOrders.length > 0
        ? paidOrders.reduce((sum, o) => sum + o.total, 0) / paidOrders.length
        : 0
    }

    return { orders, analytics }
  } catch (error) {
    console.error('Failed to fetch order analytics:', error)
    throw new Error('Failed to fetch order analytics')
  }
}

// Action to get product performance
export async function getProductPerformance() {
  try {
    // More efficient query using joins
    const products = await prisma.product.findMany({
      where: {
        isVisible: true
      },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        category: {
          select: {
            name: true
          }
        },
        orderItems: {
          where: {
            order: {
              paid: true
            }
          },
          select: {
            quantity: true,
            price: true
          }
        }
      }
    })

    const performance = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || 'No Category',
      price: product.price,
      totalSold: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      revenue: product.orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0),
      orderCount: product.orderItems.length
    })).sort((a, b) => b.totalSold - a.totalSold)

    return performance
  } catch (error) {
    console.error('Failed to fetch product performance:', error)
    throw new Error('Failed to fetch product performance')
  }
}

// Action to get customer insights
export async function getCustomerInsights() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            paid: true,
            createdAt: true
          }
        }
      }
    })

    const insights = customers.map(customer => {
      const paidOrders = customer.orders.filter(o => o.paid)
      const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0)
      const lastOrderDate = customer.orders.length > 0
        ? Math.max(...customer.orders.map(o => o.createdAt.getTime()))
        : null

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isDistributor: customer.isDistributor,
        totalOrders: customer.orders.length,
        paidOrders: paidOrders.length,
        totalSpent,
        averageOrderValue: paidOrders.length > 0 ? totalSpent / paidOrders.length : 0,
        lastOrderDate: lastOrderDate ? new Date(lastOrderDate) : null,
        daysSinceLastOrder: lastOrderDate
          ? Math.floor((Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24))
          : null
      }
    }).sort((a, b) => b.totalSpent - a.totalSpent)

    return insights
  } catch (error) {
    console.error('Failed to fetch customer insights:', error)
    throw new Error('Failed to fetch customer insights')
  }
}