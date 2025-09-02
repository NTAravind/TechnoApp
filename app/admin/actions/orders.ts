'use server'

import { prisma } from '@/lib/prisma'

// Updated types to match the Prisma schema and component expectations
export interface OrderProduct {
  id: number
  name: string
  sku: string
  unit: string
  imgurl: string | null
  descr: string | null
  size: number[]
  weight: string | null
  packaging: number | null
  LooseSell: boolean
  category: {
    id: number
    name: string
  } | null
}

export interface OrderItem {
  id: number
  quantity: number
  price: number
  product: OrderProduct
}

export interface OrderCustomer {
  id: number
  name: string
  phone: string
  email: string | null
  isDistributor: boolean
  Address: string | null
  pincode: string | null
}

export interface Order {
  id: string // Changed to string for UUID
  customerId: number
  paid: boolean
  paymentid: string
  delivered: boolean
  complete: boolean
  customer: OrderCustomer
  items: OrderItem[]
  total: number
  createdAt: Date
  updatedAt: Date
}

export async function getOrders(): Promise<Order[]> {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return orders.map(order => ({
      id: order.id,
      customerId: order.customerId,
      paid: order.paid,
      paymentid: order.paymentid || '',
      delivered: order.delivered,
      complete: order.complete,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        isDistributor: order.customer.isDistributor,
        Address: order.customer.Address,
        pincode: order.customer.pincode
      },
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          unit: item.product.unit,
          imgurl: item.product.imgurl,
          descr: item.product.descr,
          size: item.product.size,
          weight: item.product.weight,
          packaging: item.product.packaging,
          LooseSell: item.product.LooseSell,
          category: item.product.category ? {
            id: item.product.category.id,
            name: item.product.category.name
          } : null
        }
      })),
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw new Error('Failed to fetch orders')
  }
}

// Updated to accept string ID (UUID) and return proper success/error structure
export async function getOrderById(id: string): Promise<{ success: boolean; data: Order | null; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return { success: false, data: null, error: 'Order not found' }
    }

    const orderData: Order = {
      id: order.id,
      customerId: order.customerId,
      paid: order.paid,
      paymentid: order.paymentid || '',
      delivered: order.delivered,
      complete: order.complete,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        isDistributor: order.customer.isDistributor,
        Address: order.customer.Address,
        pincode: order.customer.pincode
      },
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          unit: item.product.unit,
          imgurl: item.product.imgurl,
          descr: item.product.descr,
          size: item.product.size,
          weight: item.product.weight,
          packaging: item.product.packaging,
          LooseSell: item.product.LooseSell,
          category: item.product.category ? {
            id: item.product.category.id,
            name: item.product.category.name
          } : null
        }
      })),
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }

    return { success: true, data: orderData }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { success: false, data: null, error: 'Failed to fetch order' }
  }
}

// Updated to accept string ID (UUID)
export async function updateOrderStatus(
  id: string, 
  updates: {
    paid?: boolean
    delivered?: boolean
    complete?: boolean
  }
): Promise<{ success: boolean; data: Order | null; error?: string }> {
  try {
    const order = await prisma.order.update({
      where: { id },
      data: updates,
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })

    const orderData: Order = {
      id: order.id,
      customerId: order.customerId,
      paid: order.paid,
      paymentid: order.paymentid || '',
      delivered: order.delivered,
      complete: order.complete,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        isDistributor: order.customer.isDistributor,
        Address: order.customer.Address,
        pincode: order.customer.pincode
      },
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          unit: item.product.unit,
          imgurl: item.product.imgurl,
          descr: item.product.descr,
          size: item.product.size,
          weight: item.product.weight,
          packaging: item.product.packaging,
          LooseSell: item.product.LooseSell,
          category: item.product.category ? {
            id: item.product.category.id,
            name: item.product.category.name
          } : null
        }
      })),
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }

    return { success: true, data: orderData }
  } catch (error) {
    console.error('Error updating order:', error)
    return { success: false, data: null, error: 'Failed to update order' }
  }
}