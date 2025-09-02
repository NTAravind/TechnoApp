'use client'
import { useState, useMemo, useCallback } from 'react'
import { Copy, Check, Package, Calendar, CreditCard, Truck, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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

export default function OrderCard({ order }: OrderCardProps) {
  const [copied, setCopied] = useState(false)

  const copyOrderId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(order.id.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy order ID:', error)
      // Fallback for older browsers or if clipboard API fails
      const textArea = document.createElement('textarea')
      textArea.value = order.id.toString()
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
      }
      document.body.removeChild(textArea)
    }
  }, [order.id])

  const statusBadge = useMemo(() => {
    if (order.complete) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Completed</Badge>
    } else if (order.delivered && order.paid) {
      return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white">Delivery</Badge>
    } else if (order.paid && !order.delivered) {
      return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white">Pick Up</Badge>
    } else if (!order.paid && !order.delivered) {
      return <Badge variant="destructive">Payment Pending</Badge>
    } 
    
    else {
      return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white">Ready for Pickup</Badge>
    }
  }, [order.complete, order.delivered, order.paid])

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }, [])

  const processedItems = useMemo(() => {
    return order.items.map((item) => {
      const hasPackaging = item.product.packaging && item.product.packaging > 0 && !item.product.LooseSell
      const packageCount = hasPackaging ? Math.floor(item.quantity / item.product.packaging!) : 0
      const displayCount = packageCount > 0 ? packageCount : item.quantity
      const totalPrice = item.price * item.quantity

      return {
        ...item,
        hasPackaging,
        packageCount,
        displayCount,
        totalPrice,
      }
    })
  }, [order.items])

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">Order #{order.id}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {statusBadge}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyOrderId} 
              className="h-8"
              disabled={copied}
              aria-label={copied ? 'Order ID copied' : 'Copy order ID'}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy ID
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Order Status Indicators */}
   <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
  <div className={`flex items-center gap-2 ${order.paid ? 'text-green-600' : 'text-gray-400'}`}>
    <CreditCard className="h-4 w-4 flex-shrink-0" />
    <span>
      {order.delivered ? (
        <>
          Payment{' '}
          {order.delivered ? 'Completed' : 'Pending'}
        </>
      ) : (
        'Manual Payment'
      )}
    </span>
  </div>

        
          <div className={`flex items-center gap-2 ${order.complete ? 'text-green-600' : 'text-gray-400'}`}>
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{order.complete ? 'Complete' : 'In Progress'}</span>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Order Items */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 mb-3">
            Items ({order.items.length})
          </h4>
          
          {processedItems.map((item) => (
            <div key={`${item.id}-${item.product.id}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {item.product.imgurl && (
                <div className="flex-shrink-0">
                  <img
                    src={item.product.imgurl}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-md border"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-gray-900 truncate" title={item.product.name}>
                  {item.product.name}
                </h5>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.product.category.name}
                  </Badge>
                  {item.hasPackaging && item.packageCount > 0 ? (
                    <span className="text-xs text-gray-500">
                      {item.packageCount} package{item.packageCount > 1 ? 's' : ''} ({item.product.packaging} {item.product.unit}/pkg)
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {item.quantity} {item.product.unit}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right flex-shrink-0">
                <div className="font-medium">{formatCurrency(item.totalPrice)}</div>
                <div className="text-sm text-gray-500">
                  {item.hasPackaging && item.packageCount > 0 
                    ? `Pkgs: ${item.displayCount}` 
                    : `Qty: ${item.displayCount}`
                  }
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Order Total */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-gray-900">Total</span>
          <span className="text-xl font-bold text-gray-900">{formatCurrency(order.total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}