import { prisma } from "@/lib/prisma"
import { ProductForm } from "../../components/products/productForm"
import {BulkProductUpload } from "../../components/products/BulkOrder"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    return categories
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return []
  }
}

export default async function NewProductPage() {
  const categories = await getCategories()

  // Redirect if no categories exist
  if (categories.length === 0) {
    redirect("/admin/categories/new?message=Please create at least one category first")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground mt-2">
          Create a new product or upload multiple products for your inventory
        </p>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="single">Add Single Product</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="single">
          <ProductForm categories={categories} />
        </TabsContent>
        <TabsContent value="bulk">
          <BulkProductUpload categories={categories} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export const metadata = {
  title: "Add New Product",
  description: "Add a new product or upload multiple products to your inventory",
}