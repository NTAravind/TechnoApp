import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import ClientProfileForm from '../../(customer)/components/customerform'

export default async function ProfileSetupPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }
  
  const phone = session.user.name;

  // Check if customer already exists and has complete profile
  // Don't use caching here to avoid stale data issues
  const customer = await prisma.customer.findUnique({
    where: { phone },
    select: { 
      id: true, 
      name: true,
      phone: true,
      email: true,
      Address: true,
      pincode: true
    }
  })

  // Only redirect if customer exists AND has a non-empty name
  if (customer?.name && customer.name.trim() !== '') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <ClientProfileForm 
            customer={customer || undefined}
            mode={customer ? "edit" : "create"} 
          />
        </Suspense>
      </div>
    </div>
  )
}