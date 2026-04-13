'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, Package, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { markItemAsShipped, markItemsAsShipped } from '../actions/shipment'
import { useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'

interface OrderItem {
  id: number
  quantity: number
  price: number
  shippingStatus: string
  shippedBy: string | null
  shippedAt: Date | null
  product: {
    id: number
    name: string
    sku: string
    unit: string
    imgurl: string | null
    descr: string | null
    size: number[]
    weight: string | null
    packaging: number | null
    LooseSell: boolean
  }
}

interface PartnerShipmentActionsProps {
  orderId: string
  items: OrderItem[]
}

export default function PartnerShipmentActions({ orderId, items }: PartnerShipmentActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const pendingItems = items.filter(item => item.shippingStatus === 'PENDING')
  
  if (pendingItems.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle className="h-6 w-6" />
            <div>
              <p className="font-semibold">All items shipped!</p>
              <p className="text-sm">You've marked all your items as shipped for this order.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleSingleShip = async (itemId: number, productName: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const result = await markItemAsShipped(itemId)
      
      if (result.success) {
        setSuccessMessage(`✓ ${productName} marked as shipped`)
        setTimeout(() => {
          router.refresh()
          setSuccessMessage(null)
        }, 2000)
      } else {
        setErrorMessage(result.error || 'Failed to mark item as shipped')
      }
    } catch (error) {
      setErrorMessage('An error occurred while updating shipment status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkShip = async () => {
    if (selectedItems.length === 0) return

    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const result = await markItemsAsShipped(selectedItems)
      
      if (result.success) {
        setSuccessMessage(`✓ ${selectedItems.length} item(s) marked as shipped`)
        setSelectedItems([])
        setTimeout(() => {
          router.refresh()
          setSuccessMessage(null)
        }, 2000)
      } else {
        setErrorMessage(result.error || 'Failed to mark items as shipped')
      }
    } catch (error) {
      setErrorMessage('An error occurred while updating shipment status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedItems.length === pendingItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(pendingItems.map(item => item.id))
    }
  }

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Truck className="h-5 w-5 text-slate-700" />
          Shipment Actions
        </CardTitle>
        <CardDescription>
          Mark items as shipped when you've dispatched them
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Bulk Actions */}
        {pendingItems.length > 1 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedItems.length === pendingItems.length}
                  onCheckedChange={handleSelectAll}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-slate-900">Bulk Ship Items</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedItems.length > 0 
                      ? `${selectedItems.length} item(s) selected`
                      : 'Select multiple items to ship together'
                    }
                  </p>
                </div>
              </div>
              {selectedItems.length > 0 && (
                <Button
                  onClick={handleBulkShip}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Shipping...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Ship Selected ({selectedItems.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Individual Items */}
        <div className="space-y-3">
          {pendingItems.map(item => (
            <div 
              key={item.id}
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {pendingItems.length > 1 && (
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                      className="mt-1"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-slate-500" />
                      <h4 className="font-semibold text-slate-900">{item.product.name}</h4>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      SKU: {item.product.sku} • Qty: {item.quantity} {item.product.unit}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleSingleShip(item.id, item.product.name)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Shipping...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Shipped
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
          <p className="font-medium mb-1">Important:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Only mark items as shipped after they've been physically dispatched</li>
            <li>The admin can only complete the order after all partners have shipped their items</li>
            <li>Customers will be notified when the order is complete</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}