'use client'
import ProductCart, { CartItem } from '@/lib/store'
import Image from 'next/image'
import React, { useCallback, useMemo } from 'react'
import { Minus, Plus, X, AlertCircle, Package } from 'lucide-react'
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
      <div className={`bg-white border border-red-200 rounded-lg ${isCompact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          Invalid price for this item
        </div>
      </div>
    )
  }

  return (
    <div className={`group bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 ${isCompact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start gap-3">
        <div className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} bg-gray-100 flex-shrink-0 overflow-hidden relative`}>
          {prop.item.imgurl ? (
            <Image
              src={prop.item.imgurl}
              alt={prop.item.name || 'Product'}
              fill
              className="object-cover"
              sizes={isCompact ? '48px' : '64px'}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-gray-500 font-medium text-xs">
                {prop.item.name?.charAt(0)?.toUpperCase() || 'P'}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 pr-2">
              <h4 className={`${isCompact ? 'text-sm' : 'text-base'} font-medium text-gray-900 leading-tight line-clamp-2`}>
                {prop.item.name || 'Unknown Product'}
              </h4>
              {!prop.item.LooseSell && prop.item.packaging && (
                <div className="flex items-center mt-1">
                  <Package className="h-3 w-3 text-amber-600 mr-1" />
                  <span className="text-xs text-amber-600">Package only</span>
                </div>
              )}
            </div>
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center border border-gray-200 hover:border-red-300"
              aria-label={`Remove ${prop.item.name} from cart`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="mb-2">
            {packageCount > 0 ? (
              <div className="flex items-center text-sm font-medium text-gray-700">
                <Package className="h-3 w-3 mr-1" />
                <span>{packageCount} package{packageCount > 1 ? 's' : ''}</span>
              </div>
            ) : (
              <div className="text-sm font-medium text-gray-700">
                {prop.qty} {prop.item.unit}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`${isCompact ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>
                {formattedTotal}
              </p>
            </div>

            <div className="flex items-center bg-gray-50 border border-gray-200">
              <button
                onClick={handleDecrement}
                className={`${isCompact ? 'w-7 h-7' : 'w-8 h-8'} flex items-center justify-center hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-r border-gray-200`}
                disabled={displayCount <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-gray-600`} />
              </button>

              <span className={`${isCompact ? 'text-sm px-3 min-w-[30px]' : 'text-base px-4 min-w-[40px]'} font-medium text-center bg-white`}>
                {displayCount}
              </span>

              <button
                onClick={handleIncrement}
                className={`${isCompact ? 'w-7 h-7' : 'w-8 h-8'} flex items-center justify-center hover:bg-white transition-colors duration-200 border-l border-gray-200`}
                aria-label="Increase quantity"
              >
                <Plus className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-gray-600`} />
              </button>
            </div>
          </div>

          {!isCompact && prop.item.packaging && packageCount > 0 && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <span>Package size: {prop.item.packaging} {prop.item.unit}</span>
                <span>Increment: {prop.item.LooseSell ? '1' : prop.item.packaging} {prop.item.unit}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}