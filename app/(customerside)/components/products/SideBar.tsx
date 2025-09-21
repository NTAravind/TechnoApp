'use client'

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ShoppingCart, ArrowRight, Trash2, ShoppingBag, X } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import ProductCart from "@/lib/store"
import CartCard from "./CartCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fcurrency } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function CartSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { cartItems, ClearBasket, getTotalPrice, getBasketCount } = ProductCart()

  // Memoize calculated values
  const totalPrice = useMemo(() => getTotalPrice(), [cartItems])
  const itemCount = useMemo(() => getBasketCount(), [cartItems])
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
    if (confirm("Clear all items from your cart?")) {
      ClearBasket()
    }
  }

  const handleContinueShopping = () => {
    setOpen(false)
    router.push("/products")
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-3 rounded-full transition-all duration-200 active:scale-95 lg:hover:bg-gray-100 lg:text-gray-700 text-white touch-manipulation">
          <ShoppingCart className="h-6 w-6" />
          {itemCount > 0 && (
            <div 
              className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white border-2 border-white shadow-sm"
            />
          )}
        </button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-full sm:w-[420px] p-0 bg-gray-50 border-l border-gray-200 flex flex-col h-full [&>button]:hidden"
      >
        {/* Header - Fixed with custom close button */}
        <SheetHeader className="flex-shrink-0 px-6 py-5 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#16a34a]/10">
                <ShoppingBag className="h-5 w-5 text-[#16a34a]" />
              </div>
              Your Cart
            </SheetTitle>
            
            {/* Custom close button */}
            <button
              onClick={handleClose}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Close cart"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </SheetHeader>

        {/* Main Content Area - Flexible */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isEmpty ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white mx-4 my-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-[#16a34a]/10 to-[#16a34a]/5 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <ShoppingCart className="h-10 w-10 text-[#16a34a]/70" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Your cart is empty</h3>
              <p className="text-sm text-gray-600 mb-8 max-w-xs leading-relaxed">
                Discover amazing products and add them to your cart to get started!
              </p>
              <Button
                onClick={handleContinueShopping}
                className="w-full h-12 text-base font-semibold bg-[#16a34a] hover:bg-[#16a34a]/90 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-98"
                size="lg"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Start Shopping
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items - Scrollable */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-4 py-4 space-y-3">
                    {cartItems.map((item, index) => (
                      <CartCard
                        prop={item}
                        key={`sidebar-cart-${item.item.id}-${item.qty}-${index}`}
                        isCompact={true}
                      />
                    ))}
                    {/* Add padding at bottom to ensure last item is visible */}
                    <div className="h-4" />
                  </div>
                </ScrollArea>
              </div>

              {/* Footer - Fixed at bottom */}
              <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg">
                {/* Summary */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-600">Subtotal</span>
                    <span className="text-lg font-bold text-gray-900">
                      {fcurrency(totalPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                    <span className="text-xs text-[#16a34a] font-medium">Free delivery</span>
                  </div>
                </div>

                <Separator className="bg-gray-200" />

                {/* Action Buttons */}
                <div className="p-4 space-y-3">
                  <Button
                    onClick={handleCheckout}
                    disabled={isEmpty}
                    className="w-full h-12 text-base font-bold bg-[#16a34a] hover:bg-[#16a34a]/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-98 group disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    <span className="mr-2">Proceed to Checkout</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleContinueShopping}
                      variant="outline"
                      className="flex-1 h-10 text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all duration-200 active:scale-98"
                      size="sm"
                    >
                      Continue Shopping
                    </Button>
                    
                    <Button
                      onClick={handleClearCart}
                      disabled={isEmpty}
                      variant="outline"
                      className="px-4 h-10 text-sm font-medium text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 rounded-lg transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
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