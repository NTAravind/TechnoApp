'use client';

import ProductCart, { CartItem } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Edit3, Minus, Plus, X, UserIcon, Phone, ShoppingBag, CreditCard, Truck, ServerIcon, Loader2, AlertTriangle, Package, Percent, MessageSquare, Copy, ShoppingCart, MapPin } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { debounce } from 'lodash';
import { ErrorBoundary } from 'react-error-boundary';
import DeliveryModeSelector from './del';
import { createUser, updateUser } from './action';
import { fcurrency } from '@/lib/utils';
import { de } from 'zod/v4/locales';

// Updated Product interface to match Prisma schema
interface Product {
  id: number;
  name: string;
  size: number[];
  createdAt: Date;
  updatedAt: Date;
  weight: string | null;
  imgurl: string | null;
  unit: string;
  price: number;
  packaging: number | null;
  LooseSell: boolean;
  descr: string | null;
  sku: string;
  categoryId: number;
  category: { name: string };
  isVisible: boolean;
}

interface UserData {
  us: Customer | null;
  phone: string;
}

interface AlertState {
  isOpen: boolean;
  title: string;
  description: string;
  type: 'success' | 'error' | 'warning';
  onConfirm?: () => void;
  showCancel?: boolean;
}

// Updated Customer interface to include address and pincode
interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  isDistributor: boolean;
  createdAt: Date;
  updatedAt: Date;
  Address: string | null;
  pincode: string | null;
}

// Lazy load AlertDialog
interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const AlertDialogLazy = lazy(() =>
  import('@/components/ui/alert-dialog').then((mod) => ({
    default: ({ children, ...props }: AlertDialogProps) => (
      <AlertDialog {...props}>{children}</AlertDialog>
    ),
  }))
);

