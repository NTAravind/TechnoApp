// app/partner/actions/products.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getPartnerProducts(partnerId: string) {
  try {
    const products = await prisma.product.findMany({
      where: { partnerId },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return {
      success: true,
      data: products,
      categories,
    }
  } catch (error) {
    console.error('Error fetching partner products:', error)
    return {
      success: false,
      error: 'Failed to fetch products',
      data: [],
      categories: [],
    }
  }
}

export async function getPartnerProductById(productId: number, partnerId: string) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        partnerId,
      },
      include: {
        category: true,
      },
    })

    if (!product) {
      return {
        success: false,
        error: 'Product not found or unauthorized',
      }
    }

    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return {
      success: true,
      data: product,
      categories,
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return {
      success: false,
      error: 'Failed to fetch product details',
    }
  }
}

export async function addPartnerProduct(partnerId: string, _prevState: any, formData: FormData) {
  try {
    // Get partner details to set partnername
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { name: true },
    })

    if (!partner) {
      return { message: 'Partner not found' }
    }

    const name = formData.get('name') as string
    const sku = formData.get('sku') as string
    const categoryId = parseInt(formData.get('categoryId') as string)
    const unit = formData.get('unit') as string
    const descr = formData.get('descr') as string
    const price = parseFloat(formData.get('price') as string)
    const imgurl = formData.get('imgurl') as string
    const isVisible = formData.get('isVisible') === 'true'
    const LooseSell = formData.get('LooseSell') === 'true'

    // Optional fields
    const sizeStr = formData.get('size') as string
    const size = sizeStr ? [parseFloat(sizeStr)] : []
    const weight = (formData.get('weight') as string) || null
    const packagingStr = formData.get('packaging') as string
    const packaging = packagingStr ? parseInt(packagingStr) : null

    // Validate required fields
    if (!name || !sku || !categoryId || !unit || !descr || !price || !imgurl) {
      return { message: 'Missing required fields' }
    }

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku },
    })

    if (existingSku) {
      return { message: 'SKU already exists. Please use a unique SKU.' }
    }

    await prisma.product.create({
      data: {
        name,
        sku,
        categoryId,
        unit,
        descr,
        price,
        imgurl,
        isVisible,
        LooseSell,
        size,
        weight,
        packaging,
        partnerId,
        partnername: partner.name, // Set partner name from Partner table
      },
    })

    revalidatePath('/partner/products')
    return { message: '' }
  } catch (error) {
    console.error('Error adding product:', error)
    return { message: 'Failed to add product. Please try again.' }
  }
}

export async function updatePartnerProduct(
  productId: number,
  partnerId: string,
  _prevState: any,
  formData: FormData
) {
  try {
    // Verify product belongs to partner
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        partnerId,
      },
    })

    if (!existingProduct) {
      return { message: 'Product not found or unauthorized' }
    }

    // Get partner details in case they changed their name
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { name: true },
    })

    if (!partner) {
      return { message: 'Partner not found' }
    }

    const name = formData.get('name') as string
    const sku = formData.get('sku') as string
    const categoryId = parseInt(formData.get('categoryId') as string)
    const unit = formData.get('unit') as string
    const descr = formData.get('descr') as string
    const price = parseFloat(formData.get('price') as string)
    const imgurl = formData.get('imgurl') as string
    const isVisible = formData.get('isVisible') === 'true'
    const LooseSell = formData.get('LooseSell') === 'true'

    // Optional fields
    const sizeStr = formData.get('size') as string
    const size = sizeStr ? [parseFloat(sizeStr)] : []
    const weight = (formData.get('weight') as string) || null
    const packagingStr = formData.get('packaging') as string
    const packaging = packagingStr ? parseInt(packagingStr) : null

    // Check if SKU is being changed and if new SKU exists
    if (sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku },
      })

      if (existingSku) {
        return { message: 'SKU already exists. Please use a unique SKU.' }
      }
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        sku,
        categoryId,
        unit,
        descr,
        price,
        imgurl,
        isVisible,
        LooseSell,
        size,
        weight,
        packaging,
        partnername: partner.name, // Update partner name in case it changed
      },
    })

    revalidatePath('/partner/products')
    revalidatePath(`/partner/products/${productId}`)
    return { message: '' }
  } catch (error) {
    console.error('Error updating product:', error)
    return { message: 'Failed to update product. Please try again.' }
  }
}

export async function updatePartnerProductVisibility(
  productId: number,
  partnerId: string,
  isVisible: boolean
) {
  try {
    // Verify product belongs to partner
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        partnerId,
      },
    })

    if (!existingProduct) {
      return {
        success: false,
        error: 'Product not found or unauthorized',
      }
    }

    await prisma.product.update({
      where: { id: productId },
      data: { isVisible },
    })

    revalidatePath('/partner/products')
    return { success: true }
  } catch (error) {
    console.error('Error updating product visibility:', error)
    return {
      success: false,
      error: 'Failed to update visibility',
    }
  }
}

export async function deletePartnerProduct(productId: number, partnerId: string) {
  try {
    // Verify product belongs to partner
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        partnerId,
      },
    })

    if (!existingProduct) {
      return {
        success: false,
        error: 'Product not found or unauthorized',
      }
    }

    // Check if product has any orders
    const orderItems = await prisma.orderItem.findFirst({
      where: { productId },
    })

    if (orderItems) {
      return {
        success: false,
        error: 'Cannot delete product with existing orders. Hide it instead.',
      }
    }

    await prisma.product.delete({
      where: { id: productId },
    })

    revalidatePath('/partner/products')
    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return {
      success: false,
      error: 'Failed to delete product',
    }
  }
}

// Helper function to sync all products' partnername with their partner's current name
export async function syncPartnerNames(partnerId: string) {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { name: true },
    })

    if (!partner) {
      return {
        success: false,
        error: 'Partner not found',
      }
    }

    // Update all products for this partner with the current partner name
    const result = await prisma.product.updateMany({
      where: { partnerId },
      data: { partnername: partner.name },
    })

    revalidatePath('/partner/products')
    
    return {
      success: true,
      message: `Updated ${result.count} products with partner name "${partner.name}"`,
      count: result.count,
    }
  } catch (error) {
    console.error('Error syncing partner names:', error)
    return {
      success: false,
      error: 'Failed to sync partner names',
    }
  }
}