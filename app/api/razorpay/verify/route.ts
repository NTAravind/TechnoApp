import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error("Invalid JSON:", error);
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    if (body.event) {
      return handleWebhook(req, body, rawBody);
    } else {
      return handlePaymentVerification(body);
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}

async function handleWebhook(req: NextRequest, body: any, rawBody: string) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const signature = req.headers.get("x-razorpay-signature") || "";
    const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    if (expectedSignature !== signature) {
      console.log("Invalid webhook signature");
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("✅ Webhook signature verified");

    if (body.event === "payment.captured") {
      const payment = body.payload.payment.entity;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      const razorpayPayment = await razorpay.payments.fetch(payment.id);
      if (razorpayPayment.status !== "captured") {
        console.error(`❌ Payment ${payment.id} not captured`);
        return new Response("Payment not confirmed", { status: 400 });
      }

      const existingOrder = await prisma.order.findUnique({
        where: { id: payment.order_id },
        include: { items: { include: { product: true } }, customer: true },
      });

      if (!existingOrder) {
        console.error(`❌ Order not found: ${payment.order_id}`);
        return new Response("Order not found", { status: 404 });
      }

      if (existingOrder.paid) {
        console.log(`✅ Order ${payment.order_id} already processed`);
        return new Response("Payment already processed", { status: 200 });
      }

      await prisma.order.update({
        where: { id: payment.order_id },
        data: { paid: true, paymentid: payment.id},
      });

      console.log(`✅ Order completed: ${payment.order_id}`);
      return new Response("Payment processed successfully", { status: 200 });
    }

    if (body.event === "payment.failed") {
      const payment = body.payload.payment.entity;
      console.log("❌ Payment failed:", payment.id);

      try {
        const existingOrder = await prisma.order.findUnique({
          where: { id: payment.order_id },
          select: { id: true, paid: true },
        });

        if (existingOrder && !existingOrder.paid) {
          await prisma.order.update({
            where: { id: payment.order_id },
            data: { paid: false },
          });
          console.log(`✅ Marked order ${payment.order_id} as failed`);
        }
      } catch (error) {
        console.error("❌ Error handling failed payment:", error);
      }

      return new Response("Payment failure processed", { status: 200 });
    }

    console.log(`ℹ️ Unhandled webhook event: ${body.event}`);
    return new Response("Event received", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}

async function handlePaymentVerification(body: any) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment details" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET not configured");
      return NextResponse.json({ success: false, error: "Configuration error" }, { status: 500 });
    }

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.log("❌ Payment signature verification failed");
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: razorpay_order_id },
      select: { id: true, paid: true, paymentid: true, complete: true, total: true },
    });

    if (!order) {
      console.log(`⚠️ Order ${razorpay_order_id} not found`);
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    console.log("✅ Payment verified:", razorpay_payment_id);

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      order,
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 });
  }
}