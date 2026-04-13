"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addProduct(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const sku = formData.get("sku") as string
    const sizeString = formData.get("size") as string
    const weight = formData.get("weight") as string
    const imgurl = formData.get("imgurl") as string
    const unit = formData.get("unit") as string
    const price = parseFloat(formData.get("price") as string)
    const categoryId = parseInt(formData.get("categoryId") as string)
    const descr = formData.get("descr") as string
    const packagingString = formData.get("packaging") as string
    const isVisible = formData.get("isVisible") === "true"
    const LooseSell = formData.get("LooseSell") === "true"

    // Handle single size - convert to array with one element or empty array
    let sizes: number[] = []
    if (sizeString && sizeString.trim() !== "") {
      const sizeValue = parseFloat(sizeString.trim())
      if (!isNaN(sizeValue)) {
        sizes = [sizeValue]
      }
    }

    // Convert packaging string to integer
    let packaging: number | null = null
    if (packagingString && packagingString.trim() !== "") {
      const packagingValue = parseInt(packagingString.trim())
      if (!isNaN(packagingValue)) {
        packaging = packagingValue
      }
    }

    if (!name || !sku || !imgurl || !unit || !categoryId || isNaN(price) || !descr) {
      return { message: "Please fill in all required fields" }
    }

    if (price <= 0) {
      return { message: "Price must be greater than 0" }
    }

    if (descr.trim().length < 10) {
      return { message: "Description must be at least 10 characters long" }
    }

    const existingSku = await prisma.product.findUnique({
      where: { sku }
    })

    if (existingSku) {
      return { message: "SKU already exists. Please use a unique SKU." }
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return { message: "Selected category does not exist" }
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        size: sizes,
        weight: weight || null,
        imgurl,
        unit,
        price,
        categoryId,
        descr,
        packaging,
        isVisible,
        LooseSell
      }
    })

    revalidatePath("/admin/products")
    revalidatePath("/products")
    revalidatePath(`/products/${product.id}`)
    return { message: "" }
  } catch (error: any) {
    console.error("Failed to add product:", error)
    if (error?.code === "P2002") {
      return { message: "SKU System: SKU already exists. Please use a unique SKU." }
    }
    return { message: "Failed to add product. Please try again." }
  }
}

