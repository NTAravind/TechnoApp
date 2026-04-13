import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import DeleteProfileForm from '../../(customer)/components/delete-acc-section'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

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

export default async function ProfileDeletePage() {
  const session = await auth()

  if (!session?.user?.name) {
    redirect('/login')
  }

  const customer = await getCustomerProfile(session.user.name)

  if (!customer) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* Mobile-style Container */}
      <div className="w-full max-w-[450px] bg-[#FAFAFA] min-h-screen shadow-2xl shadow-gray-200/50 flex flex-col">
        
        {/* Modern Glass Header */}
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100/50 transition-all">
          <div className="flex items-center gap-4 px-6 h-16">
            <Link 
              href="/ " 
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight">
             Home
            </h1>
          </div>
        </header>

        {/* Delete Form Content */}
        <main className="flex-1 overflow-y-auto">
          <DeleteProfileForm customer={customer} />
        </main>
        
      </div>
    </div>
  )
}