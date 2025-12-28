import { ProductsTable } from '../../components/products/productdatatable'
import { getProducts, getCategories } from '../../actions/admin'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ProductsPage() {
  const [productsResult, categoriesResult] = await Promise.all([
    getProducts(),
    getCategories()
  ])

  if (!productsResult.success || !categoriesResult.success) {
    return <div>Error loading data</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
          <Link href="/admin/products/add" className="mt-4 inline-block"><Button>Add</Button></Link>
        </div>
      </div>
      <ProductsTable data={productsResult.data ?? []} categories={categoriesResult.data ?? []} />
    </div>
  )
}
