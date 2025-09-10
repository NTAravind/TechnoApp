import { auth } from '@/auth'
import { PrismaClient } from '@/app/generated/prisma'
import { unstable_cache } from 'next/cache'
import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { HomePageClient } from './components/HomeClient'
import NotificationSubscriptionPrompt from '@/app/(customerside)/components/PushNotification'
import type { Metadata } from 'next'

const prisma = new PrismaClient()

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

// Enhanced cached categories with aggressive caching
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
  ['enhanced-categories-v2'],
  { 
    revalidate: 86400, // 24 hours - categories don't change often
    tags: ['categories', 'products']
  }
)

// Featured products with longer cache time
const getCachedFeaturedProducts = unstable_cache(
  async () => {
    try {
      return await prisma.product.findMany({
        where: { 
          isVisible: true,
          imgurl: { not: null } // Only get products with images
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
  ['featured-products-v2'],
  { 
    revalidate: 7200, // 2 hours
    tags: ['products', 'featured']
  }
)

// Latest products with shorter cache for freshness
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
  ['latest-products-v2'],
  { 
    revalidate: 3600, // 1 hour
    tags: ['products', 'latest']
  }
)

// Global stats cached for longer periods
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
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
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
  ['global-stats'],
  { 
    revalidate: 21600, // 6 hours
    tags: ['stats', 'products', 'categories']
  }
)

// Customer-specific data with shorter cache
async function getCachedCustomerStats(customerId: number) {
  return unstable_cache(
    async () => {
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

        const globalStats = await getCachedGlobalStats()
        
        return { 
          totalOrders, 
          pendingOrders, 
          latestProducts: globalStats.latestProducts 
        }
      } catch (error) {
        console.error('Error fetching customer stats:', error)
        return { totalOrders: 0, pendingOrders: 0, latestProducts: 0 }
      }
    },
    [`customer-stats-${customerId}`],
    { 
      revalidate: 1800, // 30 minutes
      tags: [`customer-${customerId}`, 'orders']
    }
  )()
}

async function getCachedRecentOrders(customerId: number) {
  return unstable_cache(
    async () => {
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
    },
    [`recent-orders-${customerId}`],
    { 
      revalidate: 1800, // 30 minutes
      tags: [`customer-${customerId}`, 'orders']
    }
  )()
}

// Server action to get category products count with caching
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
    [`category-count-${categoryId}`],
    { 
      revalidate: 7200, // 2 hours
      tags: ['categories', 'products', `category-${categoryId}`]
    }
  )()
}

// Cache revalidation actions
export async function revalidateHomeCache() {
  'use server'
  revalidateTag('products')
  revalidateTag('categories')
  revalidateTag('featured')
  revalidateTag('latest')
  revalidateTag('stats')
}

export async function revalidateCustomerCache(customerId: number) {
  'use server'
  revalidateTag(`customer-${customerId}`)
  revalidateTag('orders')
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

// Metadata for SEO
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

// Static generation configuration
export const dynamic = 'force-dynamic' // Due to auth requirements
export const revalidate = 3600 // 1 hour for ISR fallback

export default async function HomePage() {
  const session = await auth()
  const phone = session?.user?.name as string

  if (!phone) {
    redirect('/login')
  }

  // Get customer data with caching
  const customer = await unstable_cache(
    async () => {
      return await prisma.customer.findUnique({
        where: { phone },
        select: { 
          id: true, 
          name: true,
          phone: true 
        }
      })
    },
    [`customer-${phone}`],
    { 
      revalidate: 3600, // 1 hour
      tags: [`customer-${phone}`]
    }
  )()

  if (!customer) {
    redirect('/login')
  }

  // Fetch all data in parallel with optimized caching
  const [
    categories, 
    featuredProducts, 
    latestProducts, 
    stats, 
    recentOrders
  ] = await Promise.all([
    getCachedCategories(),
    getCachedFeaturedProducts(),
    getCachedLatestProducts(),
    getCachedCustomerStats(customer.id),
    getCachedRecentOrders(customer.id)
  ])

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