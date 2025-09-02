'use client'

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ShoppingCart } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import ProductCart from "@/lib/store"
import CartCard from "./CartCard"
import { Button } from "@/components/ui/button"
import { fcurrency } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function CartSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { cartItems, ClearBasket, getTotalPrice, getBasketCount } = ProductCart()

  // Memoize calculated values
  const totalPrice = useMemo(() => getTotalPrice(), [cartItems])
  const isEmpty = useMemo(() => cartItems.length === 0, [cartItems])

  // Close sidebar when navigating to checkout
  useEffect(() => {
    if (pathname === '/checkout') {
      setOpen(false)
    }
  }, [pathname])

  const handleCheckout = () => {
    if (isEmpty) return
    setOpen(false)
    router.push("/checkout")
  }

  const handleClearCart = () => {
    if (isEmpty) return
    if (confirm("Are you sure you want to clear your cart?")) {
      ClearBasket()
    }
  }

  const handleContinueShopping = () => {
    setOpen(false)
    router.push("/products")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ShoppingCart className="h-6 w-6 text-gray-700" />
        </button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[320px] sm:w-[400px] flex flex-col p-0">
        <SheetHeader className="flex-shrink-0 p-6 pb-3 border-b">
          <SheetTitle className="text-lg font-semibold text-gray-900">
            Your Cart
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {isEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <ShoppingCart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Your cart is empty</h3>
              <p className="text-sm text-gray-500 mb-4">Add some products to get started!</p>
              <Button
                onClick={handleContinueShopping}
                className="w-full h-10 text-sm font-medium"
                size="sm"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-2">
                <div className="space-y-2">
                  {cartItems.map((item, index) => (
                    <CartCard
                      prop={item}
                      key={`sidebar-cart-${item.item.id}-${item.qty}-${index}`}
                      isCompact={true}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0 border-t bg-gray-50 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Total</span>
                  <span className="text-lg font-bold text-blue-700">
                    {fcurrency(totalPrice)}
                  </span>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleCheckout}
                    className="w-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-700"
                    size="default"
                  >
                    Checkout • {fcurrency(totalPrice)}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleContinueShopping}
                      variant="outline"
                      className="flex-1 h-9 text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-100"
                      size="sm"
                    >
                      Continue
                    </Button>
                    
                    <Button
                      onClick={handleClearCart}
                      variant="outline"
                      className="flex-1 h-9 text-sm font-medium text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      size="sm"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}