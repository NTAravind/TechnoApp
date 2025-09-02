import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Share2, ArrowLeft, Package, Tag, Weight, Box } from 'lucide-react'
import Link from 'next/link'
import BuySection from '../../components/BuySection'
import ProductCard from '../../components/products/productcard'
import { Suspense } from 'react'

// Cache configuration - cache indefinitely until manually revalidated
export const revalidate = false
export const dynamic = 'force-static'

// Unified Product interface matching Prisma schema
interface Product {
  id: number
  name: string
  size: number[]
  weight: string | null
  imgurl: string | null
  unit: string
  price: number
  packaging: number | null
  LooseSell: boolean
  descr: string | null
  sku: string
  categoryId: number
  category: { name: string }
  createdAt: string
  updatedAt: string
}

// Updated interface to match Next.js App Router expectations
interface ProductDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// Generate static params for all products at build time
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    select: { id: true }
  })

  return products.map((product) => ({
    id: product.id.toString(),
  }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductDetailPageProps) {
  const resolvedParams = await params
  const id = parseInt(resolvedParams.id)

  if (isNaN(id)) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    }
  }

  const product = await getProduct(id)

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    }
  }

  return {
    title: `${product.name} - ₹${product.price.toLocaleString()} per ${product.unit}`,
    description: product.descr || `Buy ${product.name} at best price. Available in ${product.unit}. ${product.category.name} category.`,
    openGraph: {
      title: product.name,
      description: product.descr || `${product.name} - ₹${product.price.toLocaleString()} per ${product.unit}`,
      images: product.imgurl ? [{ url: product.imgurl, alt: product.name }] : [],
    },
  }
}

async function getProduct(id: number) {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: { name: true },
      },
    },
  })
}

async function getRelatedProducts(categoryId: number, currentProductId: number) {
  return await prisma.product.findMany({
    where: {
      categoryId: categoryId,
      id: { not: currentProductId }
    },
    include: {
      category: {
        select: { name: true },
      },
    },
    take: 10,
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// Dynamic price section component
function PriceSection({ product }: { product: Product }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="text-3xl text-green-600 font-bold">₹{product.price.toLocaleString()}</div>
        <span className="text-lg text-muted-foreground">per {product.unit}</span>
      </div>
    </div>
  )
}

// Product info component
function ProductInfo({ product }: { product: Product }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium min-w-[80px]">Category:</span>
        <span className="text-muted-foreground">{product.category.name}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium min-w-[80px]">Unit:</span>
        <span className="text-muted-foreground">{product.unit}</span>
      </div>
      {product.weight && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium min-w-[80px]">Weight:</span>
          <span className="text-muted-foreground">{product.weight}</span>
        </div>
      )}
      {product.size && product.size.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium min-w-[80px]">Quantity:</span>
          <div className="flex flex-wrap gap-1">
            {product.size.map((size, index) => (
              <span key={size} className="text-muted-foreground">
                {size}{product.unit}{index < product.size.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium min-w-[80px]">SKU:</span>
        <span className="text-muted-foreground font-mono">{product.sku}</span>
      </div>
      {/* LooseSell indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium min-w-[80px]">Selling Type:</span>
        <div className="flex items-center gap-2">
          <Badge variant={product.LooseSell ? "default" : "secondary"} className="text-xs">
            {product.LooseSell ? "Flexible Quantity" : "Package Only"}
          </Badge>
          {!product.LooseSell && product.packaging && (
            <span className="text-xs text-muted-foreground">
              (Min: {product.packaging} {product.unit})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Related products component with loading state
function RelatedProducts({ products }: { products: any[] }) {
  const formattedProducts = products.map((product) => ({
    ...product,
    imgurl: product.imgurl ?? null,
    weight: product.weight ?? undefined,
    packaging: product.packaging ?? undefined,
  }))

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
      {formattedProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = await params
  const id = parseInt(resolvedParams.id)

  if (isNaN(id)) {
    notFound()
  }

  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  // Fetch related products
  const relatedProducts = await getRelatedProducts(product.categoryId, product.id)

  // Convert Prisma product to match Product interface
  const formattedProduct: Product = {
    ...product,
    imgurl: product.imgurl ?? null,
    weight: product.weight ?? null,
    packaging: product.packaging ?? null,
    LooseSell: product.LooseSell ?? false,
    descr: product.descr ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Link href="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        {/* Product Image Section */}
        <div className="flex justify-center items-start">
          <div className="w-full max-w-[500px]">
            <div className="relative aspect-square bg-muted/10 rounded-lg overflow-hidden border">
              {formattedProduct.imgurl ? (
                <Image
                  src={formattedProduct.imgurl}
                  alt={formattedProduct.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto" />
                    <p className="text-base text-muted-foreground font-medium">No image available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="space-y-6">
          {/* Category Badge */}
          <Badge variant="secondary" className="w-fit">
            {formattedProduct.category.name}
          </Badge>

          {/* Product Title */}
          <h1 className="text-3xl font-bold leading-tight">
            {formattedProduct.name}
          </h1>

          {/* Price Section */}
          <PriceSection product={formattedProduct} />

          {/* Product Information */}
          <ProductInfo product={formattedProduct} />

          {/* Stock Badge - Always in stock for this example */}
          <div className="flex items-center gap-3">
            <Badge variant="default" className="px-3 py-1 bg-green-600">✓ In Stock</Badge>
          </div>

          {/* Description */}
          {formattedProduct.descr && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {formattedProduct.descr}
              </p>
            </div>
          )}

          {/* Buy Section */}
          <div className="pt-4 border-t">
            <BuySection prop={formattedProduct} />
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="border-t pt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">More from {formattedProduct.category.name}</h2>
            <p className="text-muted-foreground">Discover similar products you might like</p>
          </div>
          <Suspense fallback={
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded mb-1"></div>
                  <div className="bg-gray-200 h-3 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          }>
            <RelatedProducts products={relatedProducts} />
          </Suspense>
        </div>
      )}
    </div>
  )
}