import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/app/(customerside)/(customer)/components/products/productcard'
import CategoryFilter from '../components/Category'
import { ModernSearchSystem } from '../components/products/ModernBar'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Grid3X3, Search, ShoppingBag } from 'lucide-react'
import ProductsClient from '../components/ProductClient'

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    page?: string
    limit?: string
    view?: string
  }>
}

interface Product {
  id: number
  name: string
  size: number[]
  imgurl: string | null
  unit: string
  price: number
  LooseSell: boolean,  
  packaging: number | null
  category: { name: string }
  categoryId: number
}

interface Category {
  id: number
  name: string
  _count: {
    products: number
  }
}

// Cache functions remain the same...
const fetchCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: {
              where: {
                isVisible: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    return categories
  },
  ['categories'],
  {
    tags: ['categories', 'products'],
    revalidate: false,
  }
)

const fetchProducts = unstable_cache(
  async (
    search?: string,
    categoryId?: string,
    page: number = 1,
    limit: number = 12
  ): Promise<{ products: Product[]; total: number }> => {
    const where: any = {
      isVisible: true,
    }

    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (categoryId && categoryId !== 'all') {
      const parsedCategoryId = parseInt(categoryId)
      if (!isNaN(parsedCategoryId)) {
        where.categoryId = parsedCategoryId
      }
    }

    const total = await prisma.product.count({ where })
    const productsRaw = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        size: true,
        imgurl: true,
        unit: true,
        price: true,
        packaging: true,
        LooseSell: true,
        category: { select: { name: true } },
        categoryId: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const products = productsRaw.map((p) => ({
      ...p,
      imgurl: p.imgurl ?? '',
    })) as Product[]

    return { products, total }
  },
  ['products'],
  {
    tags: ['products'],
    revalidate: false,
  }
)

// Enhanced skeleton components
function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 bg-white rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="aspect-square bg-gray-100 rounded-xl mb-4 animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse" />
            <div className="h-6 bg-gray-100 rounded w-16 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryFilterSkeleton() {
  return (
    <div className="hidden lg:block">
      <Card className="border-0 bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-6 w-10 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SearchBarSkeleton() {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="relative flex-1">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 bg-gray-300 rounded animate-pulse" />
        <Skeleton className="w-full h-12 rounded-2xl" />
      </div>
      <Skeleton className="h-12 w-12 rounded-xl" />
    </div>
  )
}

async function ProductGrid({
  search,
  category,
  page = 1,
  limit = 12
}: {
  search?: string
  category?: string
  page?: number
  limit?: number
}) {
  const categoryId = category && category !== 'all' && category !== 'undefined' ? category : undefined
  const { products, total } = await fetchProducts(search, categoryId, page, limit)
  const totalPages = Math.ceil(total / limit)

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Grid3X3 className="w-10 h-10 text-gray-400" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            No products found
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {search || (category && category !== 'all')
              ? "Try adjusting your search terms or browse different categories to find what you're looking for."
              : "It looks like there are no products available right now. Check back soon!"
            }
          </p>
          
          {(search || (category && category !== 'all')) && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
                Clear Filters
              </button>
              <button className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                Browse All
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Results header with improved spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-900">
              {total} Product{total !== 1 ? 's' : ''}
            </h2>
            {search && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                <Search className="w-3 h-3" />
                <span>"{search}"</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Page {page} of {totalPages}
          </p>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-medium">Live inventory</span>
        </div>
      </div>

      {/* Products grid with improved spacing */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination with proper spacing */}
      <div className="pt-8 border-t border-gray-100">
        <ProductsClient
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={limit}
          search={search}
          category={category}
        />
      </div>
    </div>
  )
}

async function CategoryFilterWrapper({ 
  currentCategory
}: { 
  currentCategory?: string
}) {
  const categories = await fetchCategories()
  return (
    <CategoryFilter 
      categories={categories} 
      currentCategory={currentCategory}
    />
  )
}

async function SearchBarWrapper({ 
  currentCategory 
}: { 
  currentCategory?: string 
}) {
  const categories = await fetchCategories()
  return (
    <ModernSearchSystem
      categories={categories}
      currentCategory={currentCategory}
    />
  )
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams?.search?.trim() || undefined
  const category = resolvedSearchParams?.category?.trim() || undefined
  const page = Math.max(1, parseInt(resolvedSearchParams?.page || '1') || 1)
  const limit = Math.max(1, Math.min(100, parseInt(resolvedSearchParams?.limit || '12') || 12))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header Section */}
      <div className="bg-[#16a34a]  border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <Suspense fallback={<SearchBarSkeleton />}>
              <SearchBarWrapper currentCategory={category} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Main container with improved spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Sidebar - Category Filter with consistent width */}
          <aside className="lg:w-80 lg:flex-shrink-0">
            <div className="lg:sticky lg:top-6">
              <Suspense fallback={<CategoryFilterSkeleton />}>
                <CategoryFilterWrapper currentCategory={category} />
              </Suspense>
            </div>
          </aside>

          {/* Main content - Products with proper spacing */}
          <main className="flex-1 min-w-0">
            {/* Search indicator with better positioning */}
            {search && (
              <div className="mb-8 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900 text-lg">Search Results</p>
                    <p className="text-blue-700">Showing results for "{search}"</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state with proper spacing */}
            <Suspense
              key={`${search}-${category}-${page}-${limit}`}
              fallback={
                <div className="space-y-8">
                  {/* Header skeleton */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-40" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                  
                  {/* Grid skeleton */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              }
            >
              <ProductGrid search={search} category={category} page={page} limit={limit} />
            </Suspense>
          </main>
        </div>
      </div>

      {/* Bottom spacing for mobile */}
      <div className="h-6 lg:h-8" />
    </div>
  )
}

export const revalidate = false
export const dynamic = 'force-dynamic'