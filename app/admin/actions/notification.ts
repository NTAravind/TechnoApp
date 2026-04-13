'use server'

import prisma from '@/lib/prisma'

import { sendBulkNotification, sendNotificationToCustomerByPhone } from './push-notification'
import { revalidatePath } from 'next/cache'



export interface AdminNotificationData {
  title: string
  message: string
  targetType: 'all' | 'distributors' | 'regular' | 'specific' | 'recent_orders'
  specificPhones?: string[]
  icon?: string
  actionUrl?: string
  actionText?: string
  daysBack?: number // for recent_orders targeting
}

// Get customer statistics for targeting options
export async function getCustomerStats() {
  try {
    const [totalCustomers, distributors, regularCustomers, subscribedCustomers, recentOrderCustomers] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { isDistributor: true } }),
      prisma.customer.count({ where: { isDistributor: false } }),
      prisma.pushSubscription.count({
        where: { customerId: { not: null } }
      }),
      prisma.customer.count({
        where: {
          orders: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          }
        }
      })
    ])

    return {
      success: true,
      stats: {
        totalCustomers,
        distributors,
        regularCustomers,
        subscribedCustomers,
        recentOrderCustomers
      }
    }
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    return { success: false, error: 'Failed to fetch customer statistics' }
  }
}

// Get list of customers for specific targeting
export async function getCustomersForTargeting() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        isDistributor: true,
        pushSubscriptions: {
          select: {
            id: true
          }
        },
        orders: {
          select: {
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const customersWithStats = customers.map(customer => ({
      ...customer,
      hasNotifications: customer.pushSubscriptions.length > 0,
      lastOrderDate: customer.orders[0]?.createdAt || null,
      pushSubscriptions: undefined, // Remove from response
      orders: undefined // Remove from response
    }))

    return { success: true, customers: customersWithStats }
  } catch (error) {
    console.error('Error fetching customers:', error)
    return { success: false, error: 'Failed to fetch customers' }
  }
}

// Send notification to targeted audience
export async function sendAdminNotification(notificationData: AdminNotificationData) {
  try {
    const { title, message, targetType, specificPhones, icon, actionUrl, actionText, daysBack } = notificationData

    // Build notification payload
    const payload = {
      title,
      body: message,
      icon: icon || '/icons/admin-notification.png',
      badge: '/icons/notification-badge.png',
      data: {
        type: 'admin_notification',
        url: actionUrl,
        timestamp: Date.now()
      },
      actions: actionUrl && actionText ? [
        {
          action: 'open_link',
          title: actionText
        }
      ] : undefined
    }

    let customerIds: string[] | undefined
    let targetDescription = ''

    // Determine target audience
    switch (targetType) {
      case 'all':
        customerIds = undefined // Send to all
        targetDescription = 'all customers'
        break

      case 'distributors':
        const distributors = await prisma.customer.findMany({
          where: { isDistributor: true },
          select: { phone: true }
        })
        customerIds = distributors.map(c => c.phone)
        targetDescription = `${customerIds.length} distributors`
        break

      case 'regular':
        const regularCustomers = await prisma.customer.findMany({
          where: { isDistributor: false },
          select: { phone: true }
        })
        customerIds = regularCustomers.map(c => c.phone)
        targetDescription = `${customerIds.length} regular customers`
        break

      case 'specific':
        if (!specificPhones || specificPhones.length === 0) {
          return { success: false, error: 'No phone numbers specified for targeted notification' }
        }
        
        const specificCustomers = await prisma.customer.findMany({
          where: { phone: { in: specificPhones } },
          select: {  phone: true }
        })
        
        customerIds = specificCustomers.map(c => c.phone)
        targetDescription = `${specificCustomers.length} specific customers`
        
        // Check for invalid phone numbers
        const foundPhones = specificCustomers.map(c => c.phone)
        const invalidPhones = specificPhones.filter(phone => !foundPhones.includes(phone))
        if (invalidPhones.length > 0) {
          console.warn('Invalid phone numbers:', invalidPhones)
        }
        break

      case 'recent_orders':
        const cutoffDate = new Date(Date.now() - (daysBack || 30) * 24 * 60 * 60 * 1000)
        const recentCustomers = await prisma.customer.findMany({
          where: {
            orders: {
              some: {
                createdAt: { gte: cutoffDate }
              }
            }
          },
          select: { phone: true }
        })
        customerIds = recentCustomers.map(c => c.phone)
        targetDescription = `${customerIds.length} customers with orders in last ${daysBack || 30} days`
        break

      default:
        return { success: false, error: 'Invalid target type' }
    }

    // Send the notification
    const result = await sendBulkNotification(payload, customerIds)

    // Log the notification send for audit
    console.log(`Admin notification sent: "${title}" to ${targetDescription}. Success: ${result.success}, Sent: ${result.sent}/${result.total}`)

    return {
      success: true,
      result: {
        sent: result.sent || 0,
        total: result.total || 0,
        targetDescription,
        title,
        message
      }
    }
  } catch (error) {
    console.error('Error sending admin notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send notification' }
  }
}

// Send test notification to admin (for testing purposes)
export async function sendTestNotification(adminPhone: string, notificationData: AdminNotificationData) {
  try {
    const payload = {
      title: `[TEST] ${notificationData.title}`,
      body: notificationData.message,
      icon: notificationData.icon || '/icons/admin-notification.png',
      badge: '/icons/notification-badge.png',
      data: {
        type: 'test_notification',
        url: notificationData.actionUrl,
        timestamp: Date.now()
      }
    }

    const result = await sendNotificationToCustomerByPhone(adminPhone, payload)

    return {
      success: result.success,
      sent: result.sent || 0,
      error: result.errors?.[0] || (result.success ? undefined : 'Failed to send notification')
    }
  } catch (error) {
    console.error('Error sending test notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send test notification' }
  }
}

export async function getNotificationHistory(limit: number = 50) {
  try {
    return {
      success: true,
      history: []
    }
  } catch (error) {
    console.error('Error fetching notification history:', error)
    return { success: false, error: 'Failed to fetch notification history' }
  }
}