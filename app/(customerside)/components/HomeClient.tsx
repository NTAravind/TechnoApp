'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingBag, 
  Package, 
  Clock, 
  Star, 
  ArrowRight, 
  Truck,
  Bell,
  BellOff,
  Grid3X3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModernSearchSystem } from '@/app/(customerside)/components/products/ModernBar'
import ProductCard from '@/app/(customerside)/components/products/productcard'
import dynamic from 'next/dynamic'
import Image from 'next/image'

// Dynamically import the notification component to avoid SSR issues
const NotificationSubscriptionPrompt = dynamic(
  () => import('@/app/(customerside)/components/PushNotification'),
  { ssr: false }
)

// Type definitions
interface Category {
  id: number
  name: string
  _count: {
    products: number
  }
  imageUrl?: string | null
}

interface Product {
  id: number
  name: string
  price: number
  size: number[]
  weight?: string | null
  unit: string
  imgurl: string | null
  packaging: number | null
  LooseSell: boolean
  categoryId: number
  category: {
    name: string
  }
}

interface Order {
  id: string
  items: number
  total: number
  status: string
  date: string
}

interface Stats {
  totalOrders: number
  pendingOrders: number
  latestProducts: number
}

interface HomePageClientProps {
  customerName: string
  customerId: string
  categories: Category[]
  featuredProducts: Product[]
  latestProducts: Product[]
  stats: Stats
  recentOrders: Order[]
  getCategoryProductsCount: (categoryId: number) => Promise<number>
}

