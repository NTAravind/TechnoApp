'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function subscribeUserToPushNotifications(
  subscription: PushSubscriptionData | string,
  customerId: string
) {
  try {
    const token = typeof subscription === 'string' ? subscription : subscription.endpoint;
    
    if (!token) {
      return { success: false, error: 'Invalid token data' }
    }

    if (!customerId) {
      return { success: false, error: 'Invalid customer ID' }
    }

    const customer = await prisma.customer.findUnique({
      where: { phone: customerId }
    })

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    return await prisma.$transaction(async (tx) => {
      const existingSubscription = await tx.pushSubscription.findUnique({
        where: { token }
      })

      if (existingSubscription) {
        if (existingSubscription.customerId !== customerId) {
          const updatedSubscription = await tx.pushSubscription.update({
            where: { token },
            data: { customerId }
          })
          revalidatePath('/')
          return { success: true, subscription: updatedSubscription }
        }
        return { success: true, subscription: existingSubscription }
      }

      const newSubscription = await tx.pushSubscription.create({
        data: {
          token,
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
  token: string
) {
  try {
    if (!token) {
      return { success: false, error: 'Invalid token' }
    }

    return await prisma.$transaction(async (tx) => {
      const deletedSubscription = await tx.pushSubscription.delete({
        where: { token }
      }).catch(() => null)

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
    if (!customerId) {
      return { success: false, error: 'Invalid customer ID' }
    }

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

export async function checkSubscriptionExists(token: string) {
  try {
    if (!token) {
      return { success: false, error: 'Invalid token' }
    }

    const subscription = await prisma.pushSubscription.findUnique({
      where: { token }
    })

    return { success: true, exists: !!subscription, subscription }
  } catch (error) {
    console.error('Error checking subscription:', error)
    return { success: false, error: 'Failed to check subscription' }
  } 
}

export async function getSubscriptionByToken(token: string) {
  try {
    if (!token) {
      return { success: false, error: 'Invalid token' }
    }

    const subscription = await prisma.pushSubscription.findUnique({
      where: { token },
      include: { customer: { select: { id: true, name: true, phone: true } } }
    })

    if (!subscription) {
      return { success: false, error: 'Subscription not found' }
    }

    return { success: true, subscription }
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return { success: false, error: 'Failed to fetch subscription' }
  }
}

export async function cleanupOrphanedSubscriptions() {
  try {
    const orphanedSubscriptions = await prisma.pushSubscription.findMany({
      where: { customerId: null }
    })

    if (orphanedSubscriptions.length === 0) {
      return { success: true, deleted: 0 }
    }

    const result = await prisma.pushSubscription.deleteMany({
      where: { customerId: null }
    })

    revalidatePath('/')
    return { success: true, deleted: result.count }
  } catch (error) {
    console.error('Error cleaning up orphaned subscriptions:', error)
    return { success: false, error: 'Failed to cleanup subscriptions' }
  }
}
