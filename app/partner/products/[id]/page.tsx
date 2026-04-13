// app/partner/products/[id]/page.tsx
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { PartnerProductForm } from '../../components/product-form'
import { getPartnerProductById, updatePartnerProduct } from '../../actions/products'

interface EditProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await auth()
  
  if (!session || session.user?.role !== 'partner') {
    redirect('/partner/login')
  }

  const resolvedParams = await params
  const productId = parseInt(resolvedParams.id)

  if (isNaN(productId)) {
    notFound()
  }

  const result = await getPartnerProductById(productId, session.user.id)

  if (!result.success || !result.data) {
    notFound()
  }

  // Bind the partner ID and product ID to the update action
  const boundUpdateAction = updatePartnerProduct.bind(null, productId, session.user.id)

  return (
    <PartnerProductForm 
      product={result.data}
      categories={result.categories || []}
      addAction={async () => ({ message: 'Invalid action' })}
      updateAction={boundUpdateAction}
    />
  )
}