'use client'

import { useActionState, useEffect, useState } from 'react'
import { createPartner, type ActionState, type PartnerRevenue } from '@/app/admin/actions/partner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DataTable } from './data-table'
import { columns, type PartnerWithRevenue } from './column'
import { Plus } from 'lucide-react'

type Partner = {
  id: string
  name: string
  username: string
}

type Props = {
  partners: Partner[]
  revenue: PartnerRevenue[]
}

// Utility function to format as Indian Rupees
function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Create partner dialog form
function CreatePartnerDialog() {
  const [open, setOpen] = useState(false)
  const initialState: ActionState = {}
  const [state, formAction, isPending] = useActionState(createPartner, initialState)

  // Close dialog on success
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        setOpen(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [state?.success])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Partner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Partner</DialogTitle>
          <DialogDescription>
            Add a new partner to the system. Click create when you're done.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Partner Name"
              required
              minLength={2}
              disabled={isPending}
            />
            {state?.errors?.name && (
              <p className="text-sm text-red-600">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="username"
              required
              minLength={3}
              disabled={isPending}
            />
            {state?.errors?.username && (
              <p className="text-sm text-red-600">{state.errors.username[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={isPending}
            />
            {state?.errors?.password && (
              <p className="text-sm text-red-600">{state.errors.password[0]}</p>
            )}
          </div>

          {state?.message && !state.success && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}

          {state?.success && (
            <p className="text-sm text-green-600">{state.message}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Creating...' : 'Create Partner'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Partner data table with revenue
function PartnerDataTable({ partners, revenue }: Props) {
  // Merge partners with revenue data
  const revenueMap = new Map(
    revenue.map((r) => [r.partnerId, r.totalRevenue])
  )

  const partnersWithRevenue: PartnerWithRevenue[] = partners.map((partner) => ({
    id: partner.id,
    name: partner.name,
    username: partner.username,
    totalRevenue: revenueMap.get(partner.id) || 0,
  }))

  // Calculate total revenue across all partners
  const totalRevenue = revenue.reduce((sum, r) => sum + r.totalRevenue, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Partners</CardTitle>
            <CardDescription>
              Manage all partners and view revenue • Total: {formatRupees(totalRevenue)}
            </CardDescription>
          </div>
          <CreatePartnerDialog />
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={partnersWithRevenue} />
      </CardContent>
    </Card>
  )
}

// Main client component
export default function PartnerClient({ partners, revenue }: Props) {
  return (
    <div className="space-y-6">
      <PartnerDataTable partners={partners} revenue={revenue} />
    </div>
  )
}