// app/admin/orders/page.tsx
import { getOrders } from "../actions/orders"
import { OrdersTable } from "../components/orders/ordertable"

export type Order = {
  id: number
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

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage and view all customer orders
        </p>
      </div>
      <OrdersTable data={orders} />
    </div>
  )
}