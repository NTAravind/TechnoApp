import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { HomePageClient } from './(customer)/components/HomeClient'
import type { Metadata } from 'next'

// Static category mappings for better mobile experience and fallback
const STATIC_CATEGORIES = [
  { id: 1, name: 'Drip Pipe', displayName: 'Drip Pipe', fallbackImage: '/images/categories/drip-pipe.jpg' },
  { id: 2, name: 'Micro Tube', displayName: 'Micro Tube', fallbackImage: '/images/categories/micro-tube.jpg' },
  { id: 3, name: 'Drip Fittings', displayName: 'Drip Fittings', fallbackImage: '/images/categories/drip-fittings.jpg' },
  { id: 4, name: 'PVC Fittings', displayName: 'PVC Fittings', fallbackImage: '/images/categories/pvc-fittings.jpg' },
  { id: 5, name: 'Turpentine Oil', displayName: 'Turpentine Oil', fallbackImage: '/images/categories/turpentine-oil.jpg' },
  { id: 6, name: 'PVC Gum', displayName: 'PVC Gum', fallbackImage: '/images/categories/pvc-gum.jpg' },
  { id: 7, name: 'Nursery Cover', displayName: 'Nursery Cover', fallbackImage: '/images/categories/nursery-cover.jpg' },
  { id: 8, name: 'Rain Pipe', displayName: 'Rain Pipe', fallbackImage: '/images/categories/rain-pipe.jpg' },
  { id: 9, name: 'Consumer', displayName: 'Consumer', fallbackImage: '/images/categories/consumer.jpg' },
]

// PERMANENT caching for categories (revalidate: false = cache forever)
const getCachedCategories = unstable_cache(
  async () => {
    try {
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { products: true }
          },
          products: {
            select: {
              imgurl: true
            },
            where: {
              isVisible: true,
              imgurl: {
                not: null
              }
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { name: 'asc' }
      })

      // Merge with static categories to ensure all categories are available
      return STATIC_CATEGORIES.map(staticCat => {
        const dbCategory = categories.find(cat => 
          cat.id === staticCat.id || 
          cat.name.toLowerCase().includes(staticCat.name.toLowerCase())
        )
        
        return {
          id: staticCat.id,
          name: staticCat.displayName,
          _count: {
            products: dbCategory?._count?.products || 0
          },
          imageUrl: dbCategory?.products?.[0]?.imgurl || staticCat.fallbackImage
        }
      })
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Return static categories as fallback
      return STATIC_CATEGORIES.map(staticCat => ({
        id: staticCat.id,
        name: staticCat.displayName,
        _count: { products: 0 },
        imageUrl: staticCat.fallbackImage
      }))
    }
  },
  ['categories-permanent-v3'],
  { 
    revalidate: false, // Cache permanently - only manual invalidation
    tags: ['categories']
  }
)

