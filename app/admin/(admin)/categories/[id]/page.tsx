// app/admin/categories/[id]/edit/page.tsx
import { prisma } from "@/lib/prisma"
import { CategoryForm } from "@/app/admin/components/categories/Categoryform"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

async function getCategory(id: number) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })
    return category
  } catch (error) {
    console.error("Failed to fetch category:", error)
    return null
  }
}

interface EditCategoryPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  // Await the params promise
  const resolvedParams = await params
  const categoryId = parseInt(resolvedParams.id)
  
  if (isNaN(categoryId)) {
    notFound()
  }

  const category = await getCategory(categoryId)

  if (!category) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/categories">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Category</h1>
            <p className="text-muted-foreground mt-2">
              Update category information for: <strong>{category.name}</strong>
            </p>
          </div>
          <div className="text-sm text-muted-foreground text-right">
            <div>{category._count.products} product(s)</div>
            <div>Created: {new Date(category.createdAt).toLocaleDateString()}</div>
            <div>Updated: {new Date(category.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
      <CategoryForm category={category} />
    </div>
  )
}

export async function generateMetadata({ params }: EditCategoryPageProps) {
  // Await the params promise
  const resolvedParams = await params
  const categoryId = parseInt(resolvedParams.id)
  
  if (isNaN(categoryId)) {
    return {
      title: "Category Not Found",
    }
  }

  const category = await getCategory(categoryId)

  if (!category) {
    return {
      title: "Category Not Found",
    }
  }

  return {
    title: `Edit ${category.name}`,
    description: `Edit category information for ${category.name}`,
  }
}