'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          select: {
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: customers }
  } catch (error) {
    console.error('Error fetching customers:', error)
    return { success: false, error: 'Failed to fetch customers' }
  }
}

export async function createCustomer(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const isDistributor = formData.get('isDistributor') === 'true'

    if (!name || !phone) {
      return { success: false, error: 'Name and phone are required' }
    }

    // Check if phone already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone }
    })

    if (existingCustomer) {
      return { success: false, error: 'Customer with this phone number already exists' }
    }

    // Check if email exists (if provided)
    if (email) {
      const existingEmail = await prisma.customer.findUnique({
        where: { email }
      })

      if (existingEmail) {
        return { success: false, error: 'Customer with this email already exists' }
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        isDistributor
      },
      include: {
        orders: {
          select: {
            id: true
          }
        }
      }
    })

    revalidatePath('/customers')
    return { success: true, data: customer }
  } catch (error) {
    console.error('Error creating customer:', error)
    return { success: false, error: 'Failed to create customer' }
  }
}

export async function toggleDistributorStatus(customerId: number) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: { isDistributor: !customer.isDistributor },
      include: {
        orders: {
          select: {
            id: true
          }
        }
      }
    })

    revalidatePath('/customers')
    return { success: true, data: updatedCustomer }
  } catch (error) {
    console.error('Error toggling distributor status:', error)
    return { success: false, error: 'Failed to update customer status' }
  }
}

export async function findCustomerByPhone(phone: string) {
  try {
    if (!phone) {
      return { success: false, error: 'Phone number is required' }
    }

    const customer = await prisma.customer.findUnique({
      where: { phone },
      include: {
        orders: {
          select: {
            id: true
          }
        }
      }
    })

    return { success: true, data: customer }
  } catch (error) {
    console.error('Error finding customer by phone:', error)
    return { success: false, error: 'Failed to find customer' }
  }
}

export async function deleteCustomer(customerId: number) {
  try {
    // First check if customer has orders
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: true
      }
    })

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    if (customer.orders.length > 0) {
      return { success: false, error: 'Cannot delete customer with existing orders' }
    }

    await prisma.customer.delete({
      where: { id: customerId }
    })

    revalidatePath('/customers')
    return { success: true, message: 'Customer deleted successfully' }
  } catch (error) {
    console.error('Error deleting customer:', error)
    return { success: false, error: 'Failed to delete customer' }
  }
}