// Dynamic import for Razorpay script
const RazorpayScript = dynamic(() => Promise.resolve(() => null), { ssr: false });

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Error Boundary Fallback
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-6 border rounded-lg shadow-sm" style={{ backgroundColor: 'oklch(0.95 0.05 146.6189)', borderColor: 'oklch(0.8 0.1 146.6189)' }}>
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-6 w-6" style={{ color: 'oklch(0.6 0.2 10)' }} />
        <h2 className="text-lg font-semibold" style={{ color: 'oklch(0.4 0.2 146.6189)' }}>Something went wrong</h2>
      </div>
      <p className="text-sm mb-4" style={{ color: 'oklch(0.5 0.15 146.6189)' }}>
        {error.message || 'An unexpected error occurred. Please try again or contact support.'}
      </p>
      <div className="flex gap-3">
        <Button
          onClick={resetErrorBoundary}
          className="px-4 py-2"
          style={{ backgroundColor: 'oklch(0.7143 0.2145 146.6189)', color: 'white' }}
        >
          Try Again
        </Button>
        <Link href="/support">
          <Button variant="outline" className="px-4 py-2">
            Contact Support
          </Button>
        </Link>
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="h-6 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CheckoutForm = memo(function CheckoutForm({
  user,
  onSuccess,
  delivery,
}: {
  user: UserData;
  onSuccess: (updatedUser: Customer) => void;
  delivery: boolean;
}) {
  const [state, action, isPending] = useActionState(user.us ? updateUser : createUser, {
    success: false,
    message: '',
    user: null,
  });

  useEffect(() => {
    if (state.success && state.user) {
      onSuccess(state.user);
    }
  }, [state.success, state.user, onSuccess]);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            defaultValue={user.us?.name || ''}
            className="mt-1"
            placeholder="Enter your full name"
            required
            pattern="[A-Za-z\s]{2,50}"
            title="Name must be 2-50 characters and contain only letters and spaces"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number
          </Label>
          <Input
            type="tel"
            id="phone"
            name="phone"
            defaultValue={user.phone}
            className="mt-1 bg-gray-50"
            readOnly
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email (Optional)
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            defaultValue={user.us?.email || ''}
            className="mt-1"
            placeholder="Enter your email address"
          />
        </div>

        <div>
          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
            Address <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="address"
            name="Address"
            defaultValue={user.us?.Address || ''}
            className="mt-1"
            placeholder="Enter your address"
            required
            pattern="[A-Za-z0-9\s,.-]{5,100}"
            title="Address must be 5-100 characters and can include letters, numbers, spaces, commas, periods, and hyphens"
          />
        </div>

        <div>
          <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">
            Pincode <span className="text-red-500">{delivery ? '*' : '(Optional)'}</span>
          </Label>
          <Input
            type="text"
            id="pincode"
            name="pincode"
            defaultValue={user.us?.pincode || ''}
            className="mt-1"
            placeholder="Enter your pincode"
            required={delivery}
            pattern="[0-9]{6}"
            title="Pincode must be a 6-digit number"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="px-6 text-white"
          style={{ backgroundColor: 'oklch(0.7143 0.2145 146.6189)' }}
        >
          {isPending ? 'Saving...' : user.us ? 'Update Details' : 'Save Details'}
        </Button>
        {user.us && (
          <Button type="button" variant="outline" onClick={() => onSuccess(user.us!)}>
            Cancel
          </Button>
        )}
      </div>

      {state.message && (
        <div
          className={`p-3 rounded-md text-sm ${
            state.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
        {state.message}
        </div>
      )}
    </form>
  );
});

const UserDetails = memo(function UserDetails({ user, deliveryMode }: { user: UserData; deliveryMode: boolean }) {
  if (!user.us) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <UserIcon className="h-5 w-5 text-gray-600" />
        <div>
          <p className="text-sm text-gray-600">Name</p>
          <p className="font-medium text-gray-900">{user.us.name}</p>
          {user.us.isDistributor && (
            <Badge className="mt-1 text-white" style={{ backgroundColor: 'oklch(0.7143 0.2145 146.6189)' }}>
              <Percent className="h-3 w-3 mr-1" />
              Distributor (10% Discount)
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <Phone className="h-5 w-5 text-gray-600" />
        <div>
          <p className="text-sm text-gray-600">Phone Number</p>
          <p className="font-medium text-gray-900">{user.phone}</p>
        </div>
      </div>

      {user.us.email && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium text-gray-900">{user.us.email}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <MapPin className="h-5 w-5 text-gray-600" />
        <div>
          <p className="text-sm text-gray-600">Address</p>
          <p className="font-medium text-gray-900">{user.us.Address}</p>
        </div>
      </div>

      {user.us.pincode && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <MapPin className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-600">Pincode</p>
            <p className="font-medium text-gray-900">{user.us.pincode}</p>
          </div>
        </div>
      )}

      <div
        className={`flex items-center gap-3 p-4 rounded-lg border ${
          deliveryMode ? 'border-green-200' : 'border-blue-200'
        }`}
        style={{
          backgroundColor: deliveryMode ? 'oklch(0.95 0.1 146.6189)' : 'oklch(0.95 0.05 220)',
        }}
      >
        {deliveryMode ? (
          <Truck className="h-5 w-5" style={{ color: 'oklch(0.6 0.2 146.6189)' }} />
        ) : (
          <ShoppingBag className="h-5 w-5 text-blue-600" />
        )}
        <div>
          <p className={`text-sm font-medium ${deliveryMode ? 'text-green-800' : 'text-blue-800'}`}>
            {deliveryMode ? 'Delivery Mode Selected' : 'Cash On Delivery Selected'}
          </p>
          <p className={`text-xs ${deliveryMode ? 'text-green-700' : 'text-blue-700'}`}>
            {deliveryMode ? 'Your order will be delivered' : 'You can collect your order from our store'}
          </p>
        </div>
      </div>
    </div>
  );
});

const OrderSummary = memo(function OrderSummary({
  user,
  showAlert,
  del,
}: {
  user: UserData
  showAlert: (title: string, description: string, type?: 'success' | 'error' | 'warning', onConfirm?: () => void, showCancel?: boolean) => void
  del: boolean
}) {
  const { cartItems, RemoveProduct, getBasketCount, getTotalPrice } = ProductCart()
  const itemCount = getBasketCount()

  return (
    <Card className="shadow-sm border-0 bg-white sticky top-4">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" style={{ color: 'oklch(0.7143 0.2145 146.6189)' }} />
          <CardTitle className="text-xl">Your Order</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
              {(cartItems as CartItem[]).map((item) => (
                <ProductCard
                  key={item.item.id}
                  item={{
                    item: item.item as Product,
                    qty: item.qty,
                  }}
                  onRemove={RemoveProduct}
                />
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <PriceBreakdown user={user} deliveryMode={del} />
              <PurchaseButton user={user} showAlert={showAlert} del={del} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
})

const PriceBreakdown = memo(function PriceBreakdown({ user, deliveryMode }: { user: UserData; deliveryMode: boolean }) {
  const { getTotalPrice } = ProductCart()
  const subtotal = getTotalPrice()
  
  const distributorDiscount = useMemo(() => {
    return user.us?.isDistributor ? subtotal * 0.1 : 0
  }, [user.us?.isDistributor, subtotal])

  const subtotalAfterDiscount = subtotal - distributorDiscount
const deliveryCharge = useMemo(() => {
  // Both COD and Online Delivery have 8% delivery charge
  return subtotal * 0.08
}, [subtotal])

const platformFee = useMemo(() => {
  // Platform fee applies to both delivery modes now
  return subtotalAfterDiscount * 0.04
}, [subtotalAfterDiscount])

  const total = subtotalAfterDiscount + deliveryCharge + platformFee
  
  const isBulkOrder = subtotal > 50000

  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal:</span>
        <span className="font-medium">{fcurrency(subtotal)}</span>
      </div>

      {user.us?.isDistributor && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            <Percent className="h-4 w-4" />
            Distributor Discount (10%):
          </span>
          <span className="font-medium" style={{ color: 'oklch(0.7143 0.2145 146.6189)' }}>
            -{fcurrency(distributorDiscount)}
          </span>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-gray-600 flex items-center gap-1">
  <Truck className="h-4 w-4" />
  Delivery Charge (8%):
</span>
        <span className="font-medium">
          {deliveryMode ? fcurrency(deliveryCharge) : 'Free'}
        </span>
      </div>

      {deliveryMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Delivery charges apply</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">Delivery charge is calculated as 8% of your cart value</p>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-gray-600 flex items-center gap-1">
          <ServerIcon className="h-4 w-4" />
          Platform Fee (4%):
        </span>
        <span className="font-medium">{fcurrency(platformFee)}</span>
      </div>

      {isBulkOrder && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 my-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Bulk Order Detected</span>
            <Link href={process.env.NEXT_PUBLIC_WHATSAPP_LINK || 'https://wa.link/rb6f0r'} className="text-orange-600 hover:text-orange-700">
              Contact us
            </Link>
          </div>
          <p className="text-xs text-orange-700 mt-1">Orders above ₹50,000 require bulk order processing</p>
        </div>
      )}

      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span className={`${isBulkOrder ? 'text-orange-600' : ''}`} style={{ color: isBulkOrder ? undefined : 'oklch(0.7143 0.2145 146.6189)' }}>
            {fcurrency(total)}
          </span>
        </div>
      </div>
    </div>
  )
})

const ProductCard = memo(function ProductCard({
  item,
  onRemove,
}: {
  item: { item: Product; qty: number }
  onRemove: (id: number) => void
}) {
  const packageCount = useMemo(() => {
    return item.item.packaging && !item.item.LooseSell ? Math.floor(item.qty / item.item.packaging) : 0
  }, [item.qty, item.item.packaging, item.item.LooseSell])

  const displayCount = useMemo(() => {
    return packageCount > 0 ? packageCount : item.qty
  }, [packageCount, item.qty])

  const handleRemove = useCallback(() => {
    console.log('Removing:', { id: item.item.id, name: item.item.name })
    onRemove(item.item.id)
  }, [onRemove, item.item.id])

  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
        {item.item.imgurl ? (
          <Image
            src={item.item.imgurl}
            alt={item.item.name || 'Product'}
            fill
            sizes="56px"
            className="object-cover"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLFhiQQehonbkicnzB/V+YmN2bj3KzLIlk/wDi0k7rk9hm"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.9 0.1 146.6189), oklch(0.85 0.15 170))' }}>
            <span className="font-semibold text-sm" style={{ color: 'oklch(0.6 0.2 146.6189)' }}>{item.item.name?.charAt(0)?.toUpperCase() || 'P'}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 pr-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">{item.item.name}</h4>
            {packageCount > 0 ? (
              <div className="text-xs text-gray-500 mt-1">
                {packageCount} package{packageCount > 1 ? 's' : ''} ({item.item.packaging} {item.item.unit}/pkg)
              </div>
            ) : (
              <div className="text-xs text-gray-500 mt-1">
                {item.qty} {item.item.unit}
              </div>
            )}
          </div>

          <button
            onClick={handleRemove}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-200 flex-shrink-0"
            aria-label="Remove item"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center bg-white rounded-full border border-gray-200 p-1">
            <span className="text-sm font-medium px-3 min-w-[30px] text-center text-gray-900">
              {displayCount}
            </span>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {fcurrency(item.item.price * item.qty)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})



function PurchaseButton({
  user,
  showAlert,
  del,
}: {
  user: UserData;
  showAlert: (title: string, description: string, type?: 'success' | 'error' | 'warning', onConfirm?: () => void, showCancel?: boolean) => void;
  del: boolean; // true = online payment, false = COD
}) {
  const [isPending, setPending] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const { cartItems, getTotalPrice, ClearBasket } = ProductCart();
  const router = useRouter();
  const subtotal = getTotalPrice();
  const deliveryCharge = useMemo(() => subtotal * 0.08, [subtotal]);

  const distributorDiscount = useMemo(() => {
    return user.us?.isDistributor ? subtotal * 0.1 : 0;
  }, [user.us?.isDistributor, subtotal]);

  const subtotalAfterDiscount = subtotal - distributorDiscount;
  const platformFee = useMemo(() => {
    // Platform fee only applies to online payment
    return del ? subtotalAfterDiscount * 0.04 : 0;
  }, [subtotalAfterDiscount, del]);

  const totalAmount = subtotalAfterDiscount + deliveryCharge + platformFee;

  // Only load Razorpay for online payments
  useEffect(() => {
    if (!del) {
      // COD doesn't need Razorpay
      return;
    }
    if (!scriptLoaded && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => showAlert('Payment Error', 'Failed to load payment system.', 'error');
      document.head.appendChild(script);
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else if (window.Razorpay) {
      setScriptLoaded(true);
    }
  }, [scriptLoaded, showAlert, del]);

  const pollOrderStatus = useCallback(
    async (orderId: string, maxAttempts: number = 5, delay: number = 2000) => {
      setPending(true);
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetch(`/api/check-order/${orderId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!res.ok) {
            console.log(`Polling attempt ${attempt}/${maxAttempts} failed: ${res.status}`);
            continue;
          }
          const data = await res.json();
          if (data.success && data.order?.paid && data.order?.complete) {
            setPending(false);
            showAlert(
              'Order Placed Successfully!',
              `Your order #${orderId.slice(-8)} has been confirmed.`,
              'success',
              () => {
                ClearBasket();
                router.push('/orders');
              }
            );
            return true;
          }
          console.log(`Polling attempt ${attempt}/${maxAttempts}: Order ${orderId} not yet paid`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } catch (err) {
          console.error(`Polling error for order ${orderId}:`, err);
        }
      }
      setPending(false);
      showAlert(
        'Payment Pending',
        `Your order #${orderId.slice(-8)} is still processing. Check the status on the orders page.`,
        'warning',
        () => router.push('/orders')
      );
      return false;
    },
    [showAlert, ClearBasket, router]
  );

  const handleOrder = useCallback(async () => {
    if (!user.us?.name || !user.phone || !user.us?.Address) {
      showAlert('Missing Information', 'Please complete your profile with name, phone number, and address.', 'warning');
      return;
    }

    if (!user.us?.pincode) {
      showAlert('Missing Pincode', 'Please provide a pincode for delivery.', 'warning');
      return;
    }

    if (cartItems.length === 0) {
      showAlert('Empty Cart', 'Add items to your cart.', 'warning');
      return;
    }

    if (totalAmount > 50000) {
      setShowBulkDialog(true);
      return;
    }

    setPending(true);
    try {
      const orderItems = cartItems.map((cartItem) => ({ productId: cartItem.item.id, qty: cartItem.qty }));
      const paymentMethod = del ? 'online' : 'cod';
      
      const createOrderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        body: JSON.stringify({
          customerId: user.us.id,
          cartitems: orderItems,
          paymentMethod: paymentMethod,
          phoneno: user.phone,
          address: user.us.Address,
          pincode: user.us.pincode,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!createOrderRes.ok) {
        const errorData = await createOrderRes.json().catch(() => ({ error: 'Unknown error' }));
        if (createOrderRes.status === 501) {
          setShowBulkDialog(true);
          setPending(false);
          return;
        }
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await createOrderRes.json();
      if (!orderData.success || !orderData.orderId) {
        throw new Error('Invalid order response');
      }

      setCurrentOrderId(orderData.orderId);

      // Handle COD orders
      if (!del || orderData.isCOD) {
        setPending(false);
        showAlert(
          'COD Order Confirmed!',
          `Your Cash on Delivery order #${orderData.orderId.slice(-8)} has been placed successfully. You will pay ${fcurrency(totalAmount)} in cash when the order is delivered. Our team will contact you shortly for confirmation.`,
          'success',
          () => {
            ClearBasket();
            router.push('/orders');
          }
        );
        return;
      }

      // Handle online payment orders - proceed with Razorpay
      if (!scriptLoaded || !window.Razorpay) {
        showAlert('Payment System Error', 'Payment system not loaded. Try again.', 'error');
        setPending(false);
        return;
      }

      const razorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORKEY,
        amount: Math.round(orderData.amount * 100),
        currency: 'INR',
        name: 'TECHNO INDUSTRIES',
        description: 'Online Payment',
        order_id: orderData.orderId,
        prefill: {
          name: user.us?.name || '',
          contact: user.phone,
          email: user.us?.email || '',
          address: user.us?.Address || '',
          pincode: user.us?.pincode || '',
        },
        notes: {
          payment_mode: 'online',
          customer_type: user.us?.isDistributor ? 'distributor' : 'regular',
          discount_applied: user.us?.isDistributor ? '10%' : 'none',
          address: user.us?.Address,
          pincode: user.us?.pincode,
        },
        theme: { color: '#52c93f' },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              console.log('Verification failed, polling order:', orderData.orderId);
              await pollOrderStatus(orderData.orderId);
              return;
            }

            const completeOrderRes = await fetch('/api/razorpay/order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                customerId: user?.us?.id,
                cartitems: orderItems,
                pricepaid: orderData.amount,
                address: user.us?.Address,
                pincode: user.us?.pincode,
              }),
            });

            const completeData = await completeOrderRes.json();
            if (!completeOrderRes.ok || !completeData.success) {
              console.log('Completion failed, polling order:', orderData.orderId);
              await pollOrderStatus(orderData.orderId);
              return;
            }

            showAlert(
              'Order Placed Successfully!',
              `Your online payment order #${orderData.orderId.slice(-8)} has been confirmed.`,
              'success',
              () => {
                ClearBasket();
                router.push('/orders');
              }
            );
          } catch (err) {
            console.error('Client-side processing error:', err);
            await pollOrderStatus(orderData.orderId);
          } finally {
            setPending(false);
          }
        },
        modal: {
          ondismiss: async () => {
            console.log('Payment modal dismissed');
            setPending(false);
            if (currentOrderId) {
              await pollOrderStatus(currentOrderId);
            }
          },
        },
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.on('payment.failed', (response: any) => {
        setPending(false);
        showAlert(
          'Payment Failed',
          `Payment failed: ${response.error.description || 'Unknown error'}. Check the orders page to retry.`,
          'error',
          () => router.push('/orders')
        );
      });

      rzp.open();
    } catch (err) {
      console.error('Order creation error:', err);
      setPending(false);
      showAlert(
        'Order Processing Failed',
        `Failed to process your order${currentOrderId ? ` #${currentOrderId.slice(-8)}` : ''}. Please try again or check the orders page.`,
        'error',
        () => router.push('/orders')
      );
    }
  }, [user, cartItems, scriptLoaded, showAlert, ClearBasket, router, totalAmount, currentOrderId, pollOrderStatus, del, distributorDiscount, subtotalAfterDiscount, platformFee]);

  const canProceed = useMemo(() => 
    user.us?.name && 
    user.phone && 
    user.us?.Address && 
    cartItems.length > 0 && 
    totalAmount > 0 && 
    user.us?.pincode, 
    [user.us?.name, user.phone, user.us?.Address, cartItems.length, totalAmount, user.us?.pincode]
  );
  
  const isBulkOrder = totalAmount > 50000;
  const isEmptyCart = cartItems.length === 0;

  const getButtonText = useCallback(() => {
    if (isPending) return 'Processing...';
    if (isEmptyCart) return 'Add Items to Cart';
    if (isBulkOrder) return 'Contact for Bulk Order';
    if (!canProceed) return 'Complete Profile Details';
    return del ? `Pay ${fcurrency(totalAmount)}` : `Confirm COD Order (${fcurrency(totalAmount)})`;
  }, [isPending, isEmptyCart, isBulkOrder, canProceed, del, totalAmount]);

  const getButtonColor = useCallback(() => {
    if (isEmptyCart) return 'bg-red-600 hover:bg-red-700 text-white';
    if (isBulkOrder) return 'bg-orange-600 hover:bg-orange-700 text-white';
    if (!canProceed) return 'bg-gray-500 hover:bg-gray-600 text-white';
    if (!del) return 'bg-orange-600 hover:bg-orange-700 text-white'; // COD button color
    return 'text-white';
  }, [isEmptyCart, isBulkOrder, canProceed, del]);

  const getButtonStyle = useCallback(() => {
    if (!isEmptyCart && !isBulkOrder && canProceed && del) {
      return { backgroundColor: 'oklch(0.7143 0.2145 146.6189)' }; // Green for online payment
    }
    return undefined;
  }, [isEmptyCart, isBulkOrder, canProceed, del]);

  return (
    <>
      <div className="flex flex-col items-center space-y-2">
        <Button
          onClick={handleOrder}
          disabled={isPending || isEmptyCart}
          className={`w-full py-3 px-4 flex items-center gap-2 ${getButtonColor()}`}
          style={getButtonStyle()}
          aria-label={getButtonText()}
          aria-disabled={isPending || isEmptyCart}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : isEmptyCart ? (
            <>
              <ShoppingCart className="h-5 w-5" />
              Add Items to Cart
            </>
          ) : isBulkOrder ? (
            <>
              <MessageSquare className="h-5 w-5" />
              Contact for Bulk Order
            </>
          ) : (
            <>
              {del ? <CreditCard className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
              {getButtonText()}
            </>
          )}
        </Button>
        {canProceed && !isBulkOrder && (
          <div className="text-xs text-gray-500 text-center space-y-1">
            <div>Items: {cartItems.length} • Total Qty: {cartItems.reduce((sum, item) => sum + item.qty, 0)}</div>
            {currentOrderId && <div className="font-mono">Order ID: {currentOrderId.slice(-8)}</div>}
            {user.us?.isDistributor && (
              <div className="text-green-600 font-medium">✓ Distributor discount applied</div>
            )}
            <div className="text-xs text-gray-400">
              {del ? 'Online Payment (Prepaid)' : 'Cash on Delivery (COD)'}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              Bulk Order Request - {fcurrency(totalAmount)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your order exceeds ₹50,000. Please contact us via WhatsApp for bulk order processing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Items ({cartItems.length}):
              </h4>
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.item.id} className="flex justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-sm">{item.item.name}</p>
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>Qty: {item.qty} × {fcurrency(item.item.price)}</span>
                      </div>
                    </div>
                    <p className="font-semibold text-sm">{fcurrency(item.item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{fcurrency(subtotal)}</span>
                </div>
                {user.us?.isDistributor && (
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Distributor Discount (10%):
                    </span>
                    <span className="font-medium" style={{ color: 'oklch(0.7143 0.2145 146.6189)' }}>
                      -{fcurrency(distributorDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charge (8%):</span>
                  <span className="font-medium">{fcurrency(deliveryCharge)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee (4%):</span>
                  <span className="font-medium">{fcurrency(platformFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-orange-600">{fcurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Close</AlertDialogCancel>
            <Button 
              onClick={() => {
                const whatsappUrl = `${process.env.NEXT_PUBLIC_WHATSAPP_LINK || 'https://wa.link/rb6f0r'}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Contact on WhatsApp
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function CheckoutContent({ user }: { user: UserData }) {
  const [isEditing, setIsEditing] = useState(!user.us?.name || !user.us?.Address);
  const [currentUser, setCurrentUser] = useState<UserData>(user);
  const [deliveryMode, setDeliveryMode] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    description: '',
    type: 'success',
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setCurrentUser(user);
    if (!user.us?.name || !user.us?.Address) {
      setIsEditing(true);
    }
  }, [user]);

  useEffect(() => {
    setAlertState({
      isOpen: true,
      title: 'Important Payment Information',
      description:
        'After completing the payment in your UPI app (like PhonePe or GPay), please wait on this page — it will automatically redirect to our website. Do not press back or close the tab. It may take a few seconds to confirm your payment and place your order.',
      type: 'warning',
      showCancel: false,
    });
  }, []);

  const showAlert = useCallback(
    (title: string, description: string, type: 'success' | 'error' | 'warning' = 'success', onConfirm?: () => void, showCancel = false) => {
      setAlertState({ isOpen: true, title, description, type, onConfirm, showCancel });
    },
    []
  );

  const handleFormSuccess = useCallback(
    (updatedUser: Customer) => {
      setCurrentUser({ ...currentUser, us: updatedUser });
      if (updatedUser.name && updatedUser.Address && (!deliveryMode || updatedUser.pincode)) {
        setIsEditing(false);
      }
    },
    [currentUser, deliveryMode]
  );

  if (!isClient) {
    return <CheckoutSkeleton />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-2">Complete your order</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5" style={{ color: 'oklch(0.7143 0.2145 146.6189)' }} />
                      <CardTitle className="text-xl">{deliveryMode ? 'Delivery Information' : 'COD Information'}</CardTitle>
                    </div>
                    {user.us?.name && user.us?.Address && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <DeliveryModeSelector value={deliveryMode} onChange={setDeliveryMode} />
                  <input type="hidden" name="delivered" value={deliveryMode.toString()} />
                  {isEditing ? (
                    <CheckoutForm user={currentUser} onSuccess={handleFormSuccess} delivery={deliveryMode} />
                  ) : (
                    <UserDetails user={currentUser} deliveryMode={deliveryMode} />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <OrderSummary user={currentUser} showAlert={showAlert} del={deliveryMode} />
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="flex items-center gap-2 p-4 bg-white rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'oklch(0.7143 0.2145 146.6189)' }} />
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            </div>
          }
        >
          <AlertDialogLazy open={alertState.isOpen} onOpenChange={(open) => setAlertState((prev) => ({ ...prev, isOpen: open }))}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
                <AlertDialogDescription>{alertState.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                {alertState.showCancel && <AlertDialogCancel>Cancel</AlertDialogCancel>}
                <AlertDialogAction
                  onClick={() => {
                    alertState.onConfirm?.();
                    setAlertState((prev) => ({ ...prev, isOpen: false }));
                  }}
                >
                  OK
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogLazy>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}




export default CheckoutContent;