// lib/actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addToCart(productId: number, sizes: number[]) {
  try {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })
    
    if (!product) {
      throw new Error('Product not found')
    }
    
    // Validate that all selected sizes are available for this product
    const invalidSizes = sizes.filter(size => !product.size.includes(size))
    if (invalidSizes.length > 0) {
      throw new Error(`Invalid sizes selected: ${invalidSizes.join(', ')}`)
    }
    
    // Here you would typically create order items or cart items
    // For now, we'll just log the action
    
    // If you have a cart/order system, you might do something like:
    // await prisma.orderItem.createMany({
    //   data: sizes.map(size => ({
    //     productId,
    //     quantity: 1,
    //     size: size.toString(),
    //     // other fields...
    //   }))
    // })
    
    revalidatePath('/cart')
    return { success: true, message: 'Added to cart successfully' }
  } catch (error) {
    console.error('Error adding to cart:', error)
    return { success: false, message: 'Failed to add to cart' }
  }
}

export async function getProductsByCategory(categoryId?: number) {
  try {
    const products = await prisma.product.findMany({
      where: categoryId ? { categoryId } : {},
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function searchProducts(query: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            category: {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            }
          }
        ]
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return products
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}
export async function GetProductPrice(cartItems: number[]) {
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: cartItems // Use 'in' operator for array of IDs
      }
    },
    select: {
      id: true,
      name: true,
      price: true,
      category: {
        select: {
          name: true
        }
      }
    }
  });

  return products;
}
// lib/actions/categories.ts




export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          where: {
            isVisible: true,
            imgurl: {
              not: null
            }
          },
          take: 1, // Get one product to show as category image
          select: {
            imgurl: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return categories || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}