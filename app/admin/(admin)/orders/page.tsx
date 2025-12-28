// app/admin/orders/page.tsx
import { getOrders } from "../../actions/orders"
import { OrdersTable } from "../../components/orders/ordertable"

// Remove this duplicate type definition - use the one from actions/orders
// Or if you need it here, make sure id is string not number
export type Order = {
  id: string  // Changed from number to string (UUID)
  customerId: number
  paid: boolean
  paymentid: string
  delivered: boolean
  complete: boolean
  customer: {
    id: number
    name: string
    phone: string
    email: string | null
    isDistributor: boolean
  }
  items: Array<{
    id: number
    quantity: number
    price: number
    product: {
      id: number
      name: string
      sku: string
      unit: string
    }
  }>
  total: number
  createdAt: Date
  updatedAt: Date
}

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdersPage() {
  const orders = await getOrders()
  
  // Debug log to check if orders are being fetched
  console.log(`Fetched ${orders.length} orders, latest:`, orders[0]?.createdAt)
  
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage and view all customer orders ({orders.length} total)
        </p>
      </div>
      <OrdersTable data={orders} />
    </div>
  )
}