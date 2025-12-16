// app/actions/customer-actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional(),
  pincode: z.string()
    .regex(/^[0-9]{6}$/, 'Pincode must be 6 digits')
    .optional()
    .or(z.literal('')),
  isDistributor: z.boolean().default(false),
})

export type CustomerFormData = z.infer<typeof customerSchema>

export async function createCustomer(formData: FormData) {
  try {
    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || undefined,
      address: formData.get('address') as string || undefined,
      pincode: formData.get('pincode') as string || undefined,
      isDistributor: formData.get('isDistributor') === 'on',
    }

    const validatedData = customerSchema.parse(rawData)

    // Check if phone already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: validatedData.phone }
    })

    if (existingCustomer) {
      return {
        success: false,
        error: 'A customer with this phone number already exists'
      }
    }

    // Check if email already exists (if provided)
    if (validatedData.email) {
      const existingEmailCustomer = await prisma.customer.findUnique({
        where: { email: validatedData.email }
      })

      if (existingEmailCustomer) {
        return {
          success: false,
          error: 'A customer with this email already exists'
        }
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || null,
        Address: validatedData.address || null,
        pincode: validatedData.pincode || null,
        isDistributor: validatedData.isDistributor,
      }
    })

    revalidatePath('/customers')
    
    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      }
    }

  } catch (error) {
    console.error('Error creating customer:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error || 'Validation failed'
      }
    }

    return {
      success: false,
      error: 'Failed to create customer. Please try again.'
    }
  }
}

export async function updateCustomer(id: number, formData: FormData) {
  try {
    const rawData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || undefined,
      address: formData.get('address') as string || undefined,
      pincode: formData.get('pincode') as string || undefined,
      isDistributor: formData.get('isDistributor') === 'on',
    }

    const validatedData = customerSchema.parse(rawData)

    // Check if phone already exists for other customers
    const existingCustomer = await prisma.customer.findFirst({
      where: { 
        phone: validatedData.phone,
        id: { not: id }
      }
    })

    if (existingCustomer) {
      return {
        success: false,
        error: 'A customer with this phone number already exists'
      }
    }

    // Check if email already exists for other customers (if provided)
    if (validatedData.email) {
      const existingEmailCustomer = await prisma.customer.findFirst({
        where: { 
          email: validatedData.email,
          id: { not: id }
        }
      })

      if (existingEmailCustomer) {
        return {
          success: false,
          error: 'A customer with this email already exists'
        }
      }
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || null,
        Address: validatedData.address || null,
        pincode: validatedData.pincode || null,
        isDistributor: validatedData.isDistributor,
      }
    })

    revalidatePath('/customers')
    revalidatePath(`/customers/${id}`)
    
    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      }
    }

  } catch (error) {
    console.error('Error updating customer:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error || 'Validation failed'
      }
    }

    return {
      success: false,
      error: 'Failed to update customer. Please try again.'
    }
  }
}

export async function getCustomerById(id: number) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        Address: true,
        pincode: true,
        isDistributor: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return customer
  } catch (error) {
    console.error('Error fetching customer:', error)
    return null
  }
}

export async function deleteCustomer(id: number) {
  try {
    // Optional: Check if customer exists first
    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    await prisma.customer.delete({
      where: { id },
    })

    revalidatePath('/customers')
    
    // If you are on the detail page, you might want to redirect
    // redirect('/customers') 

    return { success: true }
  } catch (error) {
    console.error('Error deleting customer:', error)
    return { 
      success: false, 
      error: 'Failed to delete customer. They may have associated orders.' 
    }
  }
}