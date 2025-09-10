'use client'
import ProductCart from '@/lib/store'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Plus, Minus, Zap, Package, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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

interface BuySectionProps {
  prop: Product
}

export default function BuySection({ prop }: BuySectionProps) {
  const router = useRouter()
  const { AddProduct, getItemQuantity, SetItemQuantity, incrementQuantity, decrementQuantity, getValidQuantity } = ProductCart()
  const [quantity, setQuantity] = useState<number>(0)
  const [packages, setPackages] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    const currentQuantity = getItemQuantity(prop.id)
    setQuantity(currentQuantity)
    if (prop.packaging) {
      setPackages(Math.floor(currentQuantity / prop.packaging))
    }
  }, [prop.id, getItemQuantity, prop.packaging])

  const handleQuantityIncrement = () => {
    incrementQuantity(prop.id)
    const newQuantity = getItemQuantity(prop.id)
    setQuantity(newQuantity)
    if (prop.packaging) {
      setPackages(Math.floor(newQuantity / prop.packaging))
    }
  }

  const handleQuantityDecrement = () => {
    decrementQuantity(prop.id)
    const newQuantity = getItemQuantity(prop.id)
    setQuantity(newQuantity)
    if (prop.packaging) {
      setPackages(Math.floor(newQuantity / prop.packaging))
    }
  }

  const handleQuantityInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    const newQuantity = Math.max(0, parseInt(value, 10) || 0)
    
    const validQuantity = getValidQuantity(prop, newQuantity)
    
    setQuantity(validQuantity)
    SetItemQuantity(prop.id, validQuantity)
    
    if (prop.packaging) {
      setPackages(Math.floor(validQuantity / prop.packaging))
    }

    if (!prop.LooseSell && validQuantity !== newQuantity && newQuantity > 0) {
      const packageSize = prop.packaging || 1
      toast('Quantity adjusted', {
        description: `Rounded to ${validQuantity} (multiples of ${packageSize} required)`,
        duration: 2000,
      })
    }
  }

  const handlePackageIncrement = () => {
    if (prop.packaging) {
      const newPackages = packages + 1
      const newQuantity = newPackages * prop.packaging
      setPackages(newPackages)
      setQuantity(newQuantity)
      SetItemQuantity(prop.id, newQuantity)
    }
  }

  const handlePackageDecrement = () => {
    if (packages > 0 && prop.packaging) {
      const newPackages = packages - 1
      const newQuantity = newPackages * prop.packaging
      setPackages(newPackages)
      setQuantity(newQuantity)
      SetItemQuantity(prop.id, newQuantity)
    }
  }

  const handlePackageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (prop.packaging) {
      const value = event.target.value
      const newPackages = Math.max(0, parseInt(value, 10) || 0)
      const newQuantity = newPackages * prop.packaging
      setPackages(newPackages)
      setQuantity(newQuantity)
      SetItemQuantity(prop.id, newQuantity)
    }
  }

  const handleBuyNow = async () => {
    if (quantity === 0) {
      toast('Select quantity')
      return
    }
    
    setIsLoading(true)
    try {
      AddProduct({ item: prop, qty: quantity })
      router.push('/checkout')
    } catch (error) {
      toast('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (quantity === 0) {
      toast('Select quantity')
      return
    }
    
    setIsLoading(true)
    try {
      AddProduct({ item: prop, qty: quantity })
      toast('Added to cart')
    } finally {
      setIsLoading(false)
    }
  }

  const totalPrice = prop.price * quantity
  const incrementStep = prop.LooseSell ? 1 : (prop.packaging || 1)

  return (
    <div className="space-y-6">
      {/* Package Info Banner */}
      {!prop.LooseSell && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2 mt-0.5">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 text-sm">Package Only</h4>
              <p className="text-blue-700 text-xs mt-0.5">
                Sold in multiples of {prop.packaging || 1} {prop.unit}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Selection */}
      <div className="bg-gray-50 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4 text-base">
          {prop.packaging && !prop.LooseSell ? 'Select Packages' : 'Select Quantity'}
        </h3>
        
        {prop.packaging && !prop.LooseSell ? (
          // Package Selection
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  onClick={handlePackageDecrement}
                  variant="outline"
                  size="icon"
                  disabled={packages <= 0 || isLoading}
                  className="h-12 w-12 rounded-full border-2 hover:border-gray-300 hover:bg-white active:scale-95 transition-all duration-150"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                
                <div className="mx-6 text-center">
                  <div className="text-2xl font-bold text-gray-900">{packages}</div>
                  <div className="text-xs text-gray-500">packages</div>
                </div>
                
                <Button
                  onClick={handlePackageIncrement}
                  variant="outline"
                  size="icon"
                  disabled={isLoading}
                  className="h-12 w-12 rounded-full border-2 hover:border-gray-300 hover:bg-white active:scale-95 transition-all duration-150"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {packages * (prop.packaging || 0)}
                </div>
                <div className="text-xs text-gray-500">{prop.unit} total</div>
              </div>
            </div>

            {/* Manual Input */}
            <div className="relative">
              <Input
                type="number"
                value={packages}
                onChange={handlePackageInputChange}
                min={0}
                className="h-12 text-center text-lg font-semibold bg-white border-2 focus:border-green-500 rounded-xl shadow-sm"
                placeholder="0"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                pkg
              </div>
            </div>
          </div>
        ) : (
          // Regular Quantity Selection
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  onClick={handleQuantityDecrement}
                  variant="outline"
                  size="icon"
                  disabled={quantity <= 0 || isLoading}
                  className="h-12 w-12 rounded-full border-2 hover:border-gray-300 hover:bg-white active:scale-95 transition-all duration-150"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                
                <div className="mx-6 text-center">
                  <div className="text-2xl font-bold text-gray-900">{quantity}</div>
                  <div className="text-xs text-gray-500">{prop.unit}</div>
                </div>
                
                <Button
                  onClick={handleQuantityIncrement}
                  variant="outline"
                  size="icon"
                  disabled={isLoading}
                  className="h-12 w-12 rounded-full border-2 hover:border-gray-300 hover:bg-white active:scale-95 transition-all duration-150"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              {quantity > 0 && (
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    ₹{totalPrice.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">total</div>
                </div>
              )}
            </div>

            {/* Manual Input */}
            <div className="relative">
              <Input
                type="number"
                value={quantity}
                onChange={handleQuantityInputChange}
                min={0}
                step={incrementStep}
                className="h-12 text-center text-lg font-semibold bg-white border-2 focus:border-green-500 rounded-xl shadow-sm"
                placeholder="0"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {prop.unit}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price Summary */}
      {quantity > 0 && (
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-green-900">Order Total</div>
              <div className="text-xs text-green-700">
                {quantity} {prop.unit} × ₹{prop.price.toLocaleString()}
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalPrice.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Mobile Layout */}
        <div className="block md:hidden">
          <Button
            onClick={handleBuyNow}
            disabled={quantity === 0 || isLoading}
            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold text-base shadow-lg active:scale-[0.98] transition-all duration-150"
          >
            <Zap className="h-5 w-5 mr-2" />
            {isLoading ? 'Processing...' : 'Buy Now'}
          </Button>
          
          <Button
            onClick={handleAddToCart}
            variant="outline"
            disabled={quantity === 0 || isLoading}
            className="w-full h-14 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white rounded-2xl font-semibold text-base mt-3 active:scale-[0.98] transition-all duration-150"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex gap-3">
          <Button
            onClick={handleAddToCart}
            variant="outline"
            disabled={quantity === 0 || isLoading}
            className="flex-1 h-12 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white rounded-xl font-semibold"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </Button>
          <Button
            onClick={handleBuyNow}
            disabled={quantity === 0 || isLoading}
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isLoading ? 'Processing...' : 'Buy Now'}
          </Button>
        </div>
      </div>
    </div>
  )
}