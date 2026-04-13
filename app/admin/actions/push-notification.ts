export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
}

export interface SendResult {
  success: boolean
  sent: number
  failed: number
  total: number
  errors?: string[]
}

import { prisma } from '@/lib/prisma'

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

async function sendExpoPushNotifications(
  tokens: string[],
  payload: NotificationPayload
): Promise<SendResult> {
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  if (tokens.length === 0) {
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data,
  }));

  try {
    const chunk_size = 100;
    for (let i = 0; i < messages.length; i += chunk_size) {
      const chunk = messages.slice(i, i + chunk_size);
      
      const response = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const responseJson = await response.json();
      console.log('--- Expo API Response ---');
      console.log(JSON.stringify(responseJson, null, 2));
      
      const tickets = Array.isArray(responseJson.data) ? responseJson.data : [responseJson.data];
      
      for (let j = 0; j < tickets.length; j++) {
         const ticket = tickets[j];
         if (ticket.status === 'ok') {
            sent++;
            console.log(`Notification sent successfully to: ${chunk[j].to}`);
         } else {
            failed++;
            console.error(`Notification FAILED for token: ${chunk[j].to}`);
            console.error(`Error details: ${JSON.stringify(ticket)}`);
            errors.push(`Token: ${chunk[j].to}, Error: ${ticket.message}`);
         }
      }
    }


    return {
      success: failed === 0,
      sent,
      failed,
      total: tokens.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Error sending Expo push notifications:', error);
    return {
      success: false,
      sent: 0,
      failed: tokens.length,
      total: tokens.length,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}


export async function sendNotificationToCustomer(
  customerId: string,
  payload: NotificationPayload
): Promise<SendResult> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId, 10) },
      include: { pushSubscriptions: true }
    });

    if (!customer) {
       return { success: false, sent: 0, failed: 0, total: 0, errors: [`Customer not found`]};
    }

    const tokens = customer.pushSubscriptions.map(s => s.token);
    return await sendExpoPushNotifications(tokens, payload);
  } catch (error) {
    console.error('Error in sendNotificationToCustomer:', error);
    return { success: false, sent: 0, failed: 0, total: 0, errors: [error instanceof Error ? error.message : 'Error'] };
  }
}

export async function sendNotificationToCustomerByPhone(
  customerPhone: string,
  payload: NotificationPayload
): Promise<SendResult> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { phone: customerPhone },
      include: { pushSubscriptions: true }
    });

    if (!customer) {
       return { success: false, sent: 0, failed: 0, total: 0, errors: [`Customer not found`]};
    }

    const tokens = customer.pushSubscriptions.map(s => s.token);
    return await sendExpoPushNotifications(tokens, payload);
  } catch (error) {
    console.error('Error in sendNotificationToCustomerByPhone:', error);
    return { success: false, sent: 0, failed: 0, total: 0, errors: [error instanceof Error ? error.message : 'Error'] };
  }
}

export async function sendOrderNotification(
  orderId: string,
  notificationType: 'created' | 'confirmed' | 'preparing' | 'ready' | 'delivered'
): Promise<SendResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true
      }
    });

    if (!order) {
       return { success: false, sent: 0, failed: 0, total: 0, errors: [`Order not found`]};
    }

    const payloads: Record<typeof notificationType, NotificationPayload> = {
      created: {
        title: 'Order Received!',
        body: `Your order #${orderId.slice(-6)} for ₹${order.total.toFixed(2)} has been received and is being processed.`,
        data: { orderId, type: 'order_created' }
      },
      confirmed: {
        title: 'Order Confirmed',
        body: `Your order #${orderId.slice(-6)} has been confirmed and will be prepared soon.`,
        data: { orderId, type: 'order_confirmed' }
      },
      preparing: {
        title: 'Order Being Prepared',
        body: `Your order #${orderId.slice(-6)} is now being prepared for delivery.`,
        data: { orderId, type: 'order_preparing' }
      },
      ready: {
        title: 'Order Ready!',
        body: `Your order #${orderId.slice(-6)} is ready for pickup/delivery.`,
        data: { orderId, type: 'order_ready' }
      },
      delivered: {
        title: 'Order Delivered!',
        body: `Your order #${orderId.slice(-6)} has been successfully delivered. Thank you!`,
        data: { orderId, type: 'order_delivered' }
      }
    };

    const payload = payloads[notificationType];
    return await sendNotificationToCustomerByPhone(order.customer.phone, payload);
  } catch (error) {
    console.error('Error sending order notification:', error);
    return { success: false, sent: 0, failed: 0, total: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
}

export async function sendBulkNotification(
  payload: NotificationPayload,
  customerIds?: string[]
): Promise<SendResult> {
  try {
    let subscriptions;

    if (customerIds && customerIds.length > 0) {
      subscriptions = await prisma.pushSubscription.findMany({
        where: {
          customerId: {
            in: customerIds
          }
        }
      });
    } else {
      subscriptions = await prisma.pushSubscription.findMany({
        where: {
          customerId: { not: null }
        }
      });
    }

    const tokens = subscriptions.map(s => s.token);
    return await sendExpoPushNotifications(tokens, payload);
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return { success: false, sent: 0, failed: 0, total: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
}
