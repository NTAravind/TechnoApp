// app/partner/products/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getPartnerProducts } from '../actions/products'
import { PartnerProductsTable } from '../components/products-table'

export default async function PartnerProductsPage() {
  const session = await auth()
  
  if (!session || session.user?.role !== 'partner') {
    redirect('/partner/login')
  }

  const result = await getPartnerProducts(session.user.id)

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading products: {result.error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="text-slate-600 mt-2">
            Manage your product catalog and inventory
          </p>
        </div>
        <Button asChild size="lg" className="w-fit">
          <Link href="/partner/products/new">
            <Plus className="mr-2 h-5 w-5" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.data.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visible Products</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {result.data.filter(p => p.isVisible).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden Products</CardTitle>
            <Package className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">
              {result.data.filter(p => !p.isVisible).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-slate-700" />
            All Products
          </CardTitle>
          <CardDescription>
            Manage and update your product listings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <PartnerProductsTable data={result.data} categories={result.categories} />
        </CardContent>
      </Card>
    </div>
  )
}