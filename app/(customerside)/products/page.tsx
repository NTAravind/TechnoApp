import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/app/(customerside)/components/products/productcard'
import CategoryFilter from '../components/Category'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Grid3X3 } from 'lucide-react'
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

// Fixed: Include all parameters in cache key to ensure proper cache invalidation
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

// Fixed: Include all parameters in cache key to prevent stale data
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
    // Fixed: Handle categoryId properly - convert to number and validate
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
  // Fixed: Include all parameters in cache key
  ['products'],
  {
    tags: ['products'],
    revalidate: false,
  }
)

function ProductCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="aspect-square bg-muted rounded-md mb-4 animate-pulse" />
        <div className="h-4 bg-muted rounded mb-2 animate-pulse" />
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
      </CardContent>
    </Card>
  )
}

function CategoryFilterSkeleton() {
  return (
    <div className="space-y-4">
      {/* Mobile skeleton */}
      <div className="lg:hidden">
        <Skeleton className="h-10 w-full" />
      </div>
      {/* Desktop sidebar skeleton */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-8 w-full mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-5 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Summary skeleton */}
      <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
        <Skeleton className="h-4 w-32" />
      </div>
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
  // Fixed: Normalize category parameter - don't pass undefined strings
  const categoryId = category && category !== 'all' && category !== 'undefined' ? category : undefined
  const { products, total } = await fetchProducts(search, categoryId, page, limit)
  const totalPages = Math.ceil(total / limit)

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted/30 rounded-full p-6 mb-4">
          <Grid3X3 className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          {search || (category && category !== 'all')
            ? "Try adjusting your search terms or filters to find what you're looking for."
            : "It looks like there are no products available right now."
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {total} Product{total !== 1 ? 's' : ''} Found
          </h2>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Client-side pagination */}
      <ProductsClient
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        itemsPerPage={limit}
        search={search}
        category={category}
      />
    </div>
  )
}

async function CategoryFilterWrapper({ currentCategory }: { currentCategory?: string }) {
  const categories = await fetchCategories()
  return <CategoryFilter categories={categories} currentCategory={currentCategory} />
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Fixed: Properly await and handle searchParams
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams?.search?.trim() || undefined
  const category = resolvedSearchParams?.category?.trim() || undefined
  const page = Math.max(1, parseInt(resolvedSearchParams?.page || '1') || 1)
  const limit = Math.max(1, Math.min(100, parseInt(resolvedSearchParams?.limit || '12') || 12))

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Category Filter */}
        <aside className="lg:w-80 lg:flex-shrink-0">
          <Suspense fallback={<CategoryFilterSkeleton />}>
            <CategoryFilterWrapper currentCategory={category} />
          </Suspense>
        </aside>

        {/* Main content - Products */}
        <main className="flex-1 min-w-0">
          <Suspense
            key={`${search}-${category}-${page}-${limit}`} // Fixed: Add key to force re-render
            fallback={
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
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
  )
}

// Fixed: Change to dynamic rendering to prevent stale cache issues with filters
export const revalidate = false
export const dynamic = 'force-dynamic' // Changed from 'force-static'