// Updated Header Component
const Header = ({ 
  customerName, 
  onNotificationClick,
  isNotificationSubscribed,
  hasNotificationPrompt 
}: { 
  customerName: string
  onNotificationClick: () => void
  isNotificationSubscribed: boolean
  hasNotificationPrompt: boolean
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-background">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-primary">
            {customerName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-0.5">Welcome</p>
          <p className="font-semibold text-base">{customerName}</p>
        </div>
      </div>
      <div className="relative">
        <Button 
          size="sm"
          className={`rounded-lg w-12 h-12 p-0 flex items-center justify-center transition-all duration-200 ${
            isNotificationSubscribed 
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
          }`}
          onClick={onNotificationClick}
        >
          {isNotificationSubscribed ? (
            <Bell className="h-5 w-5 text-white fill-current" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </Button>
        
        {/* Show notification dot if there's a prompt available and not subscribed */}
        {hasNotificationPrompt && !isNotificationSubscribed && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
        
        {/* Show active indicator for subscribed users */}
        {isNotificationSubscribed && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
        )}
      </div>
    </div>
  )
}

// Search Section Component - Using ModernSearchSystem
const SearchSection = ({ categories }: { categories: Category[] }) => {
  return (
    <div className="px-6 mb-6">
      <ModernSearchSystem 
        categories={categories}
        variant={'outlined'}
      />
    </div>
  )
}

// Home Card Component
function HomeCard() {
  return (
    <div className="px-6 mb-6">
      <Card className="bg-[#16a34a] text-white">
        <CardContent className="px-6 py-5">
          <h1 className="text-xl font-bold mb-2">Welcome To Techno Industries</h1>
          <p className="text-sm opacity-90">Where Quality Meets Trust</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Quick Stats Component - Updated to show latest products instead of favorites
const QuickStats = ({ stats }: { stats: Stats }) => {
  return (
    <div className="px-6 mb-8">
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="px-4 py-5 text-center">
            <Package className="h-6 w-6 text-primary mx-auto mb-3" />
            <p className="text-2xl font-bold mb-1">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/5 border-secondary/20">
          <CardContent className="px-4 py-5 text-center">
            <Clock className="h-6 w-6 text-secondary-foreground mx-auto mb-3" />
            <p className="text-2xl font-bold mb-1">{stats.pendingOrders}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="px-4 py-5 text-center">
            <Package className="h-6 w-6 text-accent-foreground mx-auto mb-3" />
            <p className="text-2xl font-bold mb-1">{stats.latestProducts}</p>
            <p className="text-xs text-muted-foreground">New Items</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Enhanced Static Categories Grid Component
const CategoriesGrid = ({ 
  categories, 
  onCategoryClick 
}: { 
  categories: Category[]
  onCategoryClick: (categoryId: number) => void 
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between px-6 mb-5">
        <h2 className="text-xl font-bold">Categories</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary px-3 py-2" 
          onClick={() => onCategoryClick(0)}
        >
          View All <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {/* Static Grid Layout - Mobile (2 columns) and Desktop (3 columns) */}
      <div className="px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((category) => (
            <Card 
              key={category.id} 
              className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border border-muted hover:border-primary/20 hover:-translate-y-1"
              onClick={() => onCategoryClick(category.id)}
            >
              <CardContent className="p-0">
                {/* Image Container with Fixed Aspect Ratio */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover transition-all duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      priority={category.id <= 4} // Prioritize first 4 images
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                      <Grid3X3 className="h-8 w-8 sm:h-10 sm:w-10 text-primary/70" />
                    </div>
                  )}
                  
                  {/* Subtle overlay for better text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  
                  {/* Product count badge - Top right corner */}
                  <div className="absolute top-2 right-2 transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-2 py-1 bg-white/95 backdrop-blur-sm text-gray-700 border border-gray-200/50 shadow-sm font-medium"
                    >
                      {category._count.products}
                    </Badge>
                  </div>
                </div>
                
                {/* Content Section with Fixed Height for Uniformity */}
                <div className="p-3 sm:p-4 h-16 sm:h-18 flex items-center justify-center bg-white group-hover:bg-gray-50/50 transition-colors duration-300">
                  <h3 className="font-semibold text-sm sm:text-base leading-tight text-center text-gray-800 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                    {category.name}
                  </h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Show remaining categories button if there are more than 8 */}
        {categories.length > 8 && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => onCategoryClick(0)}
              className="px-6 py-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-300"
            >
              View All {categories.length} Categories
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Featured Products Component - Updated to use ProductCard
const FeaturedProducts = ({ 
  products, 
  onProductClick 
}: { 
  products: Product[]
  onProductClick: (productId: number) => void 
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between px-6 mb-5">
        <h2 className="text-xl font-bold">Featured Products</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary px-3 py-2" 
          onClick={() => onProductClick(0)}
        >
          View All <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="px-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Recent Orders Component
const RecentOrders = ({ 
  orders, 
  onViewAllOrders 
}: { 
  orders: Order[]
  onViewAllOrders: () => void 
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200'
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="mb-8">
        <div className="px-6 mb-5">
          <h2 className="text-xl font-bold">Recent Orders</h2>
        </div>
        <div className="px-6">
          <Card className='p-5'>
            <CardContent className="px-6 py-8 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">No orders yet</p>
              <Button onClick={() => window.location.href = '/products'}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between px-6 mb-5">
        <h2 className="text-xl font-bold">Recent Orders</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary px-3 py-2" 
          onClick={onViewAllOrders}
        >
          View All <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="px-6">
        <div className="space-y-4">
          {orders.slice(0, 2).map((order) => (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-all duration-200">
              <CardContent className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium">Order #{order.id.slice(-6).toUpperCase()}</p>
                  <Badge className={`text-xs px-2 py-1 ${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>{order.items} items</span>
                  <span>{order.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                  {order.status === 'delivered' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Truck className="h-4 w-4" />
                      <span className="text-xs">Delivered</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Main Client Component
export function HomePageClient({
  customerName,
  customerId,
  categories,
  featuredProducts,
  latestProducts,
  stats,
  recentOrders,
  getCategoryProductsCount
}: HomePageClientProps) {
  const router = useRouter()
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)
  const [hasNotificationPrompt, setHasNotificationPrompt] = useState(false)
  const [isNotificationSubscribed, setIsNotificationSubscribed] = useState(false)

  // Check notification status on component mount
  useEffect(() => {
    const checkNotificationStatus = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
          })
          const existingSub = await registration.pushManager.getSubscription()
          
          // Update subscription status
          setIsNotificationSubscribed(!!existingSub)
          
          // Show prompt indicator if not subscribed and permission not denied
          const shouldShowPrompt = !existingSub && 
            Notification.permission !== 'denied' && 
            !localStorage.getItem('notification-prompt-dismissed')
          
          setHasNotificationPrompt(shouldShowPrompt)
        } catch (error) {
          console.error('Error checking notification status:', error)
        }
      }
    }

    checkNotificationStatus()
  }, [])

  // Add custom CSS for line-clamp and other utilities
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Navigation handlers
  const handleNotificationClick = () => {
    if (isNotificationSubscribed) {
      // If subscribed, show unsubscribe confirmation in the notification component
      setShowNotificationPrompt(true)
    } else {
      // If not subscribed, show subscription prompt
      setShowNotificationPrompt(true)
    }
  }

  const handleSubscriptionChange = (subscribed: boolean) => {
    setIsNotificationSubscribed(subscribed)
    // Update prompt status when subscription changes
    if (subscribed) {
      setHasNotificationPrompt(false)
    }
  }

  const handleCategoryClick = (categoryId: number) => {
    if (categoryId === 0) {
      router.push('/products')
    } else {
      router.push(`/products?category=${categoryId}`)
    }
  }

  const handleProductClick = (productId: number) => {
    if (productId === 0) {
      router.push('/products')
    } else {
      router.push(`/products/${productId}`)
    }
  }

  const handleViewAllOrders = () => {
    router.push('/orders')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        customerName={customerName} 
        onNotificationClick={handleNotificationClick}
        isNotificationSubscribed={isNotificationSubscribed}
        hasNotificationPrompt={hasNotificationPrompt}
      />
      
      <SearchSection categories={categories} />
     
      <HomeCard />
      
      <QuickStats stats={stats} />
      
      <CategoriesGrid 
        categories={categories} 
        onCategoryClick={handleCategoryClick}
      />
      
      <FeaturedProducts 
        products={featuredProducts}
        onProductClick={handleProductClick}
      />
      
      <RecentOrders 
        orders={recentOrders}
        onViewAllOrders={handleViewAllOrders}
      />

      {/* Notification Prompt - show when requested */}
      {showNotificationPrompt && (
        <NotificationSubscriptionPrompt 
          customerId={customerId}
          onSubscriptionChange={handleSubscriptionChange}
        />
      )}

      {/* Bottom spacing for mobile navigation */}
      <div className="pb-24" />
    </div>
  )
}