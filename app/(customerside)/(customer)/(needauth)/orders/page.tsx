import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { OrderCard } from "../../components/order"; // Use the new minimal OrderCard
import Link from 'next/link';
import NotificationSubscriptionPrompt from "../../components/PushNotification";
import { Package2 } from 'lucide-react';

export default async function Orders() {
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
        <div className="max-w-lg mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
              <p className="text-gray-600 mt-1">Hi {customer.name}</p>
            </div>
            <Link
              href="/refund"
              className="bg-[#16a34a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Request Refund
            </Link>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-lg mx-auto px-6 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500">Your orders will appear here once you make a purchase.</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-6">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </p>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
        
     
      </div>
    </div>
  );
}