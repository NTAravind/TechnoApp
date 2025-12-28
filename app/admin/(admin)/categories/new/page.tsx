// app/admin/categories/new/page.tsx

import { CategoryForm } from "@/app/admin/components/categories/Categoryform"

export default async function NewCategoryPage() {
  return (
    <div className="container mx-auto py-6">
      <CategoryForm />
    </div>
  )
}

export const metadata = {
  title: "Add New Category",
  description: "Create a new product category",
}