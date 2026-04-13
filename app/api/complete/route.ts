// app/api/orders/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { id, phone } = await request.json()
    console.log('Received request to complete order:', { id, phone })
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Update order in database
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { complete: true }
    })

    // Send WhatsApp notification - FIXED: using phone parameter instead of userId
    const whatsappResult = await SendWhatsappmsg(phone, updatedOrder.id.toString())
    
    if (!whatsappResult.success) {
      console.error('WhatsApp notification failed:', whatsappResult.error)
      // Still return success for order update, but include warning
      return NextResponse.json({
        ...updatedOrder,
        warning: 'Order completed but notification failed to send'
      })
    }

    return NextResponse.json({
      ...updatedOrder,
      notificationSent: true
    })

  } catch (error: any) {
    console.error('Error updating order:', error)
    
    // Check if it's a Prisma error (order not found, etc.)
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to update order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

async function SendWhatsappmsg(phone: string, orderid: string): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Validate required environment variables
    if (!process.env.WHATSAPPPHONE) {
      throw new Error('WHATSAPPPHONE environment variable is not set')
    }
    
    if (!process.env.WHATSAPPENV) {
      throw new Error('WHATSAPPENV environment variable is not set')
    }

    // Validate and clean phone number
    if (!phone || phone.trim() === '') {
      throw new Error('Phone number is required')
    }

    // Clean phone number - remove any non-digits
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Validate Indian phone number (should be 10 digits after cleaning)
    if (cleanPhone.length !== 10) {
      throw new Error(`Invalid phone number format: ${phone}. Expected 10 digits, got ${cleanPhone.length}`)
    }

    console.log('Sending WhatsApp message to phone:', cleanPhone)

    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPPPHONE}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPPENV}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `+91${cleanPhone}`, // Use cleaned phone number
          type: 'template',
          template: {
            name: 'trackingorder',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: orderid }],
              },
            ],
          },
        }),
      }
    )

    // Check if the HTTP request was successful
    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text()
      console.error('WhatsApp API Error:', {
        status: whatsappResponse.status,
        statusText: whatsappResponse.statusText,
        body: errorData,
        phone: cleanPhone
      })
      
      return {
        success: false,
        error: `WhatsApp API returned ${whatsappResponse.status}: ${whatsappResponse.statusText}`
      }
    }

    // Parse and validate response
    const responseData = await whatsappResponse.json()
    
    if (responseData.error) {
      console.error('WhatsApp API Error Response:', responseData.error)
      return {
        success: false,
        error: responseData.error.message || 'WhatsApp API error'
      }
    }

    console.log('WhatsApp message sent successfully:', {
      to: `+91${cleanPhone}`, // FIXED: Use actual recipient phone
      orderId: orderid,
      messageId: responseData.messages?.[0]?.id
    })

    return {
      success: true,
      data: responseData
    }

  } catch (error: any) {
    console.error('Error sending WhatsApp message:', {
      phone,
      orderid,
      error: error.message,
      stack: error.stack
    })

    return {
      success: false,
      error: error.message || 'Unknown error occurred while sending WhatsApp message'
    }
  }
}