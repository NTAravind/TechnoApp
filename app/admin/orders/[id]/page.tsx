'use server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, User, Calendar, CreditCard, CheckCircle, XCircle, DollarSign, Truck, Clock, MapPin } from 'lucide-react'
import MarkToComplete from '../../components/orders/marktocomplete'
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

import { getOrderById, Order, OrderItem } from '../../actions/orders'

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  // Await the params promise
  const resolvedParams = await params
  const orderId = resolvedParams.id
  const result = await getOrderById(orderId)

  if (!result.success || !result.data) {
    notFound()
  }

  const order = result.data

  const getStatusColor = (status: boolean, type: 'payment' | 'delivery' | 'completion') => {
    if (status) return 'text-emerald-600'
    if (type === 'payment') return 'text-red-500'
    if (type === 'delivery') return 'text-amber-500'
    return 'text-slate-400'
  }

  const getStatusBadge = (paid: boolean, delivered: boolean, complete: boolean) => {
    if (complete) return { text: 'Completed', variant: 'default', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    if (delivered) return { text: 'Delivered', variant: 'secondary', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    if (paid) return { text: 'Processing', variant: 'secondary', color: 'bg-amber-100 text-amber-800 border-amber-200' }
    return { text: 'Pending', variant: 'outline', color: 'bg-slate-100 text-slate-700 border-slate-300' }
  }

  const statusBadge = getStatusBadge(order.paid, order.delivered, order.complete)

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
            <Link href="/admin/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Order #{order.id}
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Package className="h-5 w-5 text-slate-700" />
                  Order Items
                </CardTitle>
                <CardDescription>
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''} in this order
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {order.items.map((item: OrderItem, index: number) => {
                    const packageCount = item.product.packaging && !item.product.LooseSell
                      ? Math.floor(item.quantity / item.product.packaging)
                      : 0
                    const displayCount = packageCount > 0 ? packageCount : item.quantity

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
                        {index < order.items.length - 1 && <Separator className="mt-6" />}
                      </div>
                    )
                  })}
                </div>

                <div className="bg-slate-50 rounded-lg p-6 mt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal ({order.items.length} items)</span>
                      <span className="font-medium">
                        {fcurrency(
                          order.items.reduce((sum: number, item: OrderItem) => sum + item.price * item.quantity, 0)
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold text-slate-900">
                      <span>Total</span>
                      <span>{fcurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-xl">Order Timeline</CardTitle>
                <CardDescription>Track the progress of this order</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mt-1 ring-4 ring-emerald-100" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Order Created</p>
                      <p className="text-sm text-slate-600">
                        {new Date(order.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  {order.paid && (
                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 ring-4 ring-blue-100" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">Payment Confirmed</p>
                        {order.paymentid && (
                          <p className="text-sm text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded mt-1 inline-block">
                            Payment ID: {order.paymentid}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {order.delivered && (
                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mt-1 ring-4 ring-purple-100" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">Order Delivered</p>
                        <p className="text-sm text-slate-600">Package successfully delivered to customer</p>
                      </div>
                    </div>
                  )}
                  {order.complete && (
                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-emerald-600 rounded-full mt-1 ring-4 ring-emerald-100" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">Order Completed</p>
                        <p className="text-sm text-slate-600">Transaction successfully completed</p>
                      </div>
                    </div>
                  )}
                  {order.updatedAt.getTime() !== order.createdAt.getTime() && (
                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-amber-500 rounded-full mt-1 ring-4 ring-amber-100" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">Order Updated</p>
                        <p className="text-sm text-slate-600">
                          {new Date(order.updatedAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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

            {/* Order Summary */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-slate-700" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900">{fcurrency(order.total)}</div>
                    <p className="text-sm text-slate-600 mt-1">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
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
                        {order.paid ? 'Fully paid' : 'Awaiting payment'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Status */}
              <Card className={`border-2 ${order.delivered ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Truck className={`h-6 w-6 ${order.delivered ? 'text-blue-600' : 'text-amber-600'}`} />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {order.delivered ? 'Delivered' : 'In Transit'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {order.delivered ? 'Successfully delivered' : 'Being processed'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Completion Status */}
              <Card className={`border-2 ${order.complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-6 w-6 ${order.complete ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {order.complete ? 'Order Complete' : 'In Progress'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {order.complete ? 'Transaction closed' : 'Processing order'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mark Complete Button - Only show if not complete */}
            {!order.complete && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle className="text-lg">Order Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <MarkToComplete 
                    prop={{ 
                      id: order.id,
                      phone: order.customer.phone 
                    }} 
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}