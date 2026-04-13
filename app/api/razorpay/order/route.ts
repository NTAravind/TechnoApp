import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";
import { GetProductPrice } from "@/lib/productActions";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { v4 as uuidv4 } from 'uuid';
import { calculateDeliveryCharge } from "@/lib/deliveryCharge";

// Helper function to calculate order totals consistently
async function calculateOrderTotals(cartitems: any[], products: any[], isDistributor: boolean, pincode?: string) {
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

  // Calculate delivery charge based on pincode settings
  let deliveryCharge = 0;
  let deliveryInfo: any = {};
  
  if (pincode) {
    try {
      const deliveryResult = await calculateDeliveryCharge(pincode, subtotal);
      deliveryCharge = deliveryResult.deliveryCharge;
      deliveryInfo = {
        isFreeDelivery: deliveryResult.isFreeDelivery,
        chargeType: deliveryResult.chargeType,
        minCharge: deliveryResult.minCharge,
        percentageCharge: deliveryResult.percentageCharge,
        freeDeliveryAbove: deliveryResult.freeDeliveryAbove,
        district: deliveryResult.pincodeInfo?.district,
        state: deliveryResult.pincodeInfo?.state,
      };
    } catch (error) {
      throw new Error("Delivery not available for this pincode");
    }
  } else {
    deliveryCharge = subtotal * 0.08;
  }

  // Calculate platform/service fee (4% on subtotal after discount)
  // Both COD and Online Payment have platform fees
  const platformFee = subtotalAfterDiscount * 0.04;

  // Calculate total amount
  const totalAmount = subtotalAfterDiscount + deliveryCharge + platformFee;

  return {
    subtotal,
    distributorDiscount,
    subtotalAfterDiscount,
    deliveryCharge,
    platformFee,
    totalAmount,
    deliveryInfo
  };
}

export async function POST(req: NextRequest) {
  const aut = await auth();
  if (!aut?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { phoneno, cartitems, pincode, paymentMethod, customerId, razorpay_payment_id, razorpay_order_id, razorpay_signature, pricepaid, address } = body;

    const isOrderCompletion = razorpay_payment_id && razorpay_order_id && razorpay_signature;

    if (!isOrderCompletion) {
      // ORDER CREATION PHASE
      if (!phoneno || !cartitems || !Array.isArray(cartitems) || cartitems.length === 0 || !customerId || !paymentMethod) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      if (!pincode) {
        return NextResponse.json({ error: "Pincode required for delivery" }, { status: 400 });
      }

      // Validate payment method
      if (!['online', 'cod'].includes(paymentMethod)) {
        return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
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

      // Calculate totals using helper function (same for both COD and online)
      const totals = await calculateOrderTotals(cartitems, products, customer.isDistributor, pincode);

      if (totals.totalAmount > 50000) {
        return NextResponse.json({ error: "Please prefer bulk order" }, { status: 501 });
      }

      if (totals.totalAmount <= 0) {
        return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });
      }

      // Handle COD orders (paymentMethod = 'cod')
      if (paymentMethod === 'cod') {
        const codOrderId = `cod_${uuidv4()}`;
        
        // Create order directly in database for COD
        const dbOrder = await prisma.order.create({
          data: {
            customerId: customerId,
            paid: false, // COD orders are marked as unpaid until delivery
            paymentid: codOrderId,
            delivered: true, // Set to true to indicate it's a delivery order (vs pickup)
            complete: false, // Will be marked true when delivered and payment collected
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

        console.log("✅ COD order created:", dbOrder.id);
        console.log(`✅ COD order totals:`, totals);

        return NextResponse.json({
          success: true,
          orderId: codOrderId,
          dbOrderId: dbOrder.id,
          amount: totals.totalAmount,
          isCOD: true,
          paymentMethod: 'cod',
          breakdown: totals,
          order: dbOrder
        }, { status: 200 });
      }

      // Handle online payment orders
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
          payment_mode: "online", 
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
          paymentid: razorpayOrder.id,
          delivered: true, // true for delivery orders
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

      console.log("✅ Unpaid online order created:", dbOrder.id);
      console.log(`✅ Online order totals:`, totals);

      return NextResponse.json({
        success: true,
        orderId: razorpayOrder.id,
        dbOrderId: dbOrder.id,
        amount: totals.totalAmount,
        isCOD: false,
        paymentMethod: 'online',
        breakdown: totals,
      }, { status: 200 });

    } else {
      // ORDER COMPLETION PHASE (Only for online payment orders with Razorpay)
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

      // Server-side price verification (use default delivery since pincode was validated at order creation)
      const productIds = cartitems.map((item: any) => item.productId);
      const serverProducts = await GetProductPrice(productIds);

      // Calculate server-side totals using the same helper function (without pincode for verification)
      const subtotal = cartitems.reduce((total: number, orderItem: any) => {
        const product = serverProducts.find((p: any) => p.id === orderItem.productId);
        if (!product) throw new Error(`Product not found: ${orderItem.productId}`);
        return total + product.price * orderItem.qty;
      }, 0);

      const distributorDiscount = customer.isDistributor ? subtotal * 0.1 : 0;
      const subtotalAfterDiscount = subtotal - distributorDiscount;
      const deliveryCharge = subtotal * 0.08; // Default 8% for verification
      const platformFee = subtotalAfterDiscount * 0.04;
      const serverTotals = {
        subtotal,
        distributorDiscount,
        subtotalAfterDiscount,
        deliveryCharge,
        platformFee,
        totalAmount: subtotalAfterDiscount + deliveryCharge + platformFee
      };

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