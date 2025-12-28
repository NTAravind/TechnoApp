// app/partner/actions/shipment.ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface ShipmentResult {
  success: boolean
  error?: string
  data?: any
  customerPhone?: string
}

/**
 * Mark a single order item as shipped
 * Only the partner who owns the product can ship it
 */
export async function markItemAsShipped(orderItemId: number): Promise<ShipmentResult> {
  const session = await auth()
  
  if (!session || session.user?.role !== 'partner') {
    return { success: false, error: 'Unauthorized - Partner login required' }
  }

  const partnerId = session.user.partnerId || session.user.id

  try {
    // Verify this item belongs to partner's product
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        product: true,
        order: {
          include: {
            customer: true
          }
        }
      }
    })

    if (!orderItem) {
      return { success: false, error: 'Order item not found' }
    }

    // Authorization check
    if (orderItem.product.partnerId !== partnerId) {
      return { success: false, error: 'Not authorized to ship this item' }
    }

    // Check current status
    if (orderItem.shippingStatus === 'SHIPPED' || orderItem.shippingStatus === 'DELIVERED') {
      return { success: false, error: 'Item already shipped' }
    }

    if (orderItem.shippingStatus === 'CANCELLED') {
      return { success: false, error: 'Cannot ship cancelled item' }
    }

    // Mark as shipped
    const updated = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        shippingStatus: 'SHIPPED',
        shippedBy: partnerId,
        shippedAt: new Date()
      }
    })

    // Revalidate relevant pages
    revalidatePath(`/partner/orders/${orderItem.orderId}`)
    revalidatePath(`/partner/orders`)
    revalidatePath(`/admin/orders/${orderItem.orderId}`)
    
    return { 
      success: true, 
      data: updated,
      customerPhone: orderItem.order.customer.phone 
    }
  } catch (error) {
    console.error('Error marking item as shipped:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update shipping status' 
    }
  }
}

/**
 * Bulk mark multiple items as shipped
 * Only marks items that belong to the partner and are pending
 */
export async function markItemsAsShipped(orderItemIds: number[]): Promise<ShipmentResult> {
  const session = await auth()
  
  if (!session || session.user?.role !== 'partner') {
    return { success: false, error: 'Unauthorized - Partner login required' }
  }

  const partnerId = session.user.partnerId || session.user.id

  try {
    // Verify all items belong to this partner
    const items = await prisma.orderItem.findMany({
      where: {
        id: { in: orderItemIds },
        product: {
          partnerId: partnerId
        }
      },
      include: {
        product: true,
        order: true
      }
    })

    if (items.length === 0) {
      return { success: false, error: 'No valid items found to ship' }
    }

    if (items.length !== orderItemIds.length) {
      return { 
        success: false, 
        error: `Only ${items.length} of ${orderItemIds.length} items belong to you` 
      }
    }

    // Bulk update
    const result = await prisma.orderItem.updateMany({
      where: {
        id: { in: orderItemIds },
        product: {
          partnerId: partnerId
        },
        shippingStatus: 'PENDING'
      },
      data: {
        shippingStatus: 'SHIPPED',
        shippedBy: partnerId,
        shippedAt: new Date()
      }
    })

    // Revalidate pages for all affected orders
    const uniqueOrderIds = [...new Set(items.map(item => item.orderId))]
    uniqueOrderIds.forEach(orderId => {
      revalidatePath(`/partner/orders/${orderId}`)
      revalidatePath(`/admin/orders/${orderId}`)
    })
    revalidatePath(`/partner/orders`)
    
    return { 
      success: true, 
      data: { 
        count: result.count,
        itemsShipped: result.count 
      }
    }
  } catch (error) {
    console.error('Error bulk marking items as shipped:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update shipping status' 
    }
  }
}

/**
 * Get shipment status for partner's items in an order
 */
export async function getPartnerItemsShipmentStatus(orderId: string) {
  const session = await auth()
  
  if (!session || session.user?.role !== 'partner') {
    return { success: false, error: 'Unauthorized' }
  }

  const partnerId = session.user.partnerId || session.user.id

  try {
    const items = await prisma.orderItem.findMany({
      where: {
        orderId,
        product: {
          partnerId: partnerId
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            imgurl: true
          }
        }
      },
      orderBy: {
        shippingStatus: 'asc'
      }
    })

    const summary = {
      total: items.length,
      pending: items.filter(i => i.shippingStatus === 'PENDING').length,
      shipped: items.filter(i => i.shippingStatus === 'SHIPPED').length,
      delivered: items.filter(i => i.shippingStatus === 'DELIVERED').length,
      cancelled: items.filter(i => i.shippingStatus === 'CANCELLED').length
    }

    return {
      success: true,
      data: {
        items,
        summary
      }
    }
  } catch (error) {
    console.error('Error fetching shipment status:', error)
    return { 
      success: false, 
      error: 'Failed to fetch shipment status' 
    }
  }
}

/**
 * Cancel shipment for an item (only if not yet shipped)
 */
export async function cancelItemShipment(orderItemId: number, reason?: string): Promise<ShipmentResult> {
  const session = await auth()
  
  if (!session || session.user?.role !== 'partner') {
    return { success: false, error: 'Unauthorized' }
  }

  const partnerId = session.user.partnerId || session.user.id

  try {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        product: true
      }
    })

    if (!orderItem) {
      return { success: false, error: 'Order item not found' }
    }

    if (orderItem.product.partnerId !== partnerId) {
      return { success: false, error: 'Not authorized' }
    }

    if (orderItem.shippingStatus === 'DELIVERED') {
      return { success: false, error: 'Cannot cancel delivered item' }
    }

    const updated = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        shippingStatus: 'CANCELLED'
      }
    })

    revalidatePath(`/partner/orders/${orderItem.orderId}`)
    revalidatePath(`/admin/orders/${orderItem.orderId}`)

    return { success: true, data: updated }
  } catch (error) {
    console.error('Error cancelling shipment:', error)
    return { success: false, error: 'Failed to cancel shipment' }
  }
}