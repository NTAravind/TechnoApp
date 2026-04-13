import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Await the params since they're now a Promise
  const { orderId } = await params;

  try {
    // Parse orderId as integer since your schema uses Int for id
    
  
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paid: true,
        complete: true,
        total: true, // Changed from pricepaid to total
        delivered: true,
        customerId: true, // Changed from userId to customerId
        paymentid: true,
        createdAt: true,
        updatedAt: true,
        items: { // Changed from orderItems to items
          include: { 
            product: {
              select: {
                id: true,
                name: true, // Assuming your Product model has name field
                price: true,
                sku: true
              }
            }
          }
        },
        customer: { // Include customer info for verification
          select: {
            id: true,
            phone: true
          }
        }
      },
    });

    if (!order) {
      console.error(`❌ Order ${orderId} not found`);
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Check if the order belongs to the current user
    // You'll need to match this with how your auth system stores user info
    // This assumes your session.user.id corresponds to the customer ID
    if (order.customerId.toString() !== session.user.id) {
      console.error(`❌ Unauthorized access to order ${orderId} - Customer: ${order.customerId}, User: ${session.user.id}`);
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    console.log(`✅ Order status checked: ${orderId}, Paid: ${order.paid}, Complete: ${order.complete}`);
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        paid: order.paid,
        complete: order.complete,
        total: order.total, // Changed from pricepaid
        delivered: order.delivered,
        paymentid: order.paymentid,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map(item => ({ // Changed from orderItems
          id: item.id,
          productId: item.product.id,
          productName: item.product.name, // Adjusted field name
          quantity: item.quantity,
          price: item.price,
          sku: item.product.sku
        })),
        customer: {
          id: order.customer.id,
          phone: order.customer.phone
        }
      },
    }, { status: 200 });
    
  } catch (error) {
    console.error(`❌ Error checking order ${orderId}:`, error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to check order status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}