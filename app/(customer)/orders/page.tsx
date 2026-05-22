'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, Clock, ChevronRight, Package, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  quantity: number
  price: number
  products: { title: string; thumbnail_url: string }
}

interface Order {
  id: string
  total_price: number
  payment_method: string
  status: 'pending' | 'diproses' | 'siap_diambil' | 'selesai' | 'dibatalkan'
  created_at: string
  stores: { store_name: string; logo_url: string }
  order_items: OrderItem[]
}

type TabType = 'semua' | 'pending' | 'diproses' | 'siap_diambil' | 'selesai' | 'dibatalkan'

const TABS: { value: TabType; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'siap_diambil', label: 'Siap Ambil' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dibatalkan', label: 'Batal' },
]

const STATUS_CONFIG = {
  pending:      { label: 'Menunggu', class: 'bg-amber-100 text-amber-700', icon: Clock },
  diproses:     { label: 'Diproses', class: 'bg-blue-100 text-blue-700', icon: Loader2 },
  siap_diambil: { label: 'Siap Diambil', class: 'bg-green-100 text-green-700', icon: Package },
  selesai:      { label: 'Selesai', class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  dibatalkan:   { label: 'Dibatalkan', class: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function CustomerOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('semua')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, total_price, payment_method, status, created_at,
            stores ( store_name, logo_url ),
            order_items (
              id, quantity, price,
              products ( title, thumbnail_url )
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setOrders((data || []) as any)
      } catch {
        toast.error('Gagal memuat riwayat pesanan.')
      } finally {
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders()
  }, [supabase])

  const filtered = activeTab === 'semua' ? orders : orders.filter(o => o.status === activeTab)

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Header */}
      <div className="bg-white border-b border-dark/5 px-5 pt-12 pb-4 sticky top-0 z-20">
        <h1 className="font-poppins font-extrabold text-xl text-dark">Pesanan Saya</h1>
        <p className="text-xs text-dark/50 mt-0.5">Pantau status dan riwayat pesananmu</p>

        {/* Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`shrink-0 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === t.value
                  ? 'bg-primary-teal text-white shadow-sm'
                  : 'bg-cream-bg text-dark/50 hover:bg-dark/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 bg-white rounded-2xl animate-pulse border border-dark/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="w-14 h-14 text-dark/15 mb-4" />
            <p className="font-poppins font-bold text-dark/50 text-base">Tidak ada pesanan</p>
            <p className="text-xs text-dark/35 mt-1 max-w-xs">
              {activeTab === 'semua' ? 'Yuk buat pesanan pertamamu!' : `Tidak ada pesanan dengan status "${TABS.find(t => t.value === activeTab)?.label}"`}
            </p>
            <Link href="/foods" className="mt-5 py-2.5 px-6 rounded-xl bg-primary-orange text-white text-sm font-bold shadow-sm hover:-translate-y-0.5 transition-all">
              Jelajahi Makanan
            </Link>
          </div>
        ) : (
          filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status]
            const StatusIcon = cfg?.icon ?? Clock
            const storeData = order.stores as any

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-dark/5 shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="px-4 py-3 border-b border-dark/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-teal/10 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-primary-teal" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark">{storeData?.store_name || 'Toko'}</p>
                      <p className="text-[10px] text-dark/40 font-medium">
                        <Clock className="inline w-3 h-3 mr-0.5" />
                        {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${cfg?.class || 'bg-gray-100 text-gray-600'}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg?.label || order.status}
                  </span>
                </div>

                {/* Items */}
                <div className="px-4 py-3 space-y-2">
                  {order.order_items?.slice(0, 2).map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="text-dark/80 font-medium truncate max-w-[200px]">
                        {(item.products as any)?.title || 'Produk'}
                      </span>
                      <span className="text-dark/50 font-semibold shrink-0">x{item.quantity}</span>
                    </div>
                  ))}
                  {(order.order_items?.length || 0) > 2 && (
                    <p className="text-xs text-dark/40">+{(order.order_items?.length || 0) - 2} item lainnya</p>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-dark/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-dark/40 font-medium">Total Pembayaran</p>
                    <p className="text-base font-extrabold text-primary-orange font-poppins">{formatPrice(order.total_price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary-teal bg-primary-teal/10 px-2 py-1 rounded-lg uppercase">
                      {order.payment_method}
                    </span>
                    <ChevronRight className="w-4 h-4 text-dark/30" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
