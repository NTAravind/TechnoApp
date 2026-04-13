// app/admin/categories/_actions/categories.ts

"use server"

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function addCategory(prevState: any, formData: FormData) {
  try {
    // Extract form data
    const name = formData.get("name") as string

    // Validation
    if (!name || name.trim().length === 0) {
      return { message: "Category name is required" }
    }

    const trimmedName = name.trim()

    if (trimmedName.length < 2) {
      return { message: "Category name must be at least 2 characters long" }
    }

    if (trimmedName.length > 50) {
      return { message: "Category name must be less than 50 characters" }
    }

    // Check if category name already exists (case-insensitive)
    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      }
    })

    if (existingCategory) {
      return { message: "A category with this name already exists" }
    }

    // Create the category
    await prisma.category.create({
      data: {
        name: trimmedName,
      }
    })

    // Revalidate the categories page
    revalidatePath("/admin/categories")
    
    return { message: "" } // Empty message indicates success
  } catch (error) {
    console.error("Failed to add category:", error)
    
    // Check for specific Prisma errors
    if (error === "P2002") {
      return { message: "A category with this name already exists" }
    }
    
    return { message: "Failed to add category. Please try again." }
  }
}

export async function updateCategory(id: number, prevState: any, formData: FormData) {
  try {
    // Extract form data
    const name = formData.get("name") as string

    // Validation
    if (!name || name.trim().length === 0) {
      return { message: "Category name is required" }
    }

    const trimmedName = name.trim()

    if (trimmedName.length < 2) {
      return { message: "Category name must be at least 2 characters long" }
    }

    if (trimmedName.length > 50) {
      return { message: "Category name must be less than 50 characters" }
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return { message: "Category not found" }
    }

    // Check if another category with this name already exists (case-insensitive, excluding current)
    const duplicateCategory = await prisma.category.findFirst({
      where: { 
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    })

    if (duplicateCategory) {
      return { message: "A category with this name already exists" }
    }

    // Update the category
    await prisma.category.update({
      where: { id },
      data: {
        name: trimmedName,
      }
    })

    // Revalidate the categories page
    revalidatePath("/admin/categories")
    revalidatePath(`/admin/categories/${id}`)
    
    return { message: "" } // Empty message indicates success
  } catch (error) {
    console.error("Failed to update category:", error)
    
    // Check for specific Prisma errors
    if (error === "P2002") {
      return { message: "A category with this name already exists" }
    }
    
    return { message: "Failed to update category. Please try again." }
  }
}

export async function deleteCategory(id: number) {
  try {
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true
      }
    })

    if (!category) {
      throw new Error("Category not found")
    }

    // Check if category has products
    if (category.products.length > 0) {
      throw new Error(`Cannot delete category "${category.name}" because it contains ${category.products.length} product(s). Please move or delete the products first.`)
    }

    // Delete the category
    await prisma.category.delete({
      where: { id }
    })

    // Revalidate the categories page
    revalidatePath("/admin/categories")
    
    return { success: true, message: "Category deleted successfully" }
  } catch (error) {
    console.error("Failed to delete category:", error)
    return { 
      success: false, 
      message: error || "Failed to delete category" 
    }
  }
}
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: true, // To get product count
      },
      orderBy: {
        name: 'asc',
      },
    })
    return categories
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}