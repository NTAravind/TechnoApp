// app/admin/product/[id]/page.tsx
import { notFound } from "next/navigation"
import { ProductForm } from "../../components/products/productForm"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: {
      id: parseInt(id)
    },
    include: {
      category: true
    }
  })

  if (!product) {
    return null
  }

  return product
}

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })
}

export default async function EditProductPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // Await the params promise
  const resolvedParams = await params
  
  // Validate ID is numeric
  const productId = parseInt(resolvedParams.id)
  if (isNaN(productId)) {
    notFound()
  }

  // Fetch product and categories in parallel
  const [product, categories] = await Promise.all([
    getProduct(resolvedParams.id),
    getCategories()
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/products">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Products
                </Button>
              </Link>
              <div className="border-l pl-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  <h1 className="text-xl font-semibold">Edit Product</h1>
                </div>
                <p className="text-sm text-gray-600">
                  {product.name} • SKU: {product.sku}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Category:</span>
              <span className="font-medium">{product.category?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <ProductForm product={product} categories={categories} />
      </div>
    </div>
  )
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  // Await the params promise
  const resolvedParams = await params
  const product = await getProduct(resolvedParams.id)
  
  if (!product) {
    return {
      title: 'Product Not Found'
    }
  }

  return {
    title: `Edit ${product.name} - Admin`,
    description: `Edit product: ${product.name} (SKU: ${product.sku})`
  }
}