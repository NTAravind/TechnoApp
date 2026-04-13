'use client'
import { useState, useMemo, useCallback } from 'react'
import { Copy, Check, Calendar, ChevronRight, CheckCircle, Clock, Package2 } from 'lucide-react'

interface OrderItem {
  id: number
  quantity: number
  price: number
  product: {
    id: number
    name: string
    imgurl: string | null
    unit: string
    LooseSell: boolean
    packaging: number | null
    category: {
      id: number
      name: string
    }
  }
}

interface Order {
  id: string
  total: number
  paid: boolean
  delivered: boolean
  complete: boolean
  createdAt: Date
  items: OrderItem[]
}

interface OrderCardProps {
  order: Order
}

function OrderCard({ order }: OrderCardProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const copyOrderId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(order.id.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy order ID:', error)
    }
  }, [order.id])

  const getStatusInfo = useMemo(() => {
    if (order.complete) {
      return { 
        text: 'Delivered', 
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500'
      }
    } else if (order.paid && order.delivered) {
      return { 
        text: 'In Transit', 
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        dot: 'bg-blue-500'
      }
    } else if (order.paid) {
      return { 
        text: 'Preparing', 
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        dot: 'bg-amber-500'
      }
    } else {
      return { 
        text: 'Pending', 
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        dot: 'bg-gray-400'
      }
    }
  }, [order.complete, order.delivered, order.paid])

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }, [])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }, [])

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-5 hover:border-gray-200 transition-all duration-200">
      
      {/* Header - Order Info & Status */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1 mr-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 break-all">
            #{order.id}
          </h3>
          <p className="text-gray-500 text-sm">
            {formatDate(order.createdAt)}
          </p>
        </div>
        
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border flex-shrink-0 ${getStatusInfo.bg} ${getStatusInfo.border}`}>
          <div className={`w-2 h-2 rounded-full ${getStatusInfo.dot}`}></div>
          <span className={`text-sm font-medium ${getStatusInfo.color}`}>
            {getStatusInfo.text}
          </span>
        </div>
      </div>

      {/* Items Preview */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Items
          </h4>
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-sm text-gray-400">
            {order.items.length}
          </span>
        </div>
        
        <div className="space-y-4">
          {/* Always show first 2 items */}
          {order.items.slice(0, 2).map((item) => (
            <div key={`${item.id}-${item.product.id}`} className="flex items-center gap-4">
              {item.product.imgurl && (
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <img
                    src={item.product.imgurl}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate mb-1">
                  {item.product.name}
                </p>
                <p className="text-sm text-gray-500">
                  {item.quantity} {item.product.unit}
                </p>
              </div>
              
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
          
          {/* Expandable section for remaining items */}
          {expanded && order.items.length > 2 && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              {order.items.slice(2).map((item) => (
                <div key={`${item.id}-${item.product.id}`} className="flex items-center gap-4">
                  {item.product.imgurl && (
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <img
                        src={item.product.imgurl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate mb-1">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} {item.product.unit}
                    </p>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Show/Hide toggle for more items */}
          {order.items.length > 2 && (
            <div className="pt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {expanded 
                  ? 'Show Less' 
                  : `Show ${order.items.length - 2} More Items`
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Total & Actions */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600 font-medium">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(order.total)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={copyOrderId}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex-1"
            disabled={copied}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Copy ID</span>
              </>
            )}
          </button>
          
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all duration-200 flex-1"
          >
            <span className="text-sm font-semibold text-blue-700">
              {expanded ? 'Hide Details' : 'View Details'}
            </span>
            <ChevronRight className={`w-4 h-4 text-blue-700 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>
      
    </div>
  )
}

// Export the OrderCard component for use in your Next.js page
export { OrderCard }

// Demo page component (you can remove this if you only need the OrderCard)
export default function OrdersPage() {
  // Mock data for demonstration
  const customer = { name: "John Doe" }
  const orders = [
    {
      id: "ORD-2024-001",
      total: 1250,
      paid: true,
      delivered: false,
      complete: false,
      createdAt: new Date("2024-01-15T10:30:00"),
      items: [
        {
          id: 1,
          quantity: 2,
          price: 350,
          product: {
            id: 1,
            name: "Organic Bananas",
            imgurl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop",
            unit: "kg",
            LooseSell: false,
            packaging: 1,
            category: { id: 1, name: "Fruits" }
          }
        },
        {
          id: 2,
          quantity: 1,
          price: 550,
          product: {
            id: 2,
            name: "Fresh Milk",
            imgurl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&h=100&fit=crop",
            unit: "liter",
            LooseSell: false,
            packaging: 1,
            category: { id: 2, name: "Dairy" }
          }
        }
      ]
    },
    {
      id: "ORD-2024-002",
      total: 890,
      paid: true,
      delivered: true,
      complete: true,
      createdAt: new Date("2024-01-10T14:20:00"),
      items: [
        {
          id: 3,
          quantity: 3,
          price: 200,
          product: {
            id: 3,
            name: "Fresh Bread",
            imgurl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=100&h=100&fit=crop",
            unit: "loaf",
            LooseSell: false,
            packaging: 1,
            category: { id: 3, name: "Bakery" }
          }
        }
      ]
    },
    {
      id: "ORD-2024-003",
      total: 2100,
      paid: false,
      delivered: false,
      complete: false,
      createdAt: new Date("2024-01-18T16:45:00"),
      items: [
        {
          id: 4,
          quantity: 5,
          price: 150,
          product: {
            id: 4,
            name: "Red Apples",
            imgurl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop",
            unit: "kg",
            LooseSell: false,
            packaging: 1,
            category: { id: 1, name: "Fruits" }
          }
        },
        {
          id: 5,
          quantity: 2,
          price: 450,
          product: {
            id: 5,
            name: "Chicken Breast",
            imgurl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&h=100&fit=crop",
            unit: "kg",
            LooseSell: false,
            packaging: 1,
            category: { id: 4, name: "Meat" }
          }
        },
        {
          id: 6,
          quantity: 1,
          price: 750,
          product: {
            id: 6,
            name: "Premium Olive Oil",
            imgurl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&h=100&fit=crop",
            unit: "bottle",
            LooseSell: false,
            packaging: 1,
            category: { id: 5, name: "Pantry" }
          }
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
              <p className="text-gray-600 mt-1">Hi {customer.name}</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
              Request Refund
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-lg mx-auto px-6 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500">Your orders will appear here once you make a purchase.</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-6">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </p>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}