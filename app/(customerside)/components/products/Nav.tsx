'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { ShoppingBag, Package, TrendingUp, ChevronDown, Grid3X3, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import logo from '@/public/logo.svg'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import ProductCart from '@/lib/store'
import CartSidebar from './SideBar'
import { ModernSearchSystem } from './ModernBar'
import Image from 'next/image'

const shopCategories = [
  { name: 'Drip Pipe', href: '/products?category=1' },
  { name: 'Micro Tube', href: '/products?category=2' },
  { name: 'Drip Fittings', href: '/products?category=3' },
  { name: 'PVC Fittings', href: '/products?category=4' },
  { name: 'Turpentine Oil', href: '/products?category=5' },
  { name: 'PVC Gum', href: '/products?category=6' },
  { name: 'Nursery Cover', href: '/products?category=7' },
  { name: 'Rain Pipe', href: '/products?category=8' },
  { name: 'Consumer', href: '/products?category=9' },
]

export function NavBar() {
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch by only showing cart after mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Memoized active path checker
  const isActive = useCallback((path: string) => pathname === path, [pathname])

  // Updated navigation items without investors
  const navigationItems = useMemo(() => [
    { href: '/orders', icon: Package, label: 'Orders', isActive: isActive('/orders') },
  ], [isActive])

  // Mobile bottom dock navigation items
  const mobileNavItems = useMemo(() => [
    { href: '/', icon: Home, label: 'Home', isActive: isActive('/') },
    { href: '/products', icon: ShoppingBag, label: 'Products', isActive: isActive('/products') },
    { href: '/orders', icon: Package, label: 'Orders', isActive: isActive('/orders') },
  ], [isActive])

  return (
    <>
      {/* Mobile Bottom Dock Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-[#16a34a] px-4 py-1 shadow-2xl">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {/* Navigation Items */}
            {mobileNavItems.map(({ href, icon: Icon, label, isActive }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-white/20'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            ))}

            {/* Cart Button */}
            <div className="flex flex-col items-center space-y-1 px-3 py-2">
              {isClient ? (
                <div className="flex flex-col items-center space-y-1">
                  <CartSidebar />
                  <span className="text-xs font-medium text-white/80">Cart</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-1 text-white/80">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="text-xs font-medium">Cart</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Bar - Floating */}
      <nav className="hidden lg:block bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm lg:fixed lg:top-4 lg:left-4 lg:right-4 lg:rounded-2xl lg:shadow-xl lg:border lg:border-gray-200/80">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 w-full">
            {/* Logo Section - Responsive */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                <Image src={logo} alt='Techno' width={70} height={70} priority />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  Techno Industries
                </h1>
                <p className="text-xs text-gray-500 uppercase tracking-wide hidden sm:block">
                  Industrial Solutions
                </p>
              </div>
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="flex items-center space-x-8 flex-1 justify-center">
              {/* Shop Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 px-4 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
                  >
                    Shop
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2 bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-xl rounded-xl mt-2">
                  <DropdownMenuLabel className="text-sm font-bold text-gray-900 px-3 py-2">
                    Product Categories
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  {/* View All Products Option */}
                  <DropdownMenuItem className="p-0 mb-2">
                    <Link
                      href="/products"
                      className="w-full px-3 py-2.5 text-sm font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 block items-center"
                    >
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      View All Products
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <div className="space-y-1">
                    {shopCategories.map((category) => (
                      <DropdownMenuItem key={category.name} className="p-0">
                        <Link
                          href={category.href}
                          className="w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 block"
                        >
                          {category.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Desktop Navigation Links */}
              {navigationItems.map(({ href, icon: Icon, label, isActive }) => (
                <Link key={href} href={href}>
                  <Button
                    variant="ghost"
                    className={`h-10 px-4 text-sm font-medium transition-colors duration-200 rounded-xl ${
                      isActive
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Right Section - Desktop */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Desktop Search Bar */}
              <div className="block">
                <ModernSearchSystem onSearch={(query) => console.log('Search query:', query)} />
              </div>

              {/* Cart - Only render after client-side mount to prevent SSR errors */}
              <div className="relative">
                {isClient ? (
                  <CartSidebar />
                ) : (
                  // Placeholder that matches the CartSidebar dimensions to prevent layout shift
                  <Button
                    variant="ghost"
                    className="h-10 w-10 p-0 text-gray-700 hover:text-gray-900 hover:bg-gray-50 relative rounded-xl"
                    disabled
                  >
                    <ShoppingBag className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for floating navbar on large screens */}
      <div className="hidden lg:block h-24"></div>
    </>
  )
}