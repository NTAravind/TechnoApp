// app/partner/orders/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart } from 'lucide-react'
import { getPartnerOrders } from '../actions/order'
import { PartnerOrdersTable } from '../components/orders-table'

export default async function PartnerOrdersPage() {
  const session = await auth()
  
  if (!session || session.user?.role !== 'partner') {
    redirect('/partner/login')
  }

  const result = await getPartnerOrders(session.user.id)

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading orders: {result.error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Orders</h1>
        <p className="text-slate-600 mt-2">
          Manage and track all orders for your products
        </p>
      </div>

      {/* Orders Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-slate-700" />
            All Orders
          </CardTitle>
          <CardDescription>
            {result.data.length} total order{result.data.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <PartnerOrdersTable data={result.data} />
        </CardContent>
      </Card>
    </div>
  )
}