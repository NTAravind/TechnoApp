// app/partner/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Package, ShoppingCart, Users, CheckCircle, Clock, XCircle, TrendingUp, ArrowRight } from 'lucide-react'
import { fcurrency } from '@/lib/utils'
import { getPartnerStats } from './actions/dashboard'
import Link from 'next/link'
import { cn } from '@/lib/utils'
export default async function PartnerDashboard() {
  const session = await auth()
  if (!session || session.user?.role !== 'partner') {
    redirect('/partner/login')
  }

  const stats = await getPartnerStats(session.user.id)
  if (!stats.success || !stats.data) {
    return <div className="p-8 text-center text-muted-foreground">Error loading dashboard</div>
  }

  const data = stats.data

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8"> {/* Extra bottom padding for floating dock */}
      {/* Light Welcome */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-lg text-muted-foreground mt-2">
          {session.user.name || 'Partner'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {/* Total Revenue */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fcurrency(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.completedOrders} completed</p>
          </CardContent>
        </Card>

        {/* Products Listed */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products Listed</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.visibleProducts} visible</p>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique buyers</p>
          </CardContent>
        </Card>
      </div>

      {/* This Month + Order Status */}
      <div className="grid gap-6 md:grid-cols-2 mb-10">
        {/* This Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              This Month
            </CardTitle>
            <CardDescription>Revenue and order performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-sm text-muted-foreground">Revenue</div>
              <div className="text-3xl font-bold">{fcurrency(data.monthlyRevenue)}</div>
            </div>
            <div className="grid grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <div className="text-sm text-muted-foreground">Orders</div>
                <div className="text-2xl font-semibold">{data.monthlyOrders}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg. Order Value</div>
                <div className="text-2xl font-semibold">
                  {fcurrency(data.monthlyOrders > 0 ? data.monthlyRevenue / data.monthlyOrders : 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Completed</span>
              </div>
              <span className="text-2xl font-bold">{data.completedOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-medium">In Progress</span>
              </div>
              <span className="text-2xl font-bold">{data.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Unpaid</span>
              </div>
              <span className="text-2xl font-bold">{data.unpaidOrders}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/partner/orders" className="flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentOrders.length > 0 ? (
            <div className="divide-y">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          order.complete ? "bg-green-100 text-green-800" :
                          order.paid ? "bg-blue-100 text-blue-800" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {order.complete ? 'Complete' : order.paid ? 'Processing' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.customer.name} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{fcurrency(order.total)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              No orders yet. Start adding products to receive orders!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}