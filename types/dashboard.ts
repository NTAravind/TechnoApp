// types/dashboard.ts
export interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalCategories: number
  totalRevenue: number
  paidOrders: number
  pendingOrders: number
  deliveredOrders: number
  todayOrders: number
  todayRevenue: number
  monthlyRevenue: number
  topCustomers: Array<{
    id: number
    name: string
    email: string | null
    phone: string
    totalOrders: number
    totalSpent: number
  }>
  recentOrders: Array<{
    id: string
    total: number
    paid: boolean
    delivered: boolean
    complete: boolean
    createdAt: Date
    customer: {
      name: string
      phone: string
    }
    items: Array<{
      quantity: number
      price: number
      product: {
        name: string
        sku: string
      }
    }>
  }>
  topProducts: Array<{
    id: number
    name: string
    sku: string
    totalSold: number
    revenue: number
  }>
  salesTrend: Array<{
    date: string
    orders: number
    revenue: number
  }>
}

export interface OrderAnalytics {
  totalOrders: number
  paidOrders: number
  deliveredOrders: number
  completedOrders: number
  totalRevenue: number
  averageOrderValue: number
}

export interface OrderWithDetails {
  id: string
  total: number
  paid: boolean
  delivered: boolean
  complete: boolean
  createdAt: Date
  customer: {
    name: string
  }
}

export interface ProductPerformance {
  id: number
  name: string
  sku: string
  category: string
  price: number
  totalSold: number
  revenue: number
  orderCount: number
}

export interface CustomerInsight {
  id: number
  name: string
  email: string | null
  phone: string
  isDistributor: boolean
  totalOrders: number
  paidOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate: Date | null
  daysSinceLastOrder: number | null
}

export interface SalesTrendPoint {
  date: string
  orders: number
  revenue: number
}
interface ProductUpdateData {
  name?: string;
  price?: number;
  unit?: string;
  weight?: string;
  packaging?: string;
  descr?: string;
  categoryId?: number; // Keep as optional number
  isVisible?: boolean;
}