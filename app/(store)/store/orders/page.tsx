'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ClipboardList, 
  Search, 
  ChevronRight, 
  Check, 
  X,
  Phone,
  Mail,
  User,
  ShoppingBag,
  HelpCircle,
  Package,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  quantity: number
  price: number
  products: {
    title: string
    thumbnail_url: string
  }
}

interface Order {
  id: string
  total_price: number
  payment_method: string
  status: 'pending' | 'diproses' | 'siap_diambil' | 'selesai' | 'dibatalkan'
  created_at: string
  customer_id: string
  users: {
    name: string
    email: string
    phone: string
  }
  order_items: OrderItem[]
}

type TabType = 'semua' | 'pending' | 'diproses' | 'siap_diambil' | 'selesai' | 'dibatalkan'

export default function MerchantOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('semua')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!store) return

      const { data: ords, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_price,
          payment_method,
          status,
          created_at,
          customer_id,
          users (
            name,
            email,
            phone
          ),
          order_items (
            id,
            quantity,
            price,
            products (
              title,
              thumbnail_url
            )
          )
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrders((ords || []) as unknown as Order[])
    } catch (err) {
      toast.error('Gagal mengambil daftar pesanan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders()

    // Realtime listener
    const channel = supabase
      .channel('store-orders-page-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      toast.success(`Pesanan berhasil diupdate menjadi: ${newStatus.replace('_', ' ')}`)
      // Optimistic update local state to avoid flash
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (err) {
      toast.error('Gagal mengupdate status pesanan.')
    }
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val)
  }

  const tabs: { value: TabType; label: string }[] = [
    { value: 'semua', label: 'Semua' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'diproses', label: 'Diproses' },
    { value: 'siap_diambil', label: 'Siap Diambil' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'dibatalkan', label: 'Batal' }
  ]

  // Filter & Search Logic
  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'semua' || order.status === activeTab
    const matchesSearch = 
      order.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_items?.some(item => item.products?.title?.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesTab && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-dark/10 rounded-xl" />
        <div className="h-12 w-full bg-dark/5 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-dark/5 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-poppins font-extrabold text-dark tracking-tight">
          Kelola Pesanan
        </h1>
        <p className="text-dark/50 text-sm mt-1">
          Pantau, terima, dan selesaikan pesanan makanan penyelamatan dari customer Anda.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b border-dark/5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 shrink-0 ${
              activeTab === tab.value
                ? 'bg-primary-teal text-white shadow-md shadow-primary-teal/15'
                : 'text-dark/60 bg-white border border-dark/5 hover:bg-dark/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search filter */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" />
        <input
          type="text"
          placeholder="Cari pembeli, ID pesanan, atau menu makanan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/30 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none"
        />
      </div>

      {/* Order List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <ClipboardList className="w-12 h-12 text-dark/20 mb-4" />
          <h3 className="text-lg font-bold text-dark font-poppins">Tidak Ada Pesanan</h3>
          <p className="text-sm text-dark/50 mt-1 max-w-sm">
            Tidak ada pesanan yang sesuai dengan filter atau kriteria pencarian saat ini.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-2xl border border-dark/5 shadow-sm p-6 flex flex-col md:flex-row justify-between gap-6 transition-all hover:shadow-md"
            >
              {/* Order Info & Products */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono font-bold bg-dark/5 text-dark/70 px-2.5 py-1 rounded-lg">
                    ID: #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    order.status === 'diproses' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'siap_diambil' ? 'bg-green-100 text-green-800' :
                    order.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-dark/40 font-semibold">
                    {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                {/* Customer Details Card */}
                <div className="bg-cream-bg/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-dark/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-teal/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary-teal" />
                    </div>
                    <div>
                      <p className="text-[10px] text-dark/50 font-bold uppercase tracking-wider">Pemesan</p>
                      <p className="text-sm text-dark font-extrabold truncate">{order.users?.name || 'Customer'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {order.users?.phone ? (
                      <a 
                        href={`https://wa.me/${order.users.phone.replace(/[^0-9]/g, '')}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{order.users.phone}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark/5 text-dark/40 border border-dark/5">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Tidak ada nomor</span>
                      </div>
                    )}

                    {order.users?.email ? (
                      <a 
                        href={`mailto:${order.users.email}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-teal/10 text-primary-teal hover:bg-primary-teal/20 transition-colors border border-primary-teal/20"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{order.users.email}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark/5 text-dark/40 border border-dark/5">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Tidak ada email</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-dark/50 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Daftar Belanja
                  </h4>
                  <div className="divide-y divide-dark/5">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2.5">
                        <div>
                          <p className="text-sm font-bold text-dark">{item.products?.title}</p>
                          <p className="text-xs text-dark/40 mt-0.5">{formatPrice(Number(item.price))} / porsi</p>
                        </div>
                        <span className="text-sm font-extrabold text-dark font-poppins">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Payment & Actions Panel */}
              <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-dark/5 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between shrink-0">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-dark/40 font-semibold block">Total Pembayaran</span>
                    <span className="text-2xl font-extrabold text-primary-orange font-poppins block mt-1">
                      {formatPrice(order.total_price)}
                    </span>
                    <span className="text-[10px] font-bold bg-primary-teal/10 text-primary-teal px-2 py-0.5 rounded-md inline-block mt-2">
                      Metode: {order.payment_method.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* CTA actions depending on status */}
                <div className="space-y-2 mt-6">
                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'diproses')}
                        className="flex-1 py-2.5 rounded-xl bg-primary-teal text-white text-xs font-bold shadow-md shadow-primary-teal/15 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Terima Pesanan
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'dibatalkan')}
                        className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {order.status === 'diproses' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'siap_diambil')}
                      className="w-full py-2.5 rounded-xl bg-primary-orange text-white text-xs font-bold shadow-md shadow-primary-orange/15 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Package className="w-4 h-4" /> Siap Diambil
                    </button>
                  )}

                  {order.status === 'siap_diambil' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'selesai')}
                      className="w-full py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold shadow-md shadow-green-600/15 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Selesai
                    </button>
                  )}

                  {(order.status === 'selesai' || order.status === 'dibatalkan') && (
                    <div className="py-2.5 px-4 rounded-xl bg-dark/5 text-center text-xs font-bold text-dark/40 flex items-center justify-center gap-1.5">
                      <HelpCircle className="w-4 h-4" /> Pesanan Selesai
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
