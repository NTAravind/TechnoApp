import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Activity, ShoppingCart, Package, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { DashboardStats } from '@/types/dashboard'

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: string
  className?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  className = "" 
}) => (
  <Card className={`hover:shadow-md transition-shadow duration-200 ${className}`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {trend && (
        <div className="flex items-center mt-2">
          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
          <span className="text-xs text-green-500">{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
)

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <Skeleton className="h-96" />
      <Skeleton className="h-96" />
    </div>
  </div>
)

interface RecentOrdersListProps {
  orders: DashboardStats['recentOrders']
}

export const RecentOrdersList: React.FC<RecentOrdersListProps> = ({ orders }) => (
  <Card>
    <CardHeader>
      <CardTitle>Recent Orders</CardTitle>
      <CardDescription>Latest orders from your customers</CardDescription>
    </CardHeader>
    <CardContent>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No orders yet</h3>
          <p className="text-sm text-muted-foreground">Orders will appear here once customers start purchasing</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{order.customer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {order.customer.phone}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={order.paid ? "default" : "secondary"} className="text-xs">
                      {order.paid ? "Paid" : "Pending"}
                    </Badge>
                    {order.delivered && (
                      <Badge variant="outline" className="text-xs">
                        Delivered
                      </Badge>
                    )}
                    {order.complete && (
                      <Badge variant="secondary" className="text-xs">
                        Complete
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{order.total.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)

interface TopProductsListProps {
  products: DashboardStats['topProducts']
}

export const TopProductsList: React.FC<TopProductsListProps> = ({ products }) => (
  <Card>
    <CardHeader>
      <CardTitle>Top Products</CardTitle>
      <CardDescription>Best selling products by quantity</CardDescription>
    </CardHeader>
    <CardContent>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No sales data yet</h3>
          <p className="text-sm text-muted-foreground">Product sales will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{product.totalSold} sold</p>
                <p className="text-sm text-muted-foreground">₹{product.revenue.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)

interface TopCustomersListProps {
  customers: DashboardStats['topCustomers']
}

export const TopCustomersList: React.FC<TopCustomersListProps> = ({ customers }) => (
  <Card>
    <CardHeader>
      <CardTitle>Top Customers</CardTitle>
      <CardDescription>Customers by total spending</CardDescription>
    </CardHeader>
    <CardContent>
      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No customer data yet</h3>
          <p className="text-sm text-muted-foreground">Customer spending will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customers.map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{customer.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {customer.email || customer.phone}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{customer.totalSpent.toLocaleString('en-IN')}</p>
                <p className="text-sm text-muted-foreground">{customer.totalOrders} orders</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error Boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Something went wrong loading the dashboard. Please refresh the page.
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2 text-xs">
                <summary>Error details</summary>
                <pre className="mt-1 whitespace-pre-wrap">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}