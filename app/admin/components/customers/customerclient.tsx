'use client'

import React, { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Plus, User, Phone, Mail, Calendar, Package, Shield, Edit, Trash2, Loader2 } from 'lucide-react'
import { createCustomer, toggleDistributorStatus, findCustomerByPhone, deleteCustomer } from '../../actions/customer'

type Customer = {
  id: number
  name: string
  phone: string
  email: string | null
  isDistributor: boolean
  createdAt: Date
  updatedAt: Date // Add updatedAt
  Address: string // Add Address
  pincode: string // Add pincode
  orders: { id: string }[] // Change id to string
}

interface CustomersClientProps {
  initialCustomers: Customer[]
}

export default function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [adminPhoneSearch, setAdminPhoneSearch] = useState('')
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Show alert with auto-dismiss
  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  // Handle create customer
  const handleCreateCustomer = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createCustomer(formData)
      if (result.success && result.data) {
        setCustomers(prev => [result.data, ...prev])
        setIsCreateDialogOpen(false)
        showAlert('success', 'Customer created successfully')
      } else {
        showAlert('error', result.error || 'Failed to create customer')
      }
    })
  }

  // Handle toggle distributor status
  const handleToggleDistributor = async (customerId: number) => {
    startTransition(async () => {
      const result = await toggleDistributorStatus(customerId)
      if (result.success && result.data) {
        setCustomers(prev => prev.map(c => c.id === customerId ? result.data : c))
        showAlert('success', 'Customer status updated successfully')
      } else {
        showAlert('error', result.error || 'Failed to update customer status')
      }
    })
  }

  // Handle phone search for admin actions
  const handlePhoneSearch = async () => {
    if (!adminPhoneSearch.trim()) return

    startTransition(async () => {
      const result = await findCustomerByPhone(adminPhoneSearch.trim())
      if (result.success && result.data) {
        const toggleResult = await toggleDistributorStatus(result.data.id)
        if (toggleResult.success && toggleResult.data) {
          setCustomers(prev => prev.map(c => c.id === result?.data?.id ? toggleResult.data : c))
          setAdminPhoneSearch('')
          showAlert('success', `${toggleResult.data.name} distributor status updated`)
        } else {
          showAlert('error', toggleResult.error || 'Failed to update status')
        }
      } else {
        showAlert('error', result.data === null ? 'Customer not found with this phone number' : result.error || 'Customer not found')
      }
    })
  }

  // Handle delete customer
  const handleDeleteCustomer = async (customerId: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    startTransition(async () => {
      const result = await deleteCustomer(customerId)
      if (result.success) {
        setCustomers(prev => prev.filter(c => c.id !== customerId))
        showAlert('success', 'Customer deleted successfully')
      } else {
        showAlert('error', result.error || 'Failed to delete customer')
      }
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Customer Management</h1>
        <p className="text-gray-600">Manage your customers, create new accounts, and assign distributor privileges</p>
      </div>

      {/* Alert */}
      {alert && (
        <Alert className={`mb-6 ${alert.type === 'error' ? 'border-red-500 text-red-700' : 'border-green-500 text-green-700'}`}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search customers by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form action={handleCreateCustomer}>
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
                <DialogDescription>
                  Add a new customer to your database
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Customer name"
                    required
                    disabled={isPending}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1234567890"
                    required
                    disabled={isPending}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="customer@example.com"
                    disabled={isPending}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="distributor"
                    name="isDistributor"
                    value="true"
                    disabled={isPending}
                  />
                  <Label htmlFor="distributor">Mark as Distributor</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Customer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Admin Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Actions
          </CardTitle>
          <CardDescription>
            Quickly toggle distributor status using phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter phone number to toggle distributor status..."
              value={adminPhoneSearch}
              onChange={(e) => setAdminPhoneSearch(e.target.value)}
              className="flex-1"
              disabled={isPending}
            />
            <Button 
              onClick={handlePhoneSearch} 
              disabled={!adminPhoneSearch.trim() || isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Toggle Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter(c => c.isDistributor).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regular Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter(c => !c.isDistributor).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
          <CardDescription>
            Manage your customer database and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        <Badge variant={customer.isDistributor ? "default" : "secondary"} className="text-xs">
                          {customer.isDistributor ? "Distributor" : "Customer"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 lg:flex-shrink-0">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{customer.orders.length}</span>
                      <span className="text-gray-500">orders</span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      ID: {customer.id}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleDistributor(customer.id)}
                        className="whitespace-nowrap"
                        disabled={isPending}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {customer.isDistributor ? "Remove Distributor" : "Make Distributor"}
                      </Button>
                      
                      {customer.orders.length === 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No customers found" : "No customers yet"}
              </h3>
              <p className="text-sm">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Get started by adding your first customer"
                }
              </p>
              {!searchTerm && (
                <Button 
                  className="mt-4" 
                  onClick={() => setIsCreateDialogOpen(true)}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Customer
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}