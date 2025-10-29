'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function subscribeUserToPushNotifications(
  subscription: PushSubscriptionData,
  customerId: string
) {
  try {
    // Validate input
    if (!subscription.endpoint || !subscription.keys.p256dh || !subscription.keys.auth) {
      return { success: false, error: 'Invalid subscription data' }
    }
    if (!customerId) {
      return { success: false, error: 'Invalid customer ID' }
    }

    // Use transaction for atomic operations
    return await prisma.$transaction(async (tx) => {
      // Check if subscription already exists
      const existingSubscription = await tx.pushSubscription.findUnique({
        where: { endpoint: subscription.endpoint }
      })

      if (existingSubscription) {
        if (existingSubscription.customerId !== customerId) {
          const updatedSubscription = await tx.pushSubscription.update({
            where: { endpoint: subscription.endpoint },
            data: { customerId }
          })
          revalidatePath('/')
          return { success: true, subscription: updatedSubscription }
        }
        return { success: true, subscription: existingSubscription }
      }

      // Create new subscription
      const newSubscription = await tx.pushSubscription.create({
        data: {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          customerId
        }
      })

      revalidatePath('/')
      return { success: true, subscription: newSubscription }
    })
  } catch (error) {
    console.error('Error subscribing user to push notifications:', error)
    return { success: false, error: 'Failed to save subscription to database' }
  } 
}

export async function unsubscribeUserFromPushNotifications(
  subscription: PushSubscriptionData
) {
  try {
    // Validate input
    if (!subscription.endpoint) {
      return { success: false, error: 'Invalid subscription endpoint' }
    }

    // Use transaction for atomic operations
    return await prisma.$transaction(async (tx) => {
      const deletedSubscription = await tx.pushSubscription.delete({
        where: { endpoint: subscription.endpoint }
      }).catch(() => null) // Ignore if not found

      revalidatePath('/')
      return { success: !!deletedSubscription, subscription: deletedSubscription || null }
    })
  } catch (error) {
    console.error('Error unsubscribing user from push notifications:', error)
    return { success: false, error: 'Failed to remove subscription from database' }
  } 
}

export async function unsubscribeAllCustomerSubscriptions(customerId: string) {
  try {
    // Validate input
    if (!customerId) {
      return { success: false, error: 'Invalid customer ID' }
    }

    // Delete all subscriptions for this customer
    const result = await prisma.pushSubscription.deleteMany({
      where: { customerId }
    })

    revalidatePath('/')
    return { success: true, count: result.count }
  } catch (error) {
    console.error('Error unsubscribing all customer subscriptions:', error)
    return { success: false, error: 'Failed to remove subscriptions' }
  }
}

export async function getCustomerSubscriptionByPhone(customerPhone: string) {
  try {
    // Validate input
    if (!customerPhone) {
      return { success: false, error: 'Invalid customer phone' }
    }

    const customer = await prisma.customer.findUnique({
      where: { phone: customerPhone }
    })

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    const subscription = await prisma.pushSubscription.findFirst({
      where: { customerId: customer.phone }
    })

    return { success: true, subscription }
  } catch (error) {
    console.error('Error fetching customer subscription:', error)
    return { success: false, error: 'Failed to fetch subscription' }
  } 
}

export async function getAllCustomerSubscriptions(customerId: string) {
  try {
    // Validate input
    if (!customerId) {
      return { success: false, error: 'Invalid customer ID' }
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { customerId }
    })

    return { success: true, subscriptions }
  } catch (error) {
    console.error('Error fetching customer subscriptions:', error)
    return { success: false, error: 'Failed to fetch subscriptions' }
  }
}

export async function checkSubscriptionExists(endpoint: string) {
  try {
    // Validate input
    if (!endpoint) {
      return { success: false, error: 'Invalid endpoint' }
    }

    const subscription = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    })

    return { success: true, exists: !!subscription, subscription }
  } catch (error) {
    console.error('Error checking subscription:', error)
    return { success: false, error: 'Failed to check subscription' }
  } 
}