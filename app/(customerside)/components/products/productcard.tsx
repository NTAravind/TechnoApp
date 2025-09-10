'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Package } from 'lucide-react'
import AddToCart from '@/app/(customerside)/components/products/Addtocart'

interface Product {
  id: number
  name: string
  size: number[]
  weight?: string | null
  imgurl: string | null
  unit: string
  price: number
  packaging: number | null
  LooseSell: boolean
  categoryId: number
  category: { name: string }
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  // Safely get the first size, handling both array and potential undefined cases
  const firstSize = Array.isArray(product.size) && product.size.length > 0 ? product.size[0] : null
  
  // Format price helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-black/20 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-black/10 hover:border-gray-300/60 p-0 flex flex-col h-full">
      <Link href={`/products/${product.id}`} className="block flex-shrink-0">
        {/* Large Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-t-2xl">
          {product.imgurl ? (
            <Image
              src={product.imgurl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
              onError={(e) => {
                // Handle image error by showing fallback
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <Package className="h-12 w-12 text-gray-300" />
            </div>
          )}
          
          {/* Category Badge - Top Left */}
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 rounded-lg bg-white/90 text-xs font-medium text-gray-600 border-0 shadow-sm px-2 py-1"
          >
            {product.category.name}
          </Badge>
          
          {/* Size Badge - Top Right */}
          {firstSize && (
            <Badge
              variant="outline"
              className="absolute right-2 top-2 rounded-md bg-white/95 text-xs font-normal text-gray-600 border border-gray-200/60 px-2 py-0.5"
            >
              {firstSize}{product.unit}
            </Badge>
          )}
          
          {/* LooseSell Indicator */}
          {!product.LooseSell && product.packaging && (
            <Badge
              variant="outline"
              className="absolute left-2 bottom-2 rounded-md bg-amber-50/95 text-xs font-normal text-amber-700 border border-amber-200/60 px-2 py-0.5"
            >
              Min: {product.packaging}
            </Badge>
          )}
        </div>
      </Link>
      
      {/* Content Section */}
      <div className="p-3 flex flex-col flex-grow">
        <Link href={`/products/${product.id}`} className="block mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-gray-700 transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>
        
        {/* Product Details */}
        <div className="flex flex-col gap-1 mb-2">
          {firstSize && (
            <Badge
              variant="outline"
              className="self-start rounded-lg border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 px-2 py-0.5"
            >
              {firstSize}{product.unit}
            </Badge>
          )}
          {product.packaging && (
            <div className="text-xs text-gray-500 font-normal">
              Package: {product.packaging} {product.unit}
            </div>
          )}
        </div>
        
        {/* Price */}
        <div className="mt-auto">
          <div className="text-lg font-bold text-primary mb-2">
            {formatPrice(product.price)}
          </div>
          
          {/* Add to Cart Button */}
          <div className="pt-2 border-t border-gray-100">
            <AddToCart product={product} />
          </div>
        </div>
      </div>
    </Card>
  )
}