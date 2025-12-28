'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Validation schema
const partnerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Types
export type PartnerRevenue = {
  partnerId: string
  name: string
  username: string
  totalRevenue: number
}

export type ActionState = {
  success?: boolean
  message?: string
  errors?: {
    name?: string[]
    username?: string[]
    password?: string[]
  }
}

// Get all partners
export async function getAllPartners() {
  try {
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        name: true,
        username: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    return partners
  } catch (error) {
    console.error('Error fetching partners:', error)
    throw new Error('Failed to fetch partners')
  }
}

// Create partner
export async function createPartner(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const rawData = {
      name: formData.get('name'),
      username: formData.get('username'),
      password: formData.get('password'),
    }

    // Validate
    const validated = partnerSchema.safeParse(rawData)
    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const { name, username, password } = validated.data

    // Check if username exists
    const existing = await prisma.partner.findUnique({
      where: { username },
    })

    if (existing) {
      return {
        success: false,
        errors: {
          username: ['Username already exists'],
        },
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create partner
    await prisma.partner.create({
      data: {
        name,
        username,
        password: hashedPassword,
      },
    })

    revalidatePath('/partners')
    return {
      success: true,
      message: 'Partner created successfully',
    }
  } catch (error) {
    console.error('Error creating partner:', error)
    return {
      success: false,
      message: 'Failed to create partner',
    }
  }
}

// Delete partner
export async function deletePartner(partnerId: string) {
  try {
    await prisma.partner.delete({
      where: { id: partnerId },
    })

    revalidatePath('/partners')
    return {
      success: true,
      message: 'Partner deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting partner:', error)
    throw new Error('Failed to delete partner')
  }
}

// Get partner revenue
export async function getPartnerRevenue(): Promise<PartnerRevenue[]> {
  try {
    // Fetch all partners first
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        name: true,
        username: true,
      },
    })

    // Fetch products with order items and order status
    const productsWithRevenue = await prisma.product.findMany({
      select: {
        partnerId: true,
        orderItems: {
          where: {
            order: {
              paid: true,
            },
          },
          select: {
            price: true,
            quantity: true,
          },
        },
      },
    })

    // Calculate revenue per partner
    const revenueMap = new Map<string, number>()

    // Initialize all partners with 0 revenue
    partners.forEach((partner) => {
      revenueMap.set(partner.id, 0)
    })

    // Aggregate revenue by partner
    productsWithRevenue.forEach((product) => {
      const partnerId = product.partnerId
      const productRevenue = product.orderItems.reduce((sum, item) => {
        return sum + item.price * item.quantity
      }, 0)

      const currentRevenue = revenueMap.get(partnerId) || 0
      revenueMap.set(partnerId, currentRevenue + productRevenue)
    })

    // Build final result
    const result: PartnerRevenue[] = partners.map((partner) => ({
      partnerId: partner.id,
      name: partner.name,
      username: partner.username,
      totalRevenue: revenueMap.get(partner.id) || 0,
    }))

    // Sort by revenue descending
    result.sort((a, b) => b.totalRevenue - a.totalRevenue)

    return result
  } catch (error) {
    console.error('Error calculating partner revenue:', error)
    throw new Error('Failed to calculate partner revenue')
  }
}