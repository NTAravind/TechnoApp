 // app/admin/product-backup/page.tsx
import { getAllProducts } from "../../actions/products"
import { ProductBackupClient } from "./ProductExporter"

export default async function ProductBackupPage() {
  const result = await getAllProducts()

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Product Backup</h1>
        <p className="text-gray-600 mb-6">
          Export all product data including categories and order items
        </p>

        {result.success ? (
          <ProductBackupClient 
            products={result.data} 
            count={result.count}
            timestamp={result.timestamp}
          />
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-600">{result.error}</p>
          </div>
        )}
      </div>
    </div>
  )
}