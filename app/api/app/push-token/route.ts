import { NextResponse } from 'next/server'
import { subscribeUserToPushNotifications, unsubscribeUserFromPushNotifications } from '@/lib/notifications'

export async function POST(req: Request) {
  try {
    const { token, customerId } = await req.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const result = await subscribeUserToPushNotifications(token, customerId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'error' in result ? result.error : 'Unknown error' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving push token:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const result = await unsubscribeUserFromPushNotifications(token)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error removing push token:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
