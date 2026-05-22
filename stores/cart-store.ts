import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  product_id: string
  title: string
  price: number
  quantity: string | number
  thumbnail_url: string | null
  stock: number
}

interface StoreInfo {
  id: string
  store_name: string
}

interface CartState {
  items: CartItem[]
  store: StoreInfo | null
  addItem: (item: CartItem, store: StoreInfo) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      store: null,
      addItem: (item, store) => {
        const currentStore = get().store
        const currentItems = get().items

        // If cart belongs to a different store, clear it first
        if (currentStore && currentStore.id !== store.id) {
          if (!window.confirm('Keranjang Anda berisi produk dari toko lain. Kosongkan keranjang dan tambahkan produk ini?')) {
            return
          }
          set({ items: [item], store })
          return
        }

        const existingItemIndex = currentItems.findIndex(i => i.product_id === item.product_id)
        if (existingItemIndex > -1) {
          const newItems = [...currentItems]
          const newQty = Number(newItems[existingItemIndex].quantity) + Number(item.quantity)
          newItems[existingItemIndex].quantity = Math.min(newQty, item.stock)
          set({ items: newItems, store })
        } else {
          set({ items: [...currentItems, item], store })
        }
      },
      removeItem: (productId) => {
        const newItems = get().items.filter(i => i.product_id !== productId)
        set({
          items: newItems,
          store: newItems.length === 0 ? null : get().store
        })
      },
      updateQuantity: (productId, quantity) => {
        const newItems = get().items.map(i => {
          if (i.product_id === productId) {
            return { ...i, quantity: Math.min(quantity, i.stock) }
          }
          return i
        })
        set({ items: newItems })
      },
      clearCart: () => set({ items: [], store: null }),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * Number(item.quantity)), 0)
      }
    }),
    {
      name: 'sisarasa-cart',
    }
  )
)
