'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Menu, ShoppingBag, Package, TrendingUp, ChevronDown, Grid3X3, Search, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import logo from '@/public/logo.svg'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch by only showing cart after mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Optimized search handler with useCallback
  const handleSearch = useCallback((query: string) => {
    console.log('Search query:', query)
    setShowMobileSearch(false)
  }, [])

  // Memoized active path checker
  const isActive = useCallback((path: string) => pathname === path, [pathname])

  // Optimized mobile menu closer
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  // Memoized toggle handlers
  const toggleMobileSearch = useCallback(() => {
    setShowMobileSearch(prev => !prev)
  }, [])

  // Memoized navigation items for better performance
  const navigationItems = useMemo(() => [
    { href: '/orders', icon: Package, label: 'Orders', isActive: isActive('/orders') },
    { href: '/investor', icon: TrendingUp, label: 'Investors', isActive: isActive('/investor') },
  ], [isActive])

  return (
    <>
      {/* Mobile Dock-style Navigation Bar */}
      <nav className="bg-white border-b border-gray-200/50 sticky top-0 z-50 shadow-lg lg:hidden">
        <div className="">
          <div className="bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-xl px-4">
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

              {/* Right Section - Mobile */}
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                {/* Mobile Search Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
                  onClick={toggleMobileSearch}
                >
                  <Search className="h-5 w-5" />
                </Button>

                {/* Cart - Only render after client-side mount to prevent SSR errors */}
                <div className="relative">
                  {isClient ? (
                    <CartSidebar />
                  ) : (
                    // Placeholder that matches the CartSidebar dimensions to prevent layout shift
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 text-gray-700 hover:text-gray-900 hover:bg-gray-50 relative rounded-xl"
                      disabled
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {/* Mobile Menu Trigger */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-full sm:w-80 bg-white border-l border-gray-200 p-0"
                  >
                    <SheetHeader className="p-6 pb-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                            <Image src={logo} alt='Techno' width={24} height={24} />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-gray-900">Techno Industries</h2>
                          </div>
                        </div>
                      </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
                      <div className="p-6 space-y-6">
                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3">
                          <Link
                            href="/"
                            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                              isActive('/')
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                            onClick={closeMobileMenu}
                          >
                            <Home className="w-6 h-6 mb-2" />
                            <span className="text-sm font-medium">Home</span>
                          </Link>
                          <Link
                            href="/products"
                            className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700 transition-all duration-200"
                            onClick={closeMobileMenu}
                          >
                            <ShoppingBag className="w-6 h-6 mb-2" />
                            <span className="text-sm font-medium">All Products</span>
                          </Link>
                        </div>

                        <Separator />

                        {/* Main Navigation Links */}
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3 px-2">Main Menu</h3>
                          {navigationItems.map(({ href, icon: Icon, label, isActive }) => (
                            <Link
                              key={href}
                              href={href}
                              className={`flex items-center space-x-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                                isActive
                                  ? 'text-green-700 bg-green-50 border border-green-200'
                                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                              onClick={closeMobileMenu}
                            >
                              <Icon className="w-5 h-5" />
                              <span>{label === 'Orders' ? 'My Orders' : label}</span>
                            </Link>
                          ))}
                        </div>

                        <Separator />

                        {/* Product Categories */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3 px-2">Product Categories</h3>
                          <div className="space-y-1">
                            {shopCategories.map((category) => (
                              <Link
                                key={category.name}
                                href={category.href}
                                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
                                onClick={closeMobileMenu}
                              >
                                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                                {category.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar - Collapsible */}
          {showMobileSearch && (
            <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
              <div className="bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-xl px-4 py-3">
                <ModernSearchSystem onSearch={handleSearch} isMobileIcon={false} />
              </div>
            </div>
          )}
        </div>
      </nav>

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
                      className="w-full px-3 py-2.5 text-sm font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 block flex items-center"
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
                <ModernSearchSystem onSearch={handleSearch} />
              </div>

              {/* Cart - Only render after client-side mount to prevent SSR errors */}
              <div className="relative">
                {isClient ? (
                  <CartSidebar />
                ) : (
                  // Placeholder that matches the CartSidebar dimensions to prevent layout shift
                  <Button
                    variant="ghost"
                    size="sm"
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