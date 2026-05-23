'use client'

import React, { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cart-store'
import { ArrowLeft, ShoppingCart, Trash2, Store, Minus, Plus, Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const router = useRouter()
  const { items, store, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream-bg flex flex-col">
        <div className="bg-white border-b border-dark/5 px-4 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl text-dark/60 hover:bg-cream-bg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-poppins font-extrabold text-lg text-dark">Keranjang</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-teal/10 flex items-center justify-center mb-4">
            <ShoppingCart className="w-10 h-10 text-primary-teal/50" />
          </div>
          <h2 className="font-poppins font-bold text-dark text-lg mb-1">Keranjang masih kosong</h2>
          <p className="text-sm text-dark/60 mb-6">Yuk cari makanan enak dengan harga hemat sekarang!</p>
          <Link href="/foods" className="py-3 px-6 rounded-xl bg-primary-orange text-white font-bold text-sm shadow-md hover:bg-primary-orange/90 transition-all">
            Cari Makanan
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-bg pb-32">
      {/* Header */}
      <div className="bg-white border-b border-dark/5 px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl text-dark/60 hover:bg-cream-bg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-poppins font-extrabold text-lg text-dark">Keranjang</h1>
        </div>
        <button onClick={() => { if (confirm('Kosongkan keranjang?')) clearCart() }} className="text-xs font-bold text-red-500 hover:text-red-600">
          Kosongkan
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Store Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-dark/5">
          <div className="flex items-center gap-2 border-b border-dark/5 pb-3 mb-3">
            <Store className="w-5 h-5 text-primary-teal" />
            <h2 className="font-bold text-dark text-sm">{store?.store_name}</h2>
          </div>

          {/* Items */}
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.product_id} className="flex gap-3">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-dark/5 shrink-0 border border-dark/5">
                  {item.thumbnail_url ? (
                    <Image src={item.thumbnail_url} alt={item.title} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="size-6 text-[#6A7686]" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="font-bold text-dark text-sm line-clamp-1">{item.title}</h3>
                    <p className="font-extrabold text-primary-orange text-sm mt-0.5">
                      Rp{item.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={() => removeItem(item.product_id)} className="p-1.5 rounded-lg text-dark/40 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 bg-cream-bg rounded-xl p-1 border border-dark/5">
                      <button 
                        onClick={() => updateQuantity(item.product_id, Number(item.quantity) - 1)}
                        disabled={Number(item.quantity) <= 1}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-dark hover:bg-dark/5 disabled:opacity-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-extrabold text-dark w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product_id, Number(item.quantity) + 1)}
                        disabled={Number(item.quantity) >= item.stock}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-dark hover:bg-dark/5 disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-dark/5 p-4 z-40 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-dark/60 font-semibold">Total Pembayaran</p>
          <p className="text-xl font-extrabold text-primary-orange font-poppins">
            Rp{getTotalPrice().toLocaleString('id-ID')}
          </p>
        </div>
        <Link 
          href="/checkout" 
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-teal text-white font-poppins font-bold text-sm shadow-lg shadow-primary-teal/25 hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          Lanjut ke Checkout
        </Link>
      </div>
    </div>
  )
}
