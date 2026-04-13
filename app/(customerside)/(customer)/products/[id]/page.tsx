import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, Star, Share, Heart, Store } from 'lucide-react'
import Link from 'next/link'
import BuySection from '../../components/BuySection'
import ProductCard from '../../components/products/productcard'
import { Suspense } from 'react'

export const revalidate = false
export const dynamic = 'force-static'

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
  partnername: string
  category: { name: string }
  createdAt: string
  updatedAt: string
}

interface ProductDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    select: { id: true }
  })

  return products.map((product) => ({
    id: product.id.toString(),
  }))
}

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
    take: 8,
    orderBy: {
      createdAt: 'desc'
    }
  })
}

function MobileHeader({ product }: { product: Product }) {
  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/products" className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold truncate text-gray-900">{product.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Share className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProductImage({ product }: { product: Product }) {
  return (
    <div className="relative">
      {/* Mobile Image */}
      <div className="md:hidden">
        <div className="aspect-square bg-gray-50 mx-4 mb-6 rounded-3xl overflow-hidden relative">
          {product.imgurl ? (
            <Image
              src={product.imgurl}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Package className="h-20 w-20 text-gray-400" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
              In Stock
            </Badge>
          </div>
        </div>
      </div>

      {/* Desktop Image */}
      <div className="hidden md:block max-w-[400px] mx-auto">
        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden relative">
          {product.imgurl ? (
            <Image
              src={product.imgurl}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Package className="h-24 w-24 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductInfo({ product }: { product: Product }) {
  return (
    <div className="md:hidden px-4 space-y-6">
      {/* Category and Title */}
      <div className="space-y-3">
        <Badge variant="outline" className="text-xs font-medium px-3 py-1 rounded-full border-gray-200">
          {product.category.name}
        </Badge>
        
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          {product.name}
        </h1>
        
        {/* Sold By Partner */}
        <div className="flex items-center gap-2 text-sm">
          <Store className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">Sold by</span>
          <span className="font-medium text-gray-900">{product.partnername}</span>
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">4.5</span>
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-gray-600">124 reviews</span>
        </div>
      </div>

      {/* Price */}
      <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-green-600">
            ₹{product.price.toLocaleString()}
          </span>
          <span className="text-base text-gray-600">per {product.unit}</span>
        </div>
      </div>

      {/* Description */}
      {product.descr && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">About this product</h3>
          <p className="text-gray-700 leading-relaxed">{product.descr}</p>
        </div>
      )}

      {/* Specifications */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm">Specifications</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-1">
            <span className="text-sm text-gray-600">Unit</span>
            <span className="text-sm font-medium text-gray-900">{product.unit}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm text-gray-600">SKU</span>
            <span className="text-xs font-medium text-gray-900 font-mono">{product.sku}</span>
          </div>
          {product.weight && (
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Weight</span>
              <span className="text-sm font-medium text-gray-900">{product.weight}</span>
            </div>
          )}
          {product.packaging && (
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Package Size</span>
              <span className="text-sm font-medium text-gray-900">{product.packaging} {product.unit}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DesktopInfo({ product }: { product: Product }) {
  return (
    <div className="hidden md:block space-y-6">
      <Badge variant="outline" className="font-medium">{product.category.name}</Badge>
      
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        
        {/* Sold By Partner */}
        <div className="flex items-center gap-2 text-sm">
          <Store className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">Sold by</span>
          <span className="font-semibold text-gray-900">{product.partnername}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">(124 reviews)</span>
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-bold text-green-600">
          ₹{product.price.toLocaleString()}
        </span>
        <span className="text-lg text-gray-600">per {product.unit}</span>
      </div>

      <Badge className="bg-green-600 text-white">In Stock</Badge>

      {product.descr && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Description</h3>
          <p className="text-gray-700 leading-relaxed">{product.descr}</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Product Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Unit</div>
            <div className="font-medium">{product.unit}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">SKU</div>
            <div className="font-medium text-xs font-mono">{product.sku}</div>
          </div>
          {product.weight && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Weight</div>
              <div className="font-medium">{product.weight}</div>
            </div>
          )}
          {product.packaging && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Package Size</div>
              <div className="font-medium">{product.packaging} {product.unit}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RelatedProducts({ products }: { products: any[] }) {
  const formattedProducts = products.map((product) => ({
    ...product,
    imgurl: product.imgurl ?? null,
    weight: product.weight ?? undefined,
    packaging: product.packaging ?? undefined,
  }))

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

  const relatedProducts = await getRelatedProducts(product.categoryId, product.id)

  const formattedProduct: Product = {
    ...product,
    imgurl: product.imgurl ?? null,
    weight: product.weight ?? null,
    packaging: product.packaging ?? null,
    LooseSell: product.LooseSell ?? false,
    descr: product.descr ?? null,
    partnername: product.partnername,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }

  return (
    <div className="min-h-screen bg-white">
      <MobileHeader product={formattedProduct} />

      {/* Desktop Back Button */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 pt-6 pb-4">
        <Link href="/products" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg px-3 py-2 -ml-3 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>

      <div className="md:max-w-6xl md:mx-auto md:px-6 md:pb-12">
        <div className="md:grid md:grid-cols-2 md:gap-12">
          <ProductImage product={formattedProduct} />
          <div className="space-y-6">
            <ProductInfo product={formattedProduct} />
            <DesktopInfo product={formattedProduct} />
            
            {/* Desktop Buy Section */}
            <div className="hidden md:block">
              <BuySection prop={formattedProduct} />
            </div>
          </div>
        </div>

        {/* Mobile Buy Section */}
        <div className="md:hidden px-4 py-6">
          <BuySection prop={formattedProduct} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-100 pt-8 mt-12 px-4 md:px-0">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              More from {formattedProduct.category.name}
            </h2>
            <Suspense fallback={
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="bg-gray-200 aspect-square rounded-2xl"></div>
                    <div className="bg-gray-200 h-4 rounded-lg"></div>
                    <div className="bg-gray-200 h-3 rounded-lg w-3/4"></div>
                  </div>
                ))}
              </div>
            }>
              <RelatedProducts products={relatedProducts} />
            </Suspense>
          </div>
        )}
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40 safe-area-pb">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-sm text-gray-600 font-medium">Starting at</div>
            <div className="text-xl font-bold text-green-600">
              ₹{formattedProduct.price.toLocaleString()}
            </div>
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 h-12 rounded-2xl font-semibold shadow-lg active:scale-95 transition-all duration-150">
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}