// PERMANENT caching for products (they don't change frequently)
const getCachedFeaturedProducts = unstable_cache(
  async () => {
    try {
      return await prisma.product.findMany({
        where: { 
          isVisible: true,
          imgurl: { not: null }
        },
        select: {
          id: true,
          name: true,
          price: true,
          size: true,
          weight: true,
          unit: true,
          imgurl: true,
          packaging: true,
          LooseSell: true,
          categoryId: true,
          category: {
            select: { name: true }
          }
        },
        take: 6,
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Error fetching featured products:', error)
      return []
    }
  },
  ['featured-products-permanent-v3'],
  { 
    revalidate: false, // Cache permanently
    tags: ['products', 'featured']
  }
)

// PERMANENT caching for latest products
const getCachedLatestProducts = unstable_cache(
  async () => {
    try {
      return await prisma.product.findMany({
        where: { 
          isVisible: true,
          imgurl: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        select: {
          id: true,
          name: true,
          price: true,
          size: true,
          weight: true,
          unit: true,
          imgurl: true,
          packaging: true,
          LooseSell: true,
          categoryId: true,
          category: {
            select: { name: true }
          }
        },
        take: 6,
        orderBy: [
          { createdAt: 'desc' }
        ]
      })
    } catch (error) {
      console.error('Error fetching latest products:', error)
      return []
    }
  },
  ['latest-products-permanent-v3'],
  { 
    revalidate: false, // Cache permanently
    tags: ['products', 'latest']
  }
)

// PERMANENT caching for global stats (except order-related stats)
const getCachedGlobalStats = unstable_cache(
  async () => {
    try {
      const [totalProducts, totalCategories, recentProductsCount] = await Promise.all([
        prisma.product.count({ where: { isVisible: true } }),
        prisma.category.count(),
        prisma.product.count({
          where: { 
            isVisible: true,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ])

      return { 
        totalProducts, 
        totalCategories, 
        latestProducts: recentProductsCount 
      }
    } catch (error) {
      console.error('Error fetching global stats:', error)
      return { totalProducts: 0, totalCategories: 0, latestProducts: 0 }
    }
  },
  ['global-stats-permanent-v3'],
  { 
    revalidate: false, // Cache permanently
    tags: ['stats', 'products', 'categories']
  }
)

// Orders are NOT permanently cached - they need to be fresh
async function getCustomerOrderStats(customerId: number) {
  try {
    const [totalOrders, pendingOrders] = await Promise.all([
      prisma.order.count({
        where: { customerId }
      }),
      prisma.order.count({
        where: { 
          customerId,
          complete: false
        }
      })
    ])

    return { totalOrders, pendingOrders }
  } catch (error) {
    console.error('Error fetching customer order stats:', error)
    return { totalOrders: 0, pendingOrders: 0 }
  }
}

// Recent orders are NOT cached - always fresh
async function getRecentOrders(customerId: number) {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId },
      select: {
        id: true,
        total: true,
        delivered: true,
        complete: true,
        createdAt: true,
        items: {
          select: {
            quantity: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    return orders.map(order => ({
      id: order.id,
      items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total: order.total,
      status: order.delivered ? 'delivered' : (order.complete ? 'processing' : 'pending'),
      date: getRelativeDate(order.createdAt)
    }))
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return []
  }
}

// PERMANENT caching for category product counts
async function getCategoryProductsCount(categoryId: number) {
  'use server'
  
  return unstable_cache(
    async () => {
      try {
        const count = await prisma.product.count({
          where: { 
            categoryId,
            isVisible: true 
          }
        })
        return count
      } catch (error) {
        console.error('Error fetching category products count:', error)
        return 0
      }
    },
    [`category-count-${categoryId}-permanent-v3`],
    { 
      revalidate: false, // Cache permanently
      tags: ['categories', 'products', `category-${categoryId}`]
    }
  )()
}

function getRelativeDate(date: Date) {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}

// SEO Metadata
export const metadata: Metadata = {
  title: 'Techno Industries - Quality Industrial Products',
  description: 'Welcome to Techno Industries - Where Quality Meets Trust. Shop drip pipes, micro tubes, PVC fittings and more.',
  keywords: ['techno industries', 'drip pipe', 'micro tube', 'PVC fittings', 'industrial products'],
  openGraph: {
    title: 'Techno Industries - Quality Industrial Products',
    description: 'Welcome to Techno Industries - Where Quality Meets Trust',
    type: 'website',
    locale: 'en_IN',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Force dynamic rendering due to auth and fresh order data
export const dynamic = 'force-dynamic'
export const revalidate = false // No automatic revalidation

export default async function HomePage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }
  
  const phone = session.user.name

  // Get customer data - this is fast and doesn't need caching
  const customer = await prisma.customer.findUnique({
    where: { phone },
    select: { 
      id: true, 
      name: true,
      phone: true 
    }
  })

  // Redirect if customer doesn't exist or name is not filled
  if (!customer || !customer.name || customer.name.trim() === '') {
    redirect('/profile/setup')
  }

  // Fetch cached data (permanent) and fresh order data in parallel
  const [
    categories, 
    featuredProducts, 
    latestProducts, 
    globalStats,
    orderStats,
    recentOrders
  ] = await Promise.all([
    getCachedCategories(), // Permanently cached
    getCachedFeaturedProducts(), // Permanently cached
    getCachedLatestProducts(), // Permanently cached
    getCachedGlobalStats(), // Permanently cached
    getCustomerOrderStats(customer.id), // Fresh data
    getRecentOrders(customer.id) // Fresh data
  ])

  // Combine stats
  const stats = {
    ...orderStats,
    latestProducts: globalStats.latestProducts
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto bg-background">
        <HomePageClient
          customerName={customer.name}
          customerId={customer.phone}
          categories={categories}
          featuredProducts={featuredProducts}
          latestProducts={latestProducts}
          stats={stats}
          recentOrders={recentOrders}
          getCategoryProductsCount={getCategoryProductsCount}
        />
      </div>
    </div>
  )
}