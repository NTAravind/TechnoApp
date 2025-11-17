import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";
import { GetProductPrice } from "@/lib/productActions";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { v4 as uuidv4 } from 'uuid';
// Helper function to calculate order totals consistently
function calculateOrderTotals(cartitems: any[], products: any[], isDistributor: boolean, delivery: boolean) {
  // Calculate subtotal
  const subtotal = cartitems.reduce((total: number, orderItem: any) => {
    const product = products.find((p: any) => p.id === orderItem.productId);
    if (!product) throw new Error(`Product not found: ${orderItem.productId}`);
    if (!Number.isInteger(orderItem.qty) || orderItem.qty <= 0) {
      throw new Error(`Invalid quantity for product: ${orderItem.productId}`);
    }
    return total + product.price * orderItem.qty;
  }, 0);

  // Apply distributor discount (10% off subtotal)
  const distributorDiscount = isDistributor ? subtotal * 0.1 : 0;
  const subtotalAfterDiscount = subtotal - distributorDiscount;

  // Calculate delivery charge (8% of original subtotal before discount)
  const deliveryCharge = delivery ? subtotal * 0.08 : 0;

  // Calculate platform/service fee (4% on subtotal after discount)
  const platformFee = delivery ? subtotalAfterDiscount * 0.04 : 0;

  // Calculate total amount
  const totalAmount = subtotalAfterDiscount + deliveryCharge + platformFee;

  return {
    subtotal,
    distributorDiscount,
    subtotalAfterDiscount,
    deliveryCharge,
    platformFee,
    totalAmount
  };
}

