import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { v4 as uuidv4 } from 'uuid';
import { calculateDeliveryCharge } from "@/lib/deliveryCharge";

async function calculateOrderTotals(cartitems: any[], products: any[], isDistributor: boolean, pincode?: string) {
  const subtotal = cartitems.reduce((total: number, orderItem: any) => {
    const product = products.find((p: any) => p.id === orderItem.productId);
    if (!product) throw new Error(`Product not found: ${orderItem.productId}`);
    return total + product.price * orderItem.qty;
  }, 0);

  const distributorDiscount = isDistributor ? subtotal * 0.1 : 0;
  const subtotalAfterDiscount = subtotal - distributorDiscount;
  
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
  }
  
  const platformFee = subtotalAfterDiscount * 0.04;
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
  try {
    const body = await req.json();
    const { 
      phone, 
      cartitems, 
      pincode, 
      address,
      paymentMethod,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = body;

    const isOrderCompletion = razorpay_payment_id && razorpay_order_id && razorpay_signature;

    if (!isOrderCompletion) {
      // ORDER CREATION PHASE
      if (!phone || !cartitems || !Array.isArray(cartitems) || cartitems.length === 0) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      // Get or create customer
      let customer = await prisma.customer.findUnique({
        where: { phone },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: { 
            name: phone, 
            phone,
            Address: address || null,
            pincode: pincode || null,
          },
        });
      } else {
        // Update address and pincode if provided
        if (address || pincode) {
          customer = await prisma.customer.update({
            where: { phone },
            data: {
              Address: address || customer.Address,
              pincode: pincode || customer.pincode,
            },
          });
        }
      }

      // Get products
      const productIds = cartitems.map((item: any) => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true }
      });

      // Calculate totals
      const totals = await calculateOrderTotals(cartitems, products, customer.isDistributor, pincode);

      if (totals.totalAmount > 50000) {
        return NextResponse.json({ error: "Please use bulk order" }, { status: 400 });
      }

      // Handle COD
      if (paymentMethod === 'cod') {
        const codOrderId = `cod_${uuidv4()}`;
        
        const dbOrder = await prisma.order.create({
          data: {
            customerId: customer.id,
            paid: false,
            paymentid: codOrderId,
            delivered: true,
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
            items: { include: { product: true } },
            customer: true
          },
        });

        return NextResponse.json({
          success: true,
          orderId: codOrderId,
          dbOrderId: dbOrder.id,
          amount: totals.totalAmount,
          isCOD: true,
          breakdown: totals,
          customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            address: customer.Address,
            pincode: customer.pincode,
          },
        }, { status: 200 });
      }

      // Handle online payment - create Razorpay order
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return NextResponse.json({ error: "Payment service not configured" }, { status: 500 });
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID.trim(),
        key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
      });

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totals.totalAmount * 100),
        currency: "INR",
        receipt: `mobile_${phone}_${Date.now()}`,
        notes: { phone, pincode: pincode || "N/A" },
      });

      // Create DB order
      const dbOrder = await prisma.order.create({
        data: {
          id: razorpayOrder.id,
          customerId: customer.id,
          paid: false,
          paymentid: razorpayOrder.id,
          delivered: true,
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
      });

      return NextResponse.json({
        success: true,
        orderId: razorpayOrder.id,
        dbOrderId: dbOrder.id,
        amount: totals.totalAmount,
        isCOD: false,
        breakdown: totals,
      }, { status: 200 });
    }

    // ORDER COMPLETION PHASE
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: "Payment service error" }, { status: 500 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // Find order
    const existingOrder = await prisma.order.findUnique({
      where: { id: razorpay_order_id },
      include: { customer: true }
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (existingOrder.paid) {
      return NextResponse.json({ success: true, order: existingOrder }, { status: 200 });
    }

    // Update order to paid
    const completedOrder = await prisma.order.update({
      where: { id: existingOrder.id },
      data: { 
        paymentid: razorpay_payment_id, 
        paid: true, 
      },
      include: { 
        items: { include: { product: true } },
        customer: true
      },
    });

    return NextResponse.json({
      success: true,
      order: completedOrder,
      message: "Order completed",
    }, { status: 200 });

  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ success: false, error: err.message || "Checkout failed" }, { status: 500 });
  }
}
