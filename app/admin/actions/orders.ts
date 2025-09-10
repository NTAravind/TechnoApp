'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendNotificationToCustomerByPhone } from './push-notification'
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

///////////////////////////////////////////////////////////////////////////////////////////////////////
///////NOTIFICaTIONS RELATED CODE BELOW
///////////////////////////////////////////////////////////////////////////////////////////////////////
export async function markOrderComplete(orderId: string, customerPhone: string) {
  try {
    // Update order to complete
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        complete: true,
        delivered: true // Mark as delivered when complete
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Send completion notification
    const notificationPayload = {
      title: 'Order Completed! 🎉',
      body: `Your order #${orderId.slice(-6)} worth ₹${order.total.toFixed(2)} has been completed successfully. Thank you for shopping with us!`,
      icon: '/icons/order-completed.png',
      badge: '/icons/notification-badge.png',
      data: { 
        orderId, 
        type: 'order_completed',
        total: order.total,
        customerPhone 
      },
      actions: [
        {
          action: 'view_order',
          title: 'View Order Details'
        },
        {
          action: 'shop_again',
          title: 'Shop Again'
        }
      ]
    }

    // Send notification using customer phone
    const notificationResult = await sendNotificationToCustomerByPhone(
      customerPhone, 
      notificationPayload
    )

    // Revalidate pages to show updated status
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${orderId}`)

    return { 
      success: true, 
      order,
      notificationSent: notificationResult.success,
      notificationsSent: notificationResult.sent || 0
    }
  } catch (error) {
    console.error('Error marking order complete:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to complete order' 
    }
  }
}

// Alternative function for updating order status with notifications
export async function updateOrderStatusWithNotification(
  orderId: string,
  status: 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'completed'
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true
      }
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    const updateData: any = {}
    let notificationPayload: any

    switch (status) {
      case 'confirmed':
        notificationPayload = {
          title: 'Order Confirmed ✅',
          body: `Your order #${orderId.slice(-6)} has been confirmed and will be prepared soon.`,
          icon: '/icons/order-confirmed.png',
          data: { orderId, type: 'order_confirmed' }
        }
        break

      case 'preparing':
        notificationPayload = {
          title: 'Order Being Prepared 👨‍🍳',
          body: `Your order #${orderId.slice(-6)} is now being prepared with care.`,
          icon: '/icons/order-preparing.png',
          data: { orderId, type: 'order_preparing' }
        }
        break

      case 'ready':
        notificationPayload = {
          title: 'Order Ready! 📦',
          body: `Your order #${orderId.slice(-6)} is ready for pickup/delivery.`,
          icon: '/icons/order-ready.png',
          data: { orderId, type: 'order_ready' },
          actions: [
            {
              action: 'track_delivery',
              title: 'Track Delivery'
            }
          ]
        }
        break

      case 'delivered':
        updateData.delivered = true
        notificationPayload = {
          title: 'Order Delivered! 🚚',
          body: `Your order #${orderId.slice(-6)} has been successfully delivered.`,
          icon: '/icons/order-delivered.png',
          data: { orderId, type: 'order_delivered' },
          actions: [
            {
              action: 'rate_order',
              title: 'Rate Your Experience'
            }
          ]
        }
        break

      case 'completed':
        updateData.complete = true
        updateData.delivered = true
        notificationPayload = {
          title: 'Order Completed! 🎉',
          body: `Your order #${orderId.slice(-6)} is now complete. Thank you for choosing us!`,
          icon: '/icons/order-completed.png',
          data: { orderId, type: 'order_completed' },
          actions: [
            {
              action: 'shop_again',
              title: 'Shop Again'
            },
            {
              action: 'leave_review',
              title: 'Leave Review'
            }
          ]
        }
        break

      default:
        return { success: false, error: 'Invalid status' }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: true
      }
    })

    // Send notification
    const notificationResult = await sendNotificationToCustomerByPhone(
      order.customer.phone,
      notificationPayload
    )

    // Revalidate pages
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${orderId}`)

    return {
      success: true,
      order: updatedOrder,
      status,
      notificationSent: notificationResult.success,
      notificationsSent: notificationResult.sent || 0
    }
  } catch (error) {
    console.error('Error updating order status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order'
    }
  }
}