export async function POST(req: NextRequest) {
  const aut = await auth();
  if (!aut?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { phoneno, cartitems, pincode, delivery, customerId, razorpay_payment_id, razorpay_order_id, razorpay_signature, pricepaid, address } = body;

    const isOrderCompletion = razorpay_payment_id && razorpay_order_id && razorpay_signature;

    if (!isOrderCompletion) {
      // ORDER CREATION PHASE
      if (!phoneno || !cartitems || !Array.isArray(cartitems) || cartitems.length === 0 || !customerId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      if (delivery && !pincode) {
        return NextResponse.json({ error: "Pincode required for delivery" }, { status: 400 });
      }

      // Get customer information to check if they're a distributor
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { isDistributor: true, name: true, phone: true, Address: true }
      });

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      const productIds = cartitems.map((item: any) => item.productId);
      const products = await GetProductPrice(productIds);

      // Calculate totals using helper function
      const totals = calculateOrderTotals(cartitems, products, customer.isDistributor, delivery);

      if (totals.totalAmount > 50000) {
        return NextResponse.json({ error: "Please prefer bulk order" }, { status: 501 });
      }

      if (totals.totalAmount <= 0) {
        return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });
      }

      // Handle pickup orders (delivery = false)
      if (!delivery) {
  
        const pickupOrderId =`pickup_${uuidv4()}`;
        
        // Create order directly in database for pickup
        const dbOrder = await prisma.order.create({
          data: {
            customerId: customerId,
            paid: true, // Pickup orders are marked as paid since no payment gateway is used
            paymentid: pickupOrderId, // Use our generated ID as payment reference
            delivered: false, // Will be marked true when picked up
            complete: false, // Order is complete from processing standpoint for pickup
            total: totals.totalAmount,
            items: {
              create: cartitems.map((cartItem: any) => {
                const product = products.find((p: any) => p.id === cartItem.productId);
                return {
                  productId: cartItem.productId,
                  quantity: cartItem.qty,
                  price: product?.price || 0,
                };
              }),
            },
          },
          include: { 
            items: { 
              include: { product: true } 
            },
            customer: true
          },
        });

        console.log("✅ Pickup order created:", dbOrder.id);
        console.log(`✅ Pickup order totals:`, totals);

        return NextResponse.json({
          success: true,
          orderId: pickupOrderId,
          dbOrderId: dbOrder.id,
          amount: totals.totalAmount,
          isPickup: true,
          breakdown: totals,
          order: dbOrder
        }, { status: 200 });
      }

      // Handle delivery orders - create Razorpay order
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return NextResponse.json({ error: "Payment service configuration error" }, { status: 500 });
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID.trim(),
        key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
      });

      const orderOptions = {
        amount: Math.round(totals.totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${phoneno}_${Date.now()}`,
        notes: { 
          phone: phoneno, 
          delivery_mode: "delivery", 
          pincode: pincode || "N/A", 
          date: Date.now(),
          customer_type: customer.isDistributor ? "distributor" : "regular",
          discount_applied: customer.isDistributor ? "10%" : "none",
          address: address || customer.Address,
          total_breakdown: JSON.stringify(totals)
        },
      };

      const razorpayOrder = await razorpay.orders.create(orderOptions);
      console.log("✅ Razorpay order created:", razorpayOrder.id);

      // Create order in database with new schema
      const dbOrder = await prisma.order.create({
        data: {
          id: razorpayOrder.id,
          customerId: customerId,
          paid: false,
          paymentid: razorpayOrder.id, // Will be updated with payment ID upon completion
          delivered: delivery, // true for delivery, false for pickup
          complete: false,
          total: totals.totalAmount,
          items: {
            create: cartitems.map((cartItem: any) => {
              const product = products.find((p: any) => p.id === cartItem.productId);
              return {
                productId: cartItem.productId,
                quantity: cartItem.qty,
                price: product?.price || 0,
              };
            }),
          },
        },
        include: { 
          items: { 
            include: { product: true } 
          },
          customer: true
        },
      });

      console.log("✅ Unpaid delivery order created:", dbOrder.id);
      console.log(`✅ Delivery order totals:`, totals);

      return NextResponse.json({
        success: true,
        orderId: razorpayOrder.id,
        dbOrderId: dbOrder.id,
        amount: totals.totalAmount,
        isPickup: false,
        breakdown: totals,
      }, { status: 200 });

    } else {
      // ORDER COMPLETION PHASE (Only for delivery orders with Razorpay)
      if (!customerId || !cartitems || !Array.isArray(cartitems) || cartitems.length === 0 || !pricepaid) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }

      if (!process.env.RAZORPAY_KEY_SECRET) {
        return NextResponse.json({ success: false, error: "Payment service configuration error" }, { status: 500 });
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!.trim(),
        key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
      });

      // Verify Razorpay signature
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        console.error(`❌ Signature verification failed for order: ${razorpay_order_id}`);
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
      }

      // Fetch Razorpay order and payment details
      const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
      const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

      if (razorpayOrder.status !== "paid" || razorpayPayment.status !== "captured") {
        return NextResponse.json({ success: false, error: "Payment not confirmed" }, { status: 400 });
      }

      // Find the order using the razorpay_order_id as the order ID
      const existingOrder = await prisma.order.findUnique({
        where: { 
          id: razorpay_order_id
        },
        include: { 
          items: { 
            include: { product: true } 
          },
          customer: true
        },
      });

      if (!existingOrder) {
        console.error(`❌ Order not found: ${razorpay_order_id}`);
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }

      if (existingOrder.paid) {
        console.log(`✅ Order ${existingOrder.id} already paid`);
        return NextResponse.json({ success: true, order: existingOrder, message: "Order already completed" }, { status: 200 });
      }

      // Get customer information for price recalculation
      const customer = await prisma.customer.findUnique({
        where: { id: existingOrder.customerId },
        select: { isDistributor: true }
      });

      if (!customer) {
        return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
      }

      // Server-side price verification
      const productIds = cartitems.map((item: any) => item.productId);
      const serverProducts = await GetProductPrice(productIds);

      // Calculate server-side totals using the same helper function
      const serverTotals = calculateOrderTotals(cartitems, serverProducts, customer.isDistributor, delivery);

      // Verify the Razorpay order amount matches our calculation
      if (razorpayOrder.amount !== Math.round(serverTotals.totalAmount * 100)) {
        console.error(`❌ Razorpay amount mismatch for order ${razorpay_order_id}`);
        console.error(`Expected: ${Math.round(serverTotals.totalAmount * 100)}, Razorpay: ${razorpayOrder.amount}`);
        return NextResponse.json({ success: false, error: "Payment amount verification failed" }, { status: 400 });
      }

      // Verify the paid amount matches our calculation (with small tolerance for floating point)
      if (Math.abs(pricepaid - serverTotals.totalAmount) > 0.01) {
        console.error(`❌ Price tampering detected for order ${existingOrder.id}`);
        console.error(`Expected: ${serverTotals.totalAmount}, Received: ${pricepaid}`);
        console.error(`Server calculation:`, serverTotals);
        return NextResponse.json({ success: false, error: "Price verification failed" }, { status: 400 });
      }

      // Update order to mark as paid and complete
      const completedOrder = await prisma.order.update({
        where: { id: existingOrder.id },
        data: { 
          paymentid: razorpay_payment_id, 
          paid: true, 
          complete: false 
        },
        include: { 
          items: { 
            include: { product: true } 
          },
          customer: true
        },
      });

      console.log(`✅ Order completed: ${existingOrder.id}`);
      console.log(`✅ Final calculation:`, serverTotals);

      return NextResponse.json({
        success: true,
        order: completedOrder,
        message: "Order completed successfully",
        breakdown: serverTotals
      }, { status: 200 });
    }
  } catch (err: any) {
    console.error("❌ Order error:", err);
    
    // Handle specific database errors
    if (err.code === "P2002") {
      return NextResponse.json({ success: false, error: "Order or payment already exists" }, { status: 409 });
    }
    
    // Handle Razorpay API errors
    if (err.statusCode && err.error) {
      console.error("❌ Razorpay error:", err.error);
      return NextResponse.json({ success: false, error: `Payment service error: ${err.error.description || err.error}` }, { status: 500 });
    }
    
    return NextResponse.json({ success: false, error: "Order processing failed" }, { status: 500 });
  }
}