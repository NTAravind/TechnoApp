import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { OrderCard } from "../../components/order";
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package2 } from 'lucide-react';

export default async function RefundPage() {
  const session = await auth();
  const phone = session?.user?.name as string;

  if (!phone) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-gray-600">Please log in to view your orders</p>
          </div>
        </div>
      </div>
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { phone },
    select: { id: true, name: true },
  });

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-gray-600">Customer not found</p>
          </div>
        </div>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Request a Refund</h1>
              <p className="text-gray-600 mt-1">Hi {customer.name}, select an order to request a refund</p>
            </div>
            <Link
              href="/orders"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Important Alert */}
        <Alert className="bg-amber-50 border-amber-300 mb-6">
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <AlertDescription className="text-amber-900">
            <strong>⚠️ Important:</strong> Please read the "How It Works" and "Refund Policy" sections below before requesting a refund to understand the process and eligibility criteria.
          </AlertDescription>
        </Alert>

        {/* Orders List with Refund Buttons - MOST IMPORTANT */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Orders</h2>
          
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-4">Your orders will appear here once you make a purchase.</p>
              <Link
                href="/"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </p>
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <OrderCard order={order} />
                  <div className="px-6 pb-6">
                    <a
                      href={`https://api.whatsapp.com/send?phone=919945631341&text=${encodeURIComponent(`Hi, I would like to request a refund for Order ID: ${order.id}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.382"/>
                      </svg>
                      Request Refund for Order #{order.id}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions Card */}
        <Card className="border-2 border-green-200 bg-green-50 mb-6 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How It Works
            </CardTitle>
            <CardDescription>
              Click the "Request Refund" button on any order to message us on WhatsApp. Our team will guide you through the process.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Refund Policy Card */}
        <Card className="bg-white border-slate-200 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Refund Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-700">✅ Eligible for Refund</h4>
                <ul className="text-sm text-slate-600 space-y-1 pl-4">
                  <li>• Damaged or defective items</li>
                  <li>• Wrong item delivered</li>
                  <li>• Items not as described</li>
                  <li>• Quality issues</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-red-600">❌ Not Eligible</h4>
                <ul className="text-sm text-slate-600 space-y-1 pl-4">
                  <li>• Change of mind after use</li>
                  <li>• Items used extensively</li>
                  <li>• Custom/personalized items</li>
                  <li>• Items returned after 30 days</li>
                </ul>
              </div>
            </div>
            
            <Alert className="bg-green-50 border-green-200">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <AlertDescription className="text-green-800">
                <strong>Processing Time:</strong> Refunds are typically processed within 5-7 business days after approval.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}