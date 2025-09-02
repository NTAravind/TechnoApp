'use client';

import ProductCart from "@/lib/store";
import CartCard from "./CartCard";
import { fcurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2, ShoppingBag, ArrowLeft } from "lucide-react";

export default function Cart() {
  const router = useRouter();
  const { cartItems, ClearBasket, getTotalPrice, getBasketCount } = ProductCart();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize calculated values to prevent unnecessary recalculations
  const totalPrice = useMemo(() => getTotalPrice(), [cartItems]);
  const basketCount = useMemo(() => getBasketCount(), [cartItems]);
  const isEmpty = useMemo(() => cartItems.length === 0, [cartItems]);

  // Simplified hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Optimized handlers with useCallback
  const handleCheckout = useCallback(async () => {
    if (isEmpty) {
      alert("Your cart is empty!");
      return;
    }
    
    setIsLoading(true);
    try {
      // Add any pre-checkout validation here
      await router.push("/checkout");
    } finally {
      setIsLoading(false);
    }
  }, [isEmpty, router]);

  const handleClearCart = useCallback(() => {
    if (isEmpty) return;
    
    if (confirm("Are you sure you want to clear your cart?")) {
      ClearBasket();
    }
  }, [isEmpty, ClearBasket]);

  const handleContinueShopping = useCallback(() => {
    router.push("/products");
  }, [router]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // Show loading only during initial hydration
  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          {/* Back button */}
          <div className="w-full mb-8">
            <Button
              onClick={handleGoBack}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold mb-3 text-gray-900">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. 
              Start shopping to fill it up!
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={handleContinueShopping}
                size="lg"
                className="px-8 h-12"
              >
                Start Shopping
              </Button>
              <div>
                <Button
                  onClick={handleGoBack}
                  variant="ghost"
                  size="sm"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate potential savings or shipping info
  const freeShippingThreshold = 500; // Example threshold
  const needsForFreeShipping = Math.max(0, freeShippingThreshold - totalPrice);

  // Cart with items
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header with back button */}
      <div className="mb-6">
        <Button
          onClick={handleGoBack}
          variant="ghost"
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">
              {basketCount} item{basketCount !== 1 ? 's' : ''} in your cart
            </p>
          </div>
          
          {/* Free shipping indicator */}
          {needsForFreeShipping > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-800">
                Add <span className="font-semibold">{fcurrency(needsForFreeShipping)}</span> more for free shipping!
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <CartCard
                prop={item}
                key={`cart-${item.item.id}-${item.qty}-${index}`}
                isCompact={false}
              />
            ))}
          </div>
        </div>

        {/* Cart Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-gray-900">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({basketCount} item{basketCount !== 1 ? 's' : ''})</span>
                  <span>{fcurrency(totalPrice)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">
                    {totalPrice >= freeShippingThreshold ? 'Free' : 'Calculated at checkout'}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">{fcurrency(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleCheckout}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Proceed to Checkout`
                  )}
                </Button>
                
                <Button
                  onClick={handleClearCart}
                  variant="outline"
                  className="w-full h-10 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  Clear Cart
                </Button>
              </div>

              {/* Security badges or trust signals */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Secure checkout guaranteed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}