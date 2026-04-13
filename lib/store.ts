import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Unified Product interface matching Prisma schema and other components
export interface Product {
  id: number
  name: string
  size: number[]
  imgurl: string | null
  unit: string
  price: number
  categoryId: number
  category: { name: string }
  packaging: number | null
  LooseSell: boolean
}

export interface CartItem {
  item: Product
  qty: number
}

interface CartState {
  cartItems: CartItem[]
  AddProduct: (item: CartItem) => void
  RemoveProduct: (id: number) => void
  ClearBasket: () => void
  getTotalPrice: () => number
  getBasketCount: () => number
  getItemQuantity: (id: number) => number
  SetItemQuantity: (id: number, qty: number) => void
  incrementQuantity: (id: number) => void
  decrementQuantity: (id: number) => void
  getPackageSize: (id: number) => number
  getValidQuantity: (product: Product, requestedQty: number) => number
}

const ProductCart = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],

      // Helper function to get package size for a product
      getPackageSize: (id: number) => {
        const { cartItems } = get()
        const cartItem = cartItems.find(item => item.item.id === id)
        if (cartItem) {
          return cartItem.item.packaging || 1
        }
        return 1
      },

      // Helper function to validate and adjust quantity based on LooseSell and packaging
      getValidQuantity: (product: Product, requestedQty: number) => {
        // If LooseSell is true, any quantity is allowed
        if (product.LooseSell) {
          return Math.max(0, requestedQty)
        }

        // If LooseSell is false, quantity must be in multiples of packaging
        const packageSize = product.packaging || 1
        if (requestedQty <= 0) {
          return 0
        }

        // Round to nearest multiple of package size
        return Math.ceil(requestedQty / packageSize) * packageSize
      },

      AddProduct: (newItem: CartItem) => set((state) => {
        const cartItems = [...state.cartItems]
        const existingItemIndex = cartItems.findIndex(
          (cartItem) => cartItem.item.id === newItem.item.id
        )

        // Validate quantity based on LooseSell setting
        const { getValidQuantity } = get()
        const validQty = getValidQuantity(newItem.item, newItem.qty)

        if (validQty === 0) {
          return { cartItems }
        }

        if (existingItemIndex !== -1) {
          const existingItem = cartItems[existingItemIndex]
          const totalQty = existingItem.qty + validQty
          const finalQty = getValidQuantity(newItem.item, totalQty)

          cartItems[existingItemIndex] = {
            ...existingItem,
            qty: finalQty,
          }
          return { cartItems }
        }

        return { 
          cartItems: [...cartItems, { ...newItem, qty: validQty }] 
        }
      }),

      RemoveProduct: (id: number) => set((state) => ({
        cartItems: state.cartItems.filter(cartItem => cartItem.item.id !== id)
      })),

      ClearBasket: () => set({ cartItems: [] }),

      getTotalPrice: () => {
        const { cartItems } = get()
        return cartItems.reduce((total, cartItem) => {
          return total + (cartItem.item.price * cartItem.qty)
        }, 0)
      },

      getBasketCount: () => {
        const { cartItems } = get()
        return cartItems.reduce((total, cartItem) => total + cartItem.qty, 0)
      },

      getItemQuantity: (id: number) => {
        const { cartItems } = get()
        const item = cartItems.find(cartItem => cartItem.item.id === id)
        return item ? item.qty : 0
      },

      SetItemQuantity: (id: number, qty: number) => {
        set((state) => {
          const existingItemIndex = state.cartItems.findIndex(
            (cartItem) => cartItem.item.id === id
          )

          if (existingItemIndex >= 0) {
            const product = state.cartItems[existingItemIndex].item
            const { getValidQuantity } = get()
            const validQty = getValidQuantity(product, qty)

            if (validQty <= 0) {
              return {
                cartItems: state.cartItems.filter(cartItem => cartItem.item.id !== id)
              }
            }

            const updatedItems = [...state.cartItems]
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              qty: validQty,
            }
            return { cartItems: updatedItems }
          }
          return { cartItems: state.cartItems }
        })
      },

      incrementQuantity: (id: number) => {
        const { cartItems } = get()
        const cartItem = cartItems.find(item => item.item.id === id)
        
        if (!cartItem) return

        const { getItemQuantity, SetItemQuantity } = get()
        const currentQty = getItemQuantity(id)
        
        // If LooseSell is true, increment by 1
        if (cartItem.item.LooseSell) {
          SetItemQuantity(id, currentQty + 1)
        } else {
          // If LooseSell is false, increment by package size
          const packageSize = cartItem.item.packaging || 1
          SetItemQuantity(id, currentQty + packageSize)
        }
      },

      decrementQuantity: (id: number) => {
        const { cartItems } = get()
        const cartItem = cartItems.find(item => item.item.id === id)
        
        if (!cartItem) return

        const { getItemQuantity, SetItemQuantity } = get()
        const currentQty = getItemQuantity(id)
        
        // If LooseSell is true, decrement by 1
        if (cartItem.item.LooseSell) {
          if (currentQty > 1) {
            SetItemQuantity(id, currentQty - 1)
          } else {
            SetItemQuantity(id, 0)
          }
        } else {
          // If LooseSell is false, decrement by package size
          const packageSize = cartItem.item.packaging || 1
          if (currentQty > packageSize) {
            SetItemQuantity(id, currentQty - packageSize)
          } else {
            SetItemQuantity(id, 0)
          }
        }
      },
    }),
    {
      name: 'Cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default ProductCart