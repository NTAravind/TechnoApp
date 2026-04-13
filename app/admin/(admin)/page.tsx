 
'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { 
  Package, 
  ShoppingCart, 
  Users, 
  FolderOpen,
  TrendingUp,
  DollarSign,
  Activity,
  Eye,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getDashboardStats , refreshDashboard } from '../actions/dashboard'
import { DashboardStats } from '@/types/dashboard'

// Import sub-components
import { StatsCard ,DashboardSkeleton ,RecentOrdersList ,TopProductsList , TopCustomersList ,ErrorBoundary } from '../components/admin/dashboard'


// Main Dashboard Component
const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchStats = async () => {
    try {
      setError(null)
      const data = await getDashboardStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        await refreshDashboard()
        await fetchStats()
      } catch (err) {
        setError('Failed to refresh dashboard')
      }
    })
  }

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto p-6">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchStats}
                className="ml-4"
                disabled={isPending}
              >
                {isPending ? 'Retrying...' : 'Try Again'}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening with your store today.
              </p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={isPending}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
              {isPending ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {/* Primary Revenue Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatsCard
              title="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
              description="From paid orders only"
              icon={DollarSign}
            />
            <StatsCard
              title="Today's Revenue"
              value={`₹${stats.todayRevenue.toLocaleString('en-IN')}`}
              description={`${stats.todayOrders} orders today`}
              icon={TrendingUp}
            />
            <StatsCard
              title="Monthly Revenue"
              value={`₹${stats.monthlyRevenue.toLocaleString('en-IN')}`}
              description="This month's total"
              icon={Activity}
            />
            <StatsCard
              title="Average Order Value"
              value={`₹${stats.paidOrders > 0 ? (stats.totalRevenue / stats.paidOrders).toFixed(0) : '0'}`}
              description="Per paid order"
              icon={Eye}
            />
          </div>

          {/* Order & Inventory Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              description={`${stats.paidOrders} paid orders`}
              icon={ShoppingCart}
            />
            <StatsCard
              title="Order Status"
              value={`${stats.pendingOrders} pending`}
              description={`${stats.deliveredOrders} delivered`}
              icon={Clock}
            />
            <StatsCard
              title="Active Products"
              value={stats.totalProducts.toLocaleString()}
              description={`${stats.totalCategories} categories`}
              icon={Package}
            />
            <StatsCard
              title="Total Customers"
              value={stats.totalCustomers.toLocaleString()}
              description="Registered users"
              icon={Users}
            />
          </div>

          {/* Data Tables - Recent Orders & Top Products */}
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <RecentOrdersList orders={stats.recentOrders} />
            <TopProductsList products={stats.topProducts} />
          </div>

          {/* Top Customers - Full Width */}
          {stats.topCustomers.length > 0 && (
            <div className="mb-6">
              <TopCustomersList customers={stats.topCustomers} />
            </div>
          )}

          {/* Sales Trend Chart Placeholder */}
      

          {/* Empty State Messages */}
          {stats.totalOrders === 0 && (
            <Alert className="mt-6">
              <Activity className="h-4 w-4" />
              <AlertDescription>
                <strong>Welcome to your admin dashboard!</strong> 
                <br />
                Once you start receiving orders, you'll see detailed analytics and insights here.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default AdminDashboard