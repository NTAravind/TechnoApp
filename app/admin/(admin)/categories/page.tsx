 
import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Package, Calendar, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategories } from '@/app/admin/actions/category'

async function CategoriesList() {
  const categories = await getCategories()

  if (!categories || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No categories found</h3>
        <p className="text-sm text-muted-foreground mb-4">Get started by creating your first category</p>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {categories.map((category) => (
        <Card key={category.id} className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold">{category.name}</CardTitle>
                <CardDescription className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  Created {new Date(category.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="ml-2">
                {category.products?.length || 0} products
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/categories/${category.id}`}>
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/categories/${category.id}/edit`}>
                  Edit
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CategoriesListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-2">
            Manage your product categories and organize your inventory
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Link>
        </Button>
      </div>

      {/* Categories List */}
      <Suspense fallback={<CategoriesListSkeleton />}>
        <CategoriesList />
      </Suspense>
    </div>
  )
}