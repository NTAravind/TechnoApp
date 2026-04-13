// app/partner/orders/[id]/page.tsx
import { auth } from '@/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, User, Clock, CreditCard, CheckCircle, XCircle, Truck, MapPin, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { fcurrency } from '@/lib/utils'
import Image from 'next/image'
import { getPartnerOrderById } from '../../actions/order'
import PartnerShipmentActions from '../../components/partnershipment'

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PartnerOrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth()
  
  if (!session || session.user?.role !== 'partner') {
    redirect('/partner/login')
  }

  const resolvedParams = await params
  const orderId = resolvedParams.id
  const partnerId = session.user.partnerId || session.user.id
  const result = await getPartnerOrderById(orderId, partnerId)

  if (!result.success || !result.data) {
    notFound()
  }

  const order = result.data

  // Filter items to show only this partner's products
  const partnerItems = order.items.filter(item => item.product.partnerId === partnerId)

  const getStatusBadge = (paid: boolean, delivered: boolean, complete: boolean) => {
    if (complete) return { text: 'Completed', variant: 'default', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    if (delivered) return { text: 'Delivered', variant: 'secondary', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    if (paid) return { text: 'Processing', variant: 'secondary', color: 'bg-amber-100 text-amber-800 border-amber-200' }
    return { text: 'Pending', variant: 'outline', color: 'bg-slate-100 text-slate-700 border-slate-300' }
  }

  const getShippingBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return { text: 'Delivered', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
      case 'SHIPPED':
        return { text: 'Shipped', color: 'bg-blue-100 text-blue-800 border-blue-200' }
      case 'CANCELLED':
        return { text: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' }
      default:
        return { text: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' }
    }
  }

  const statusBadge = getStatusBadge(order.paid, order.delivered, order.complete)

  // Calculate partner's items summary
  const partnerTotal = partnerItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const pendingShipments = partnerItems.filter(item => item.shippingStatus === 'PENDING')
  const shippedItems = partnerItems.filter(item => item.shippingStatus === 'SHIPPED' || item.shippingStatus === 'DELIVERED')

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-fit transition-all hover:bg-slate-100 hover:border-slate-300"
          >
            <Link href="/partner/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Order #{order.id.slice(-8)}
              </h1>
              <Badge className={`w-fit ${statusBadge.color} font-medium`}>
                {statusBadge.text}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <p className="text-sm text-slate-600">
                Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Shipment Status Alert */}
        {pendingShipments.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">Action Required</h3>
                <p className="text-sm text-amber-700 mt-1">
                  You have {pendingShipments.length} item{pendingShipments.length !== 1 ? 's' : ''} pending shipment.
                  Please mark them as shipped when ready.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Products in This Order */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShoppingBag className="h-5 w-5 text-slate-700" />
                  Your Products ({partnerItems.length})
                </CardTitle>
                <CardDescription>
                  Items from your catalog in this order
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {partnerItems.map((item, index) => {
                    const packageCount = item.product.packaging && !item.product.LooseSell
                      ? Math.floor(item.quantity / item.product.packaging)
                      : 0
                    const displayCount = packageCount > 0 ? packageCount : item.quantity
                    const shippingBadge = getShippingBadge(item.shippingStatus)

                    return (
                      <div key={item.id}>
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <Image
                              src={item.product.imgurl || '/placeholder-image.jpg'}
                              alt={item.product.name}
                              width={96}
                              height={96}
                              className="object-cover rounded-lg border-2 border-slate-200 shadow-sm"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-slate-900 text-lg">{item.product.name}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <Badge variant="outline" className="font-mono text-xs bg-slate-50">
                                    SKU: {item.product.sku}
                                  </Badge>
                                  {item.product.category?.name && (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.product.category.name}
                                    </Badge>
                                  )}
                                  <Badge className={`text-xs ${shippingBadge.color}`}>
                                    {shippingBadge.text}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                  <div className="font-bold text-slate-900 text-lg">
                                    {fcurrency(item.price * item.quantity)}
                                  </div>
                                  <div className="text-sm text-slate-600 mt-1">
                                    {packageCount > 0 ? `Pkg: ${displayCount}` : `Qty: ${displayCount}`}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {item.product.descr && (
                              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.product.descr}</p>
                            )}
                            
                            <div className="text-sm text-slate-500 mt-3 space-y-1">
                              {item.product.size?.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Size:</span>
                                  <span>{item.product.size.join(', ')}</span>
                                </div>
                              )}
                              {item.product.weight && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Weight:</span>
                                  <span>{item.product.weight}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {packageCount > 0 ? 'Packages:' : 'Quantity:'}
                                </span>
                                <span>
                                  {packageCount > 0
                                    ? `${packageCount} package${packageCount > 1 ? 's' : ''} (${item.product.packaging} ${item.product.unit}/pkg)`
                                    : `${item.quantity} ${item.product.unit}`}
                                </span>
                              </div>
                            </div>

                            {/* Shipment Info */}
                            {item.shippedAt && (
                              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                                Shipped on {new Date(item.shippedAt).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        {index < partnerItems.length - 1 && <Separator className="mt-6" />}
                      </div>
                    )
                  })}
                </div>

                <div className="bg-slate-50 rounded-lg p-6 mt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Your Items Total ({partnerItems.length})</span>
                      <span className="font-medium">{fcurrency(partnerTotal)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipment Actions */}
            <PartnerShipmentActions 
              orderId={order.id}
              items={partnerItems}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-slate-700" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-xl font-semibold text-slate-900">{order.customer.name}</div>
                    {order.customer.isDistributor && (
                      <Badge variant="secondary" className="mt-2 bg-indigo-100 text-indigo-800 border-indigo-200">
                        Distributor Account
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-700">Phone:</span>
                      <span className="text-slate-600">{order.customer.phone}</span>
                    </div>
                    {order.customer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700">Email:</span>
                        <span className="text-slate-600">{order.customer.email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-slate-700">Address:</div>
                        <div className="text-slate-600">{order.customer.Address}</div>
                        <div className="text-slate-600">Pincode: {order.customer.pincode}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Order Summary */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-slate-700" />
                  Your Items Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900">{fcurrency(partnerTotal)}</div>
                    <p className="text-sm text-slate-600 mt-1">
                      {partnerItems.length} item{partnerItems.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Shipped:</span>
                      <span className="font-medium text-blue-700">{shippedItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pending:</span>
                      <span className="font-medium text-amber-700">{pendingShipments.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Cards */}
            <div className="grid gap-4">
              {/* Payment Status */}
              <Card className={`border-2 ${order.paid ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {order.paid ? (
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">
                        {order.paid ? 'Payment Received' : 'Payment Pending'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {order.paid ? 'Order confirmed' : 'Awaiting payment'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Status */}
              <Card className={`border-2 ${order.complete ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Truck className={`h-6 w-6 ${order.complete ? 'text-emerald-600' : 'text-blue-600'}`} />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {order.complete ? 'Order Complete' : 'In Progress'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {order.complete ? 'All done!' : 'Processing order'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}