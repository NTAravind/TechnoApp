'use client'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import ProductCart from '@/lib/store'
import { Product } from '@/lib/store'

interface AddToCartProps {
  product: Product
}

export default function AddToCart({ product }: AddToCartProps) {
  // Access the Zustand store
  const { AddProduct, getItemQuantity, SetItemQuantity, getValidQuantity } = ProductCart()

  const [isAdded, setIsAdded] = useState<boolean>(false)

  // Validate product prop on mount
  useEffect(() => {
    if (!product?.id || !product.name || !product.unit || product.price == null) {
      console.error('Invalid product data:', product)
    }
  }, [product])

  const showToast = (message: string, description: string) => {
    toast(message, {
      description,
      duration: 3000,
      unstyled: true,
      className: 'bg-green-500 text-white rounded-lg p-3 shadow-md',
    })
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent triggering parent Link

    // Validate product
    if (!product?.id) {
      console.error('Cannot add product: Invalid ID')
      showToast('Error', 'Unable to add product to cart. Invalid product data.')
      return
    }

    const currentQuantity = getItemQuantity(product.id)
    const incrementStep = product.LooseSell ? 1 : (product.packaging || 1)
    const validQty = getValidQuantity(product, incrementStep)

    if (currentQuantity === 0) {
      // Add new product
      AddProduct({ item: product, qty: validQty })
      showToast('Added to Cart', `${validQty} ${product.unit} of ${product.name} added.`)
    } else {
      // Update existing product
      const newQuantity = currentQuantity + validQty
      SetItemQuantity(product.id, newQuantity)
      showToast('Added to Cart', `+${validQty} ${product.unit} of ${product.name}. Total: ${newQuantity} ${product.unit}`)
    }

    setIsAdded(true)
  }

  useEffect(() => {
    if (isAdded) {
      const timer = setTimeout(() => setIsAdded(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [isAdded])

  const displayQuantity = (!product.LooseSell && product.packaging) ? product.packaging : 1
  const displayPrice = product.price * displayQuantity

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-gray-900">
          ₹{displayPrice.toLocaleString()}
        </span>
        <span className="text-sm text-gray-500 font-medium">
          {(!product.LooseSell && product.packaging)
            ? `/${product.packaging} ${product.unit} (1 pkg)`
            : `/${product.unit}`}
        </span>
      </div>

      {!product.LooseSell && product.packaging && (
        <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          Minimum: {product.packaging} {product.unit} per package
        </div>
      )}

      <Button
        onClick={handleAddToCart}
        className={`w-full h-12 font-semibold text-base rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md
          ${isAdded
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        aria-label={isAdded ? `Added ${product.name} to cart` : `Add ${product.name} to cart`}
      >
        {isAdded ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            Added!
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  )
}