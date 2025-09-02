// app/admin/categories/components/CategoryForm.tsx

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useActionState } from "react"
import { addCategory, updateCategory } from "../../actions/category"
import { Category } from "@/app/generated/prisma"
import { Loader2, Tag } from "lucide-react"

export function CategoryForm({ 
  category 
}: { 
  category?: Category | null
}) {
  const [state, action, isPending] = useActionState(
    category == null ? addCategory : updateCategory.bind(null, category.id), 
    { message: " " }
  )

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Tag className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {category ? 'Edit Category' : 'Add New Category'}
            </h1>
            <p className="text-muted-foreground">
              {category ? 'Update category information' : 'Create a new product category'}
            </p>
          </div>
        </div>
      </div>
      
      <form action={action} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input 
              type="text" 
              id="name" 
              name="name" 
              required 
              defaultValue={category?.name || ""} 
              placeholder="e.g., Electronics, Clothing, Books"
              className="text-lg"
            />
            <div className="text-sm text-muted-foreground">
              Choose a clear, descriptive name for your category
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {category && (
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-medium mb-2">Category Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(category.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{new Date(category.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Section */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              disabled={isPending}
              className="flex-1 sm:flex-none sm:min-w-[140px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                category ? 'Update Category' : 'Create Category'
              )}
            </Button>
            
            <Button type="button" variant="outline" className="flex-1 sm:flex-none">
              Cancel
            </Button>
          </div>

          {/* Status Messages */}
          {state.message && state.message !== " " && (
            <div className={`mt-4 p-3 rounded-md ${
              state.message === "" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {state.message === "" ? "✅ Category saved successfully!" : `❌ ${state.message}`}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}