export async function updateProduct(id: number, prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const sku = formData.get("sku") as string
    const sizeString = formData.get("size") as string
    const weight = formData.get("weight") as string
    const imgurl = formData.get("imgurl") as string
    const unit = formData.get("unit") as string
    const price = parseFloat(formData.get("price") as string)
    const categoryId = parseInt(formData.get("categoryId") as string)
    const descr = formData.get("descr") as string
    const packagingString = formData.get("packaging") as string
    const isVisible = formData.get("isVisible") === "true"
    const LooseSell = formData.get("LooseSell") === "true"

    // Handle single size - convert to array with one element or empty array
    let sizes: number[] = []
    if (sizeString && sizeString.trim() !== "") {
      const sizeValue = parseFloat(sizeString.trim())
      if (!isNaN(sizeValue)) {
        sizes = [sizeValue]
      }
    }

    // Convert packaging string to integer
    let packaging: number | null = null
    if (packagingString && packagingString.trim() !== "") {
      const packagingValue = parseInt(packagingString.trim())
      if (!isNaN(packagingValue)) {
        packaging = packagingValue
      }
    }

    if (!name || !sku || !imgurl || !unit || !categoryId || isNaN(price) || !descr) {
      return { message: "Please fill in all required fields" }
    }

    if (price <= 0) {
      return { message: "Price must be greater than 0" }
    }

    if (descr.trim().length < 10) {
      return { message: "Description must be at least 10 characters long" }
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return { message: "Product not found" }
    }

    const existingSku = await prisma.product.findUnique({
      where: { sku }
    })

    if (existingSku && existingSku.id !== id) {
      return { message: "SKU already exists. Please use a unique SKU." }
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return { message: "Selected category does not exist" }
    }

    await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        size: sizes,
        weight: weight || null,
        imgurl,
        unit,
        price,
        categoryId,
        descr,
        packaging,
        isVisible,
        LooseSell
      }
    })

    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${id}`)
    revalidatePath("/products")
    revalidatePath(`/products/${id}`)
    return { message: "" }
  } catch (error: any) {
    console.error("Failed to update product:", error)
    if (error?.code === "P2002") {
      return { message: "SKU already exists. Please use a unique SKU." }
    }
    return { message: "Failed to update product. Please try again." }
  }
}

export async function deleteProduct(id: number) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true
      }
    })

    if (!product) {
      throw new Error("Product not found")
    }

    if (product.orderItems.length > 0) {
      throw new Error("Cannot delete product with existing orders")
    }

    await prisma.product.delete({
      where: { id }
    })

    revalidatePath("/admin/products")
    revalidatePath("/products")
    revalidatePath(`/products/${id}`)
    return { success: true, message: "Product deleted successfully" }
  } catch (error: any) {
    console.error("Failed to delete product:", error)
    return { 
      success: false, 
      message: error?.message || "Failed to delete product" 
    }
  }
}

interface BulkUploadState {
  success: boolean
  message: string
  processed: number
  total: number
  errors: string[]
}

export async function bulkUploadProducts(
  prevState: BulkUploadState,
  formData: FormData
): Promise<BulkUploadState> {
  try {
    // Extract form data
    const categoryId = parseInt(formData.get("categoryId") as string)
    const imageUrl = formData.get("imageUrl") as string
    const generalDescription = formData.get("generalDescription") as string
    const productsDataString = formData.get("productsData") as string
    const isVisible = formData.get("isVisible") !== "false"
    const LooseSell = formData.get("LooseSell") === "true"

    // Validation
    if (!categoryId || isNaN(categoryId)) {
      return {
        success: false,
        message: "Please select a valid category",
        processed: 0,
        total: 0,
        errors: ["Invalid category selected"]
      }
    }

    if (!imageUrl) {
      return {
        success: false,
        message: "Please upload a product image",
        processed: 0,
        total: 0,
        errors: ["Product image is required"]
      }
    }

    if (!productsDataString) {
      return {
        success: false,
        message: "No product data provided",
        processed: 0,
        total: 0,
        errors: ["Product data is required"]
      }
    }

    // Parse products data
    let products: ValidatedProduct[]
    try {
      products = JSON.parse(productsDataString)
    } catch (error) {
      return {
        success: false,
        message: "Invalid product data format",
        processed: 0,
        total: 0,
        errors: ["Failed to parse product data"]
      }
    }

    if (!Array.isArray(products) || products.length === 0) {
      return {
        success: false,
        message: "No valid products found",
        processed: 0,
        total: 0,
        errors: ["Product list is empty"]
      }
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return {
        success: false,
        message: "Selected category does not exist",
        processed: 0,
        total: products.length,
        errors: ["Invalid category"]
      }
    }

    // Check for existing SKUs in database
    const existingSKUs = await prisma.product.findMany({
      where: {
        sku: {
          in: products.map(p => p.SKU)
        }
      },
      select: {
        sku: true
      }
    })

    const existingSKUSet = new Set(existingSKUs.map(p => p.sku))
    const duplicateSKUs: string[] = []
    const createdProductIds: number[] = []

    // Process products one by one
    let processed = 0
    const errors: string[] = []
    const successfulProducts: string[] = []

    for (const product of products) {
      try {
        // Check for duplicate SKU
        if (existingSKUSet.has(product.SKU)) {
          duplicateSKUs.push(product.SKU)
          errors.push(`SKU ${product.SKU} (${product.Name}): Already exists in database`)
          continue
        }

        // Validate product data
        if (!product.Name || product.Name.trim().length === 0) {
          errors.push(`SKU ${product.SKU}: Product name is required`)
          continue
        }

        if (!product.Unit || product.Unit.trim().length === 0) {
          errors.push(`SKU ${product.SKU} (${product.Name}): Unit is required`)
          continue
        }

        if (isNaN(product.price) || product.price <= 0) {
          errors.push(`SKU ${product.SKU} (${product.Name}): Valid price is required`)
          continue
        }

        // Prepare description
        const description = product.Description?.trim() || 
                          generalDescription?.trim() || 
                          `Product: ${product.Name}`

        if (description.length < 10) {
          errors.push(`SKU ${product.SKU} (${product.Name}): Description must be at least 10 characters`)
          continue
        }

        // Handle single size - only take the first size if multiple are provided
        const numericSizes: number[] = []
        if (product.size && !isNaN(product.size)) {
          numericSizes.push(product.size)
        }

        // Convert packaging to integer
        let packaging: number | null = null
        if (product.Packaging && !isNaN(product.Packaging)) {
          packaging = product.Packaging
        }

        // Create the product
        const createdProduct = await prisma.product.create({
          data: {
            name: product.Name.trim(),
            sku: product.SKU.trim(),
            size: numericSizes,
            weight: product.Weight?.trim() || null,
            imgurl: imageUrl,
            unit: product.Unit.trim(),
            price: product.price,
            categoryId: categoryId,
            descr: description,
            packaging,
            isVisible: isVisible,
            LooseSell: LooseSell
          }
        })

        // Add to existing SKUs to prevent duplicates within this batch
        existingSKUSet.add(product.SKU)
        createdProductIds.push(createdProduct.id)
        processed++
        successfulProducts.push(`${product.SKU} - ${product.Name}`)

      } catch (error: any) {
        console.error(`Failed to create product ${product.SKU}:`, error)
        
        if (error?.code === "P2002") {
          errors.push(`SKU ${product.SKU} (${product.Name}): SKU already exists`)
        } else if (error?.code === "P2003") {
          errors.push(`SKU ${product.SKU} (${product.Name}): Invalid category reference`)
        } else {
          errors.push(`SKU ${product.SKU} (${product.Name}): ${error?.message || 'Failed to create product'}`)
        }
      }
    }

    // Revalidate paths
    revalidatePath("/admin/products")
    revalidatePath("/products")
    createdProductIds.forEach(id => {
      revalidatePath(`/products/${id}`)
    })

    // Prepare response message
    let message = ""
    if (processed === products.length) {
      message = `Successfully uploaded all ${processed} products!`
    } else if (processed > 0) {
      message = `Partially successful: ${processed} of ${products.length} products uploaded.`
    } else {
      message = "Failed to upload any products. Please check the errors below."
    }

    return {
      success: processed > 0,
      message,
      processed,
      total: products.length,
      errors
    }

  } catch (error: any) {
    console.error("Bulk upload failed:", error)
    return {
      success: false,
      message: "Bulk upload failed due to server error",
      processed: 0,
      total: 0,
      errors: [error?.message || "Unknown server error occurred"]
    }
  }
}

interface ValidatedProduct {
  SKU: string
  Name: string
  Unit: string
  price: number
  Packaging?: number  // Changed from string to number
  Weight?: string
  size: number
  Description?: string
}

export async function validateBulkUploadData(
  categoryId: number,
  products: ValidatedProduct[]
): Promise<{ valid: boolean; errors: string[] }> {
  try {
    const errors: string[] = []

    // Check category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      errors.push("Selected category does not exist")
    }

    // Check for existing SKUs
    if (products.length > 0) {
      const existingSKUs = await prisma.product.findMany({
        where: {
          sku: {
            in: products.map(p => p.SKU)
          }
        },
        select: {
          sku: true,
          name: true
        }
      })

      existingSKUs.forEach(existing => {
        errors.push(`SKU ${existing.sku} already exists in database (${existing.name})`)
      })
    }

    // Validate each product
    products.forEach((product, index) => {
      if (!product.Name || product.Name.trim().length === 0) {
        errors.push(`Row ${index + 1}: Product name is required`)
      }
      
      if (!product.SKU || product.SKU.trim().length === 0) {
        errors.push(`Row ${index + 1}: SKU is required`)
      }
      
      if (!product.Unit || product.Unit.trim().length === 0) {
        errors.push(`Row ${index + 1}: Unit is required`)
      }
      
      if (isNaN(product.price) || product.price <= 0) {
        errors.push(`Row ${index + 1}: Valid price greater than 0 is required`)
      }

      // Validate packaging if provided
      if (product.Packaging !== undefined && (isNaN(product.Packaging) || product.Packaging < 0)) {
        errors.push(`Row ${index + 1}: Packaging must be a valid positive number`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }

  } catch (error) {
    console.error("Validation failed:", error)
    return {
      valid: false,
      errors: ["Failed to validate data due to server error"]
    }
  }
}


export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        orderItems: true,
      },
      orderBy: {
        id: 'asc',
      },
    })

    return {
      success: true,
      data: products,
      count: products.length,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return {
      success: false,
      error: 'Failed to fetch products',
      data: [],
      count: 0,
    }
  }
}