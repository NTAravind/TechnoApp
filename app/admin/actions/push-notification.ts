import webpush from 'web-push'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY! // This should be in your .env file, not public
)

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export async function sendNotificationToCustomer(
  customerId: string,
  payload: NotificationPayload
) {
  try {
    // Get all push subscriptions for this customer
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { customerId }
    })

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for customer ${customerId}`)
      return { success: true, sent: 0 }
    }

    const promises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: subscription.keys as { p256dh: string; auth: string }
        }

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        )

        return { success: true, subscriptionId: subscription.id }
      } catch (error) {
        console.error(`Failed to send notification to subscription ${subscription.id}:`, error)
        
        // If subscription is no longer valid, remove it from database
        if (error instanceof Error && error.message.includes('410')) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id }
          }).catch(console.error)
        }
        
        return { success: false, subscriptionId: subscription.id, error }
      }
    })

    const results = await Promise.allSettled(promises)
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    return { success: true, sent: successful, total: subscriptions.length }
  } catch (error) {
    console.error('Error sending notifications:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendNotificationToCustomerByPhone(
  customerPhone: string,
  payload: NotificationPayload
) {
  try {
    // Get customer by phone number
    const customer = await prisma.customer.findUnique({
      where: { phone: customerPhone },
      include: {
        pushSubscriptions: true
      }
    })

    if (!customer) {
      console.log(`Customer with phone ${customerPhone} not found`)
      return { success: false, error: 'Customer not found' }
    }

    if (customer.pushSubscriptions.length === 0) {
      console.log(`No push subscriptions found for customer ${customerPhone}`)
      return { success: true, sent: 0 }
    }

    const promises = customer.pushSubscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: subscription.keys as { p256dh: string; auth: string }
        }

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        )

        return { success: true, subscriptionId: subscription.id }
      } catch (error) {
        console.error(`Failed to send notification to subscription ${subscription.id}:`, error)
        
        // If subscription is no longer valid, remove it from database
        if (error instanceof Error && error.message.includes('410')) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id }
          }).catch(console.error)
        }
        
        return { success: false, subscriptionId: subscription.id, error }
      }
    })

    const results = await Promise.allSettled(promises)
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    return { success: true, sent: successful, total: customer.pushSubscriptions.length }
  } catch (error) {
    console.error('Error sending notifications:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendOrderNotification(
  orderId: string,
  notificationType: 'created' | 'confirmed' | 'preparing' | 'ready' | 'delivered'
) {
  try {
    // Get order with customer details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    const payloads: Record<typeof notificationType, NotificationPayload> = {
      created: {
        title: 'Order Received!',
        body: `Your order #${orderId.slice(-6)} for ₹${order.total.toFixed(2)} has been received and is being processed.`,
        icon: '/icons/order-created.png',
        data: { orderId, type: 'order_created' }
      },
      confirmed: {
        title: 'Order Confirmed',
        body: `Your order #${orderId.slice(-6)} has been confirmed and will be prepared soon.`,
        icon: '/icons/order-confirmed.png',
        data: { orderId, type: 'order_confirmed' }
      },
      preparing: {
        title: 'Order Being Prepared',
        body: `Your order #${orderId.slice(-6)} is now being prepared for delivery.`,
        icon: '/icons/order-preparing.png',
        data: { orderId, type: 'order_preparing' }
      },
      ready: {
        title: 'Order Ready!',
        body: `Your order #${orderId.slice(-6)} is ready for pickup/delivery.`,
        icon: '/icons/order-ready.png',
        data: { orderId, type: 'order_ready' },
        actions: [
          {
            action: 'view_order',
            title: 'View Order'
          }
        ]
      },
      delivered: {
        title: 'Order Delivered!',
        body: `Your order #${orderId.slice(-6)} has been successfully delivered. Thank you for shopping with us!`,
        icon: '/icons/order-delivered.png',
        data: { orderId, type: 'order_delivered' },
        actions: [
          {
            action: 'rate_order',
            title: 'Rate Order'
          },
          {
            action: 'reorder',
            title: 'Order Again'
          }
        ]
      }
    }

    const payload = payloads[notificationType]
    const result = await sendNotificationToCustomerByPhone(order.customer.phone, payload)

    return result
  } catch (error) {
    console.error('Error sending order notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Utility function to send bulk notifications (e.g., for promotions)
export async function sendBulkNotification(
  payload: NotificationPayload,
  customerIds?: string[]
) {
  try {
    let subscriptions

    if (customerIds && customerIds.length > 0) {
      // Send to specific customers
      subscriptions = await prisma.pushSubscription.findMany({
        where: {
          customerId: {
            in: customerIds
          }
        }
      })
    } else {
      // Send to all subscribed customers
      subscriptions = await prisma.pushSubscription.findMany({
        where: {
          customerId: {
            not: null
          }
        }
      })
    }

    if (subscriptions.length === 0) {
      return { success: true, sent: 0 }
    }

    const promises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: subscription.keys as { p256dh: string; auth: string }
        }

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        )

        return { success: true }
      } catch (error) {
        console.error(`Failed to send bulk notification:`, error)
        
        // Clean up invalid subscriptions
        if (error instanceof Error && error.message.includes('410')) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id }
          }).catch(console.error)
        }
        
        return { success: false }
      }
    })

    const results = await Promise.allSettled(promises)
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    return { success: true, sent: successful, total: subscriptions.length }
  } catch (error) {
    console.error('Error sending bulk notifications:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}