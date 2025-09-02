'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  id: number
  name: string
  _count: {
    products: number
  }
}

interface CategoryFilterProps {
  categories: Category[]
  currentCategory?: string
}

export default function CategoryFilter({ categories, currentCategory }: CategoryFilterProps) {
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get('search')
  const currentLimit = searchParams.get('limit')

  // Helper function to build URL with preserved params
  const buildUrl = (category?: string) => {
    const params = new URLSearchParams()
    
    if (currentSearch) params.set('search', currentSearch)
    if (category && category !== 'all') params.set('category', category)
    if (currentLimit) params.set('limit', currentLimit)
    
    return `/products${params.toString() ? `?${params.toString()}` : ''}`
  }

  const totalProducts = categories.reduce((sum, cat) => sum + cat._count.products, 0)
  const hasActiveCategory = currentCategory && currentCategory !== 'all'

  return (
    <div className="space-y-6">
      {/* Mobile Sheet Trigger */}
      <div className="lg:hidden">
        <Sheet >
          <SheetTrigger asChild>
         <Button
  variant="outline"
  className="w-full flex items-center justify-between gap-2 border-gray-300 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100"
>
  <div className="flex items-center gap-2">
    <Filter className="w-4 h-4 text-gray-500" />
    <span className="font-semibold">Category</span>
  </div>
  {hasActiveCategory && (
    <Badge variant="secondary" className="bg-green-100 text-green-700 font-bold">
      {categories.find(cat => cat.id.toString() === currentCategory)?.name}
    </Badge>
  )}
</Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white/95 backdrop-blur-md p-10">
            <SheetHeader>
              <SheetTitle>Filter by Category</SheetTitle>
              <SheetDescription>
                Select a category to filter products
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-3">
              {/* All Categories */}
              <Link href={buildUrl('all')}>
                <div className={cn(
                  "group flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer",
                  "border-b border-gray-100", // Added border for separation
                  (!currentCategory || currentCategory === 'all') 
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:from-green-600 hover:to-green-700" 
                    : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                )}>
                  <span className="font-semibold">All Categories</span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs font-bold rounded-lg",
                      (!currentCategory || currentCategory === 'all')
                        ? "bg-white/20 text-white" 
                        : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                    )}
                  >
                    {totalProducts}
                  </Badge>
                </div>
              </Link>

              {/* Individual Categories */}
              {categories.map((category) => {
                const isActive = currentCategory === category.id.toString()
                return (
                  <Link key={category.id} href={buildUrl(category.id.toString())}>
                    <div className={cn(
                      "group flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer",
                      "border-b border-gray-100", // Added border for separation
                      isActive 
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:from-green-600 hover:to-green-700" 
                        : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                    )}>
                      <span className="font-semibold">{category.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs font-bold rounded-lg",
                          isActive
                            ? "bg-white/20 text-white" 
                            : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                        )}
                      >
                        {category._count.products}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
            {hasActiveCategory && (
              <div className="mt-4 p-4 bg-green-50/80 border border-green-200/60 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">
                      Showing: <span className="font-bold text-green-700">
                        {categories.find(cat => cat.id.toString() === currentCategory)?.name}
                      </span>
                    </span>
                  </div>
                  <Link href={buildUrl('all')}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar - Unchanged */}
      <div className="hidden lg:block">
        <Card className="bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <Filter className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Categories</h3>
              </div>
              {hasActiveCategory && (
                <Link href={buildUrl('all')}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="space-y-2">
              {/* All Categories */}
              <Link href={buildUrl('all')}>
                <div className={cn(
                  "group flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer",
                  "border-b border-gray-100 pb-3", // Added border-b and extra padding
                  (!currentCategory || currentCategory === 'all') 
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:from-green-600 hover:to-green-700" 
                    : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                )}>
                  <span className="font-semibold">All Categories</span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs font-bold rounded-lg",
                      (!currentCategory || currentCategory === 'all')
                        ? "bg-white/20 text-white" 
                        : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                    )}
                  >
                    {totalProducts}
                  </Badge>
                </div>
              </Link>

              {/* Individual Categories */}
              {categories.map((category) => {
                const isActive = currentCategory === category.id.toString()
                
                return (
                  <Link key={category.id} href={buildUrl(category.id.toString())}>
                    <div className={cn(
                      "group flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer",
                      "border-b border-gray-100 pb-3", // Added border-b and extra padding
                      isActive 
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:from-green-600 hover:to-green-700" 
                        : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                    )}>
                      <span className="font-semibold">{category.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs font-bold rounded-lg",
                          isActive
                            ? "bg-white/20 text-white" 
                            : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                        )}
                      >
                        {category._count.products}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Active Filter Indicator */}
        {hasActiveCategory && (
          <div className="mt-4 p-4 bg-green-50/80 backdrop-blur-sm border border-green-200/60 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  Showing: <span className="font-bold text-green-700">
                    {categories.find(cat => cat.id.toString() === currentCategory)?.name}
                  </span>
                </span>
              </div>
              <Link href={buildUrl('all')}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}