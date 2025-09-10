'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Grid3x3 } from 'lucide-react'

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

export default function CategoryFilter({ 
  categories, 
  currentCategory
}: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (categoryId === 'all') {
      params.delete('category')
    } else {
      params.set('category', categoryId)
    }
    
    // Reset to first page when changing category
    params.delete('page')
    
    router.push(`/products?${params.toString()}`)
  }

  const totalProducts = categories.reduce((sum, cat) => sum + cat._count.products, 0)

  // Desktop Sidebar - Always visible on desktop, hidden on mobile
  return (
    <div className="hidden lg:block">
      <Card className="border-0 bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Grid3x3 className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          </div>
          
          {/* Categories List */}
          <div className="space-y-2">
            {/* All Categories */}
            <button
              onClick={() => handleCategoryChange('all')}
              className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all duration-200 ${
                !currentCategory || currentCategory === 'all'
                  ? 'bg-gray-100 text-gray-900 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">All Categories</span>
              <span className={`text-sm px-2 py-1 rounded-lg ${
                !currentCategory || currentCategory === 'all'
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {totalProducts}
              </span>
            </button>
            
            {/* Individual Categories */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id.toString())}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all duration-200 ${
                  currentCategory === category.id.toString()
                    ? 'bg-gray-100 text-gray-900 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium truncate pr-3">{category.name}</span>
                <span className={`text-sm px-2 py-1 rounded-lg flex-shrink-0 ${
                  currentCategory === category.id.toString()
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {category._count.products}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}