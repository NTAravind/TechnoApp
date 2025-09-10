'use client'
import ProductCart, { CartItem } from '@/lib/store'
import Image from 'next/image'
import React, { useCallback, useMemo } from 'react'
import { Minus, Plus, X, AlertCircle, Package, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Product } from '@/app/generated/prisma'

interface CartCardProps {
  prop: CartItem
  isCompact?: boolean
}

export default function CartCard({ prop, isCompact = false }: CartCardProps) {
  const { RemoveProduct, SetItemQuantity, incrementQuantity, decrementQuantity } = ProductCart()

  const totalPrice = useMemo(() => prop.item.price * prop.qty, [prop.item.price, prop.qty])
  const formattedTotal = useMemo(() => `₹${totalPrice.toLocaleString()}`, [totalPrice])
  
  const packageCount = useMemo(() => {
    return prop.item.packaging && !prop.item.LooseSell ? Math.floor(prop.qty / prop.item.packaging) : 0
  }, [prop.qty, prop.item.packaging, prop.item.LooseSell])

  const displayCount = useMemo(() => {
    return packageCount > 0 ? packageCount : prop.qty
  }, [packageCount, prop.qty])

  const handleIncrement = useCallback(() => {
    console.log('Incrementing:', { id: prop.item.id, name: prop.item.name, LooseSell: prop.item.LooseSell, packaging: prop.item.packaging })
    incrementQuantity(prop.item.id)
  }, [prop.item.id, prop.item.name, prop.item.LooseSell, prop.item.packaging, incrementQuantity])

  const handleDecrement = useCallback(() => {
    console.log('Decrementing:', { id: prop.item.id, name: prop.item.name, LooseSell: prop.item.LooseSell, packaging: prop.item.packaging, currentQty: prop.qty })
    if (prop.qty > (prop.item.LooseSell ? 1 : (prop.item.packaging || 1))) {
      decrementQuantity(prop.item.id)
    } else {
      RemoveProduct(prop.item.id)
    }
  }, [prop.qty, prop.item.id, prop.item.LooseSell, prop.item.packaging, decrementQuantity, RemoveProduct])

  const handleRemove = useCallback(() => {
    console.log('Removing:', { id: prop.item.id, name: prop.item.name })
    RemoveProduct(prop.item.id)
  }, [prop.item.id, prop.item.name, RemoveProduct])

  const handleQuantityChange = useCallback((value: string) => {
    const newPackageCount = Math.max(1, parseInt(value, 10) || 1)
    const newQuantity = packageCount > 0 ? newPackageCount * (prop.item.packaging || 1) : newPackageCount
    console.log('Quantity change:', { id: prop.item.id, newPackageCount, newQuantity })
    if (newQuantity !== prop.qty) {
      SetItemQuantity(prop.item.id, newQuantity)
    }
  }, [prop.qty, prop.item.id, prop.item.packaging, packageCount, SetItemQuantity])

  if (!prop.item.price || prop.item.price <= 0) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-3">
          <div className="flex items-center text-red-600 text-sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            Invalid price for this item
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 ${isCompact ? 'shadow-sm' : 'shadow-md'}`}>
      <CardContent className={isCompact ? 'p-3' : 'p-4'}>
        <div className="flex items-start gap-3">
          {/* Product Image */}
          <div className={`${isCompact ? 'w-14 h-14' : 'w-20 h-20'} bg-gray-100 flex-shrink-0 overflow-hidden rounded-xl relative shadow-inner`}>
            {prop.item.imgurl ? (
              <Image
                src={prop.item.imgurl}
                alt={prop.item.name || 'Product'}
                fill
                className="object-cover"
                sizes={isCompact ? '56px' : '80px'}
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center">
                <span className="text-gray-500 font-bold text-lg">
                  {prop.item.name?.charAt(0)?.toUpperCase() || 'P'}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header with title and remove button */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 pr-2">
                <h4 className={`${isCompact ? 'text-sm' : 'text-base'} font-semibold text-gray-900 leading-tight line-clamp-2`}>
                  {prop.item.name || 'Unknown Product'}
                </h4>
                
                {/* Package indicator */}
                {!prop.item.LooseSell && prop.item.packaging && (
                  <Badge variant="secondary" className="mt-1 bg-amber-50 text-amber-700 border-amber-200 text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    Package only
                  </Badge>
                )}
              </div>
              
              <Button
                onClick={handleRemove}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 flex-shrink-0 opacity-60 group-hover:opacity-100 w-8 h-8 p-0 rounded-full active:scale-95"
                aria-label={`Remove ${prop.item.name} from cart`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Quantity info */}
            <div className="mb-3">
              {packageCount > 0 ? (
                <div className="flex items-center text-sm font-medium text-gray-600">
                  <Package className="h-3 w-3 mr-1 text-amber-600" />
                  <span>{packageCount} package{packageCount > 1 ? 's' : ''}</span>
                  <span className="text-gray-400 ml-1">({prop.qty} {prop.item.unit})</span>
                </div>
              ) : (
                <div className="text-sm font-medium text-gray-600">
                  {prop.qty} {prop.item.unit}
                </div>
              )}
            </div>

            <Separator className="mb-3" />

            {/* Price and quantity controls */}
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isCompact ? 'text-base' : 'text-lg'} font-bold text-[#16a34a]`}>
                  {formattedTotal}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <Button
                  onClick={handleDecrement}
                  variant="ghost"
                  size="sm"
                  className={`${isCompact ? 'w-8 h-8' : 'w-9 h-9'} p-0 hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-r border-gray-200 rounded-none active:scale-95`}
                  disabled={displayCount <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-gray-600`} />
                </Button>

                <span className={`${isCompact ? 'text-sm px-3 min-w-[32px]' : 'text-base px-4 min-w-[40px]'} font-semibold text-center bg-white select-none`}>
                  {displayCount}
                </span>

                <Button
                  onClick={handleIncrement}
                  variant="ghost"
                  size="sm"
                  className={`${isCompact ? 'w-8 h-8' : 'w-9 h-9'} p-0 hover:bg-white transition-colors duration-200 border-l border-gray-200 rounded-none active:scale-95`}
                  aria-label="Increase quantity"
                >
                  <Plus className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-gray-600`} />
                </Button>
              </div>
            </div>

            {/* Package details for non-compact view */}
            {!isCompact && prop.item.packaging && packageCount > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span className="font-medium">Package: {prop.item.packaging} {prop.item.unit}</span>
                  <span>Increment: {prop.item.LooseSell ? '1' : prop.item.packaging} {prop.item.unit}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}