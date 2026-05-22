'use client'

import React, { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cart-store'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Wallet, Store, MapPin, ReceiptText, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { items, store, getTotalPrice, clearCart } = useCartStore()
  
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer' | 'toko'>('cod')
  const [userId, setUserId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        if (user) setUserId(user.id)
        else router.push('/login')
      } catch (e) {
        toast.error('Gagal memuat profil pengguna')
        router.push('/login')
      }
    }
    checkUser()
  }, [supabase, router])

  if (!mounted) return null
  if (items.length === 0 && !success) {
    router.replace('/cart')
    return null
  }

  const handleCheckout = async () => {
    if (!userId || !store) return
    setLoading(true)
    try {
      const total = getTotalPrice()
      
      // 1. Create Order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_id: userId,
          store_id: store.id,
          total_price: total,
          payment_method: paymentMethod,
          status: 'pending'
        })
        .select('id').single()

      if (orderErr) throw orderErr

      // 2. Create Order Items and update stock
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }))

      const { error: itemErr } = await supabase.from('order_items').insert(orderItems)
      if (itemErr) throw itemErr

      // Reduce stock
      for (const item of items) {
        await supabase.from('products').update({ stock: item.stock - Number(item.quantity) }).eq('id', item.product_id)
      }

      setSuccess(true)
      clearCart()
      
      setTimeout(() => {
        router.push('/orders')
      }, 3000)

    } catch {
      toast.error('Gagal membuat pesanan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="font-poppins font-extrabold text-2xl text-dark mb-2">Pesanan Berhasil!</h1>
        <p className="text-dark/60 mb-8">Terima kasih telah berpartisipasi menyelamatkan makanan hari ini. Mohon tunggu konfirmasi dari toko.</p>
        <div className="w-12 h-1 bg-dark/10 rounded-full mb-8 animate-pulse" />
        <p className="text-xs text-dark/40">Mengarahkan ke halaman pesanan...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-bg pb-32">
      <div className="bg-white border-b border-dark/5 px-4 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl text-dark/60 hover:bg-cream-bg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-poppins font-extrabold text-lg text-dark">Checkout</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Ringkasan Pesanan */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-dark/5">
          <div className="flex items-center gap-2 border-b border-dark/5 pb-3 mb-3">
            <ReceiptText className="w-5 h-5 text-primary-teal" />
            <h2 className="font-bold text-dark text-sm">Ringkasan Pesanan</h2>
          </div>
          
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.product_id} className="flex gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-dark/5 shrink-0 border border-dark/5">
                  {item.thumbnail_url && <Image src={item.thumbnail_url} alt={item.title} fill sizes="48px" className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-bold text-dark text-sm line-clamp-1">{item.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-dark/50">{item.quantity} x Rp{item.price.toLocaleString('id-ID')}</p>
                    <p className="font-bold text-dark text-sm">Rp{(item.price * Number(item.quantity)).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-dark/5 flex items-center justify-between">
            <p className="text-sm text-dark/60 font-semibold">Total Pesanan</p>
            <p className="font-extrabold text-primary-orange text-lg font-poppins">Rp{getTotalPrice().toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Lokasi Pengambilan */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-dark/5">
          <div className="flex items-center gap-2 border-b border-dark/5 pb-3 mb-3">
            <Store className="w-5 h-5 text-primary-teal" />
            <h2 className="font-bold text-dark text-sm">Toko Pengambilan</h2>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-teal/10 flex items-center justify-center shrink-0 mt-1">
              <MapPin className="w-4 h-4 text-primary-teal" />
            </div>
            <div>
              <p className="font-bold text-dark text-sm">{store?.store_name}</p>
              <p className="text-xs text-dark/50 mt-1">Ambil pesanan langsung di toko setelah pesanan disetujui.</p>
            </div>
          </div>
        </div>

        {/* Metode Pembayaran */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-dark/5">
          <div className="flex items-center gap-2 border-b border-dark/5 pb-3 mb-3">
            <Wallet className="w-5 h-5 text-primary-teal" />
            <h2 className="font-bold text-dark text-sm">Metode Pembayaran</h2>
          </div>
          
          <div className="space-y-2">
            {[
              { id: 'cod', label: 'COD / Cash on Delivery', desc: 'Bayar saat pesanan diantar.' },
              { id: 'toko', label: 'Bayar di Toko', desc: 'Bayar saat kamu mengambil makanan di toko.' },
              { id: 'transfer', label: 'Transfer Bank Manual', desc: 'Transfer ke rekening toko.' }
            ].map(method => (
              <label key={method.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                paymentMethod === method.id ? 'border-primary-teal bg-primary-teal/5' : 'border-dark/10 hover:bg-cream-bg'
              }`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  paymentMethod === method.id ? 'border-primary-teal' : 'border-dark/30'
                }`}>
                  {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-teal" />}
                </div>
                <div>
                  <p className={`text-sm font-bold ${paymentMethod === method.id ? 'text-primary-teal' : 'text-dark'}`}>
                    {method.label}
                  </p>
                  <p className="text-xs text-dark/50 mt-0.5">{method.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-dark/5 p-4 z-20">
        <button 
          onClick={handleCheckout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-orange text-white font-poppins font-bold text-sm shadow-lg shadow-primary-orange/25 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
          ) : (
            `Bayar Rp${getTotalPrice().toLocaleString('id-ID')}`
          )}
        </button>
      </div>
    </div>
  )
}
