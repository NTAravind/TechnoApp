'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCustomer } from '@/lib/customer-actions'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AlertCircle, Loader2, Trash2, ArrowLeft, ShieldAlert, Info } from 'lucide-react'
import Link from 'next/link'

interface DeleteProfileFormProps {
  customer: {
    id: number
    name: string
    phone: string
    email: string | null
  }
}

export default function DeleteProfileForm({ customer }: DeleteProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await deleteCustomer(customer.id)
        if (result.success) {
          router.push('/')
          router.refresh()
        } else {
          setError(result.error || 'Failed to delete profile')
        }
      } catch (err) {
        setError('An unexpected error occurred')
      }
    })
  }

  return (
    <div className="px-6 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full px-4 -ml-2"
      >
        <Link href="/profile">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Link>
      </Button>

      {/* Main Content Card */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-red-50 p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Delete Account</h2>
            <p className="text-sm text-red-700/80 mt-1">
              This action is permanent and cannot be reversed.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Account Details Widget */}
          <div className="bg-[#FAFAFA] rounded-2xl p-4 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Account to be deleted</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="text-sm font-semibold text-gray-800">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-semibold text-gray-800">{customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Info List */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="h-3 w-3 text-emerald-600" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                All your <span className="font-bold text-gray-800">order history</span> and address information will be wiped.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="h-3 w-3 text-emerald-600" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                You will be immediately logged out of all devices.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-red-200"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2rem] border-0 max-w-[90vw] sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold">Are you 100% sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-500">
                  This will permanently remove the account for <span className="font-bold text-gray-900">{customer.name}</span>. 
                  We cannot recover your data once it's gone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 gap-3">
                <AlertDialogCancel className="rounded-xl border-gray-200 h-11">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  className="bg-red-600 text-white hover:bg-red-700 rounded-xl h-11 border-0"
                >
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button
            variant="ghost"
            asChild
            className="w-full h-12 rounded-2xl text-gray-500 font-medium"
            disabled={isPending}
          >
            <Link href="/profile">Keep my account</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}