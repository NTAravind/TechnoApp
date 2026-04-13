'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendNotificationToCustomerByPhone } from './push-notification'

// BYPASS PARTNER - Add the partner ID that should skip shipment validation
const BYPASS_PARTNER_ID = "a90ad93a-98f8-4ef8-9faa-01649e58047b" // Change this to your actual partner ID

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
  partnerId: string // Added
  category: {
    id: number
    name: string
  } | null
}

export interface OrderItem {
  id: number
  quantity: number
  price: number
  shippingStatus: string
  shippedBy: string | null
  shippedAt: Date | null
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
  id: string
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
        shippingStatus: item.shippingStatus,
        shippedBy: item.shippedBy,
        shippedAt: item.shippedAt,
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
          partnerId: item.product.partnerId,
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
        shippingStatus: item.shippingStatus,
        shippedBy: item.shippedBy,
        shippedAt: item.shippedAt,
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
          partnerId: item.product.partnerId,
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
        shippingStatus: item.shippingStatus,
        shippedBy: item.shippedBy,
        shippedAt: item.shippedAt,
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
          partnerId: item.product.partnerId,
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
// SHIPMENT VALIDATION & TRACKING - WITH BYPASS PARTNER
///////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Check if order can be completed (all items must be ready to ship)
 * Items from BYPASS_PARTNER_ID are automatically considered ready
 */
export async function canCompleteOrder(orderId: string) {
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
    select: {
      id: true,
      shippingStatus: true,
      shippedBy: true,
      shippedAt: true,
      product: {
        select: { 
          name: true, 
          partnerId: true,
          sku: true
        }
      }
    }
  })

  // Filter out items from bypass partner - they don't need to be shipped
  const itemsRequiringShipment = orderItems.filter(
    item => item.product.partnerId !== BYPASS_PARTNER_ID
  )

  const pendingItems = itemsRequiringShipment.filter(
    item => item.shippingStatus === 'PENDING'
  )

  const cancelledItems = itemsRequiringShipment.filter(
    item => item.shippingStatus === 'CANCELLED'
  )

  const bypassItems = orderItems.filter(
    item => item.product.partnerId === BYPASS_PARTNER_ID
  )

  return {
    canComplete: pendingItems.length === 0 && cancelledItems.length === 0,
    totalItems: orderItems.length,
    itemsRequiringShipment: itemsRequiringShipment.length,
    shippedItems: itemsRequiringShipment.filter(i => i.shippingStatus === 'SHIPPED').length,
    deliveredItems: itemsRequiringShipment.filter(i => i.shippingStatus === 'DELIVERED').length,
    bypassItems: bypassItems.length,
    pendingItems: pendingItems.map(item => ({
      id: item.id,
      productName: item.product.name,
      sku: item.product.sku,
      status: item.shippingStatus,
      partnerId: item.product.partnerId
    })),
    cancelledItems: cancelledItems.map(item => ({
      id: item.id,
      productName: item.product.name,
      sku: item.product.sku,
      status: item.shippingStatus
    })),
    itemsBreakdown: orderItems.map(item => ({
      id: item.id,
      productName: item.product.name,
      sku: item.product.sku,
      status: item.shippingStatus,
      shippedBy: item.shippedBy,
      shippedAt: item.shippedAt,
      partnerId: item.product.partnerId,
      isBypass: item.product.partnerId === BYPASS_PARTNER_ID
    }))
  }
}

/**
 * Get shipment summary for admin dashboard
 */
export async function getOrderShipmentSummary(orderId: string) {
  try {
    const result = await canCompleteOrder(orderId)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Error getting shipment summary:', error)
    return {
      success: false,
      error: 'Failed to get shipment summary'
    }
  }
}

/**
 * Check if a partner ID should bypass shipment validation
 */
export async function isBypassPartner(partnerId: string): Promise<boolean> {
  return partnerId === BYPASS_PARTNER_ID
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// ORDER COMPLETION WITH VALIDATION
///////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Mark order as complete - ONLY if all non-bypass items are ready to ship
 * Automatically marks all SHIPPED items as DELIVERED
 */
export async function markOrderComplete(orderId: string, customerPhone: string) {
  try {
    // STEP 1: Validate all items are ready (excluding bypass partner)
    const validation = await canCompleteOrder(orderId)
    
    if (!validation.canComplete) {
      const errorMsg = validation.pendingItems.length > 0
        ? `Cannot complete order. ${validation.pendingItems.length} item(s) not yet ready to ship by partners.`
        : `Cannot complete order. Order has ${validation.cancelledItems.length} cancelled item(s).`
      
      return { 
        success: false, 
        error: errorMsg,
        pendingItems: validation.pendingItems,
        cancelledItems: validation.cancelledItems
      }
    }

    // STEP 2: Update order and all items in a transaction
    const [updatedOrder] = await prisma.$transaction([
      // Update order status
      prisma.order.update({
        where: { id: orderId },
        data: {
          delivered: true,
          complete: true,
          updatedAt: new Date()
        }
      }),
      // Mark all shipped items as delivered
      prisma.orderItem.updateMany({
        where: { 
          orderId,
          shippingStatus: 'SHIPPED'
        },
        data: {
          shippingStatus: 'DELIVERED'
        }
      })
    ])

    // STEP 3: Send notification to customer
    let notificationSent = false
    let notificationCount = 0

    try {
      const notificationResult = await sendNotificationToCustomerByPhone(
        customerPhone,
        {
          title: 'Order Completed! 🎉',
          body: `Your order #${orderId.slice(-6)} has been completed. Thank you for your order!`,
          icon: '/icons/order-completed.png',
          data: { orderId, type: 'order_completed' }
        }
      )
      notificationSent = notificationResult.success
      notificationCount = notificationResult.sent || 0
    } catch (notifError) {
      console.error('Notification failed (non-critical):', notifError)
    }

    // STEP 4: Revalidate pages
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath('/admin/orders')
    
    return { 
      success: true, 
      data: updatedOrder,
      notificationSent,
      notificationsSent: notificationCount
    }
  } catch (error) {
    console.error('Error completing order:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to complete order' 
    }
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// NOTIFICATIONS & STATUS UPDATES
///////////////////////////////////////////////////////////////////////////////////////////////////////

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

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: true
      }
    })

    const notificationResult = await sendNotificationToCustomerByPhone(
      order.customer.phone,
      notificationPayload
    )

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