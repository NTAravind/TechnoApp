'use client'
import ProductCart from '@/lib/store'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Plus, Minus, Zap, Package, AlertCircle } from 'lucide-react'
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
        duration: 3000,
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
      toast('Please select a quantity', {
        description: 'Add at least 1 item to proceed.',
      })
      return
    }
    
    setIsLoading(true)
    try {
      AddProduct({ item: prop, qty: quantity })
      router.push('/checkout')
    } catch (error) {
      toast('Error', {
        description: 'Something went wrong. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (quantity === 0) {
      toast('Please select a quantity', {
        description: 'Add at least 1 item to your cart.',
      })
      return
    }
    
    setIsLoading(true)
    try {
      AddProduct({ item: prop, qty: quantity })
      toast('Added to cart', {
        description: `${quantity} × ${prop.name} added.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalPrice = prop.price * quantity
  const incrementStep = prop.LooseSell ? 1 : (prop.packaging || 1)

  return (
    <div className="space-y-6">
      {/* LooseSell Status and Packaging Information */}
      <div className="space-y-3">
        <div className={`border rounded-lg p-4 ${prop.LooseSell ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-3">
            <Package className={`h-5 w-5 mt-0.5 flex-shrink-0 ${prop.LooseSell ? 'text-green-600' : 'text-amber-600'}`} />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">
                {prop.LooseSell ? 'Flexible Quantity' : 'Package Quantity Only'}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prop.LooseSell 
                  ? 'You can buy any quantity of this product.'
                  : `This product must be purchased in multiples of ${prop.packaging || 1} ${prop.unit}.`
                }
              </p>
            </div>
          </div>
        </div>

        {prop.packaging && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Packaging Details</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {prop.packaging} {prop.unit} comes in 1 package
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Counter Section - Flex on large screens */}
      <div className="space-y-6 lg:space-y-0 lg:flex lg:gap-8">
        {/* Package Counter (if packaging exists and not loose sell) */}
        {prop.packaging && !prop.LooseSell && (
          <div className="space-y-3 lg:flex-1">
            <label className="text-sm font-medium">Packages</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  onClick={handlePackageDecrement}
                  variant="ghost"
                  size="icon"
                  disabled={packages <= 0 || isLoading}
                  className="h-12 w-12 rounded-none border-r hover:bg-muted"
                  aria-label={`Decrease packages for ${prop.name}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={packages}
                  onChange={handlePackageInputChange}
                  min={0}
                  className="h-12 w-20 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg font-semibold"
                  aria-label={`Number of packages for ${prop.name}`}
                />
                <Button
                  onClick={handlePackageIncrement}
                  variant="ghost"
                  size="icon"
                  disabled={isLoading}
                  className="h-12 w-12 rounded-none border-l hover:bg-muted"
                  aria-label={`Increase packages for ${prop.name}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                = {packages * (prop.packaging || 0)} {prop.unit}
              </div>
            </div>
          </div>
        )}

        {/* Individual Unit Counter (only shown if LooseSell is true) */}
        {prop.LooseSell && (
          <div className="space-y-3 lg:flex-1">
            <label className="text-sm font-medium">Quantity</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  onClick={handleQuantityDecrement}
                  variant="ghost"
                  size="icon"
                  disabled={quantity <= 0 || isLoading}
                  className="h-12 w-12 rounded-none border-r hover:bg-muted"
                  aria-label={`Decrease quantity for ${prop.name}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={handleQuantityInputChange}
                  min={0}
                  step={incrementStep}
                  className="h-12 w-20 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg font-semibold"
                  aria-label={`Quantity for ${prop.name}`}
                />
                <Button
                  onClick={handleQuantityIncrement}
                  variant="ghost"
                  size="icon"
                  disabled={isLoading}
                  className="h-12 w-12 rounded-none border-l hover:bg-muted"
                  aria-label={`Increase quantity for ${prop.name}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {prop.unit}
                {!prop.LooseSell && incrementStep > 1 && (
                  <div className="text-xs text-amber-600">
                    +{incrementStep} each click
                  </div>
                )}
              </div>
            </div>
            {quantity > 0 && (
              <div className="text-lg font-semibold">
                ₹{totalPrice.toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={handleAddToCart}
          variant="outline"
          disabled={quantity === 0 || isLoading}
          size="lg"
          className="h-12 text-base font-semibold order-2 sm:order-1"
          aria-label={`Add ${quantity} ${prop.name} to cart`}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isLoading ? 'Adding...' : 'Add to Cart'}
        </Button>
        <Button
          onClick={handleBuyNow}
          disabled={quantity === 0 || isLoading}
          size="lg"
          className="h-12 text-base font-semibold order-1 sm:order-2"
          aria-label={`Buy ${quantity} ${prop.name} now`}
        >
          <Zap className="h-4 w-4 mr-2" />
          {isLoading ? 'Processing...' : 'Buy Now'}
        </Button>
      </div>

      {/* Order Summary */}
      {quantity > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
          <h4 className="font-semibold text-sm">Order Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-medium">{quantity} {prop.unit}</span>
            </div>
            {prop.packaging && packages > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Packages</span>
                <span className="font-medium">{packages} package{packages > 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Unit price</span>
              <span className="font-medium">₹{prop.price.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Subtotal</span>
              <span className="font-bold text-lg">₹{totalPrice.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            * Final price including taxes will be calculated at checkout
          </p>
        </div>
      )}
    </div>
  )
}