import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import OrderCard from "../../components/order";
import Link from 'next/link';

export default async function Orders() {
  const session = await auth();
  const phone = session?.user?.name as string;
  
  if (!phone) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 text-lg">Please log in to view your orders</p>
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 text-lg">Customer not found</p>
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
              category: true, // Include category information
            },
          },
        },
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Updated header to include the refund button */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Orders
          </h1>
          <p className="text-gray-600">Welcome back, {customer.name}</p>
        </div>
        {/* ADDED: Link component styled as a button for refunds */}
        <Link
          href="/refund"
          className="inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ease-in-out duration-150"
        >
          Request a Refund
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600">When you place your first order, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-500 mb-4">
            Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
          </div>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}