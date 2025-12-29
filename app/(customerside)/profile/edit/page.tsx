import { redirect } from 'next/navigation'


import { prisma } from '@/lib/prisma'
import ClientProfileForm from '@/app/(customerside)/(customer)/components/customerform'
import { auth } from '@/auth'

async function getCustomerProfile(phone: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        Address: true,
        pincode: true,
      }
    })
    return customer
  } catch (error) {
    console.error('Error fetching customer profile:', error)
    return null
  }
}

export default async function ProfileEditPage() {
  // Get the current session
  const session = await auth()
  
  // Redirect if no session
  if (!session?.user?.name) {
    redirect('/login')
  }

  // Get customer data
  const customer = await getCustomerProfile(session.user.name)
  
  // If customer doesn't exist, redirect to profile creation
  if (!customer) {
    redirect('/profile/create')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <h1 className="font-semibold">Edit Profile</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <ClientProfileForm 
        customer={customer}
        mode="edit"
      />
    </div>
  )
}