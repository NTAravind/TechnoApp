'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

// Product Actions
export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return { success: true, data: products }
  } catch (error) {
    return { success: false, error: 'Failed to fetch products' }
  }
}

export async function updateProductVisibility(productId: number, isVisible: boolean) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { 
        // Assuming you add an isVisible field to your schema
        // For now, we'll use a different approach or you can add this field
        updatedAt: new Date(),
      },
    })
    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update product visibility' }
  }
}

export async function deleteProduct(productId: number) {
  try {
    await prisma.product.delete({
      where: { id: productId },
    })
    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete product' }
  }
}

export async function updateProduct(productId: number, data: {
  name?: string
  price?: number
  unit?: string
  weight?: string
  packaging?: number
  descr?: string
  categoryId?: number
}) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        // Spread only the scalar fields
        name: data.name,
        price: data.price,
        unit: data.unit,
        weight: data.weight,
        packaging: data.packaging,
        descr: data.descr,
        // Handle category relation if categoryId is provided
        ...(data.categoryId !== undefined
          ? { category: { connect: { id: data.categoryId } } }
          : {}),
        updatedAt: new Date(),
      },
    })
    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update product' }
  }
}
// Order Actions
export async function getOrders() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return { success: true, data: orders }
  } catch (error) {
    return { success: false, error: 'Failed to fetch orders' }
  }
}

export async function getOrderById(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })
    if (!order) {
      return { success: false, error: 'Order not found' }
    }
    return { success: true, data: order }
  } catch (error) {
    return { success: false, error: 'Failed to fetch order' }
  }
}

// Customer Actions
export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return { success: true, data: customers }
  } catch (error) {
    return { success: false, error: 'Failed to fetch customers' }
  }
}

export async function deleteCustomer(customerId: number) {
  try {
    await prisma.customer.delete({
      where: { id: customerId },
    })
    revalidatePath('/admin/customers')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete customer' }
  }
}

// Categories (helper for product forms)
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return { success: true, data: categories }
  } catch (error) {
    return { success: false, error: 'Failed to fetch categories' }
  }
}