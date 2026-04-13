// app/partner/products/new/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PartnerProductForm } from '../../components/product-form'
import { addPartnerProduct } from '../../actions/products'

export default async function NewProductPage() {
  const session = await auth()
  
  if (!session || session.user?.role !== 'partner') {
    redirect('/partner/login')
  }

  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  // Bind the partner ID to the add action
  const boundAddAction = addPartnerProduct.bind(null, session.user.id)

  return (
    <PartnerProductForm 
      categories={categories}
      addAction={boundAddAction}
    />
  )
}