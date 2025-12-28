import { getAllPartners, getPartnerRevenue } from '@/app/admin/actions/partner'
import PartnerClient from '../components/partners/partnerclient'
export default async function PartnersPage() {
  // Fetch data in parallel
  const [partners, revenue] = await Promise.all([
    getAllPartners(),
    getPartnerRevenue(),
  ])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Partner Management</h1>
        <p className="text-muted-foreground">
          Create and manage partners, view revenue statistics
        </p>
      </div>
      <PartnerClient partners={partners} revenue={revenue} />
    </div>
  )
}