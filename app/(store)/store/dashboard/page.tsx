'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, 
  Leaf, 
  ShoppingBag, 
  PackageOpen, 
  Clock, 
  ArrowRight,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Package,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

interface Store {
  id: string
  store_name: string
  is_verified: boolean
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  products: {
    title: string
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

interface SalesData {
  name: string
  penjualan: number
}

export default function MerchantDashboard() {
  const supabase = createClient()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    foodsSaved: 0,
    pendingOrdersCount: 0,
    totalProducts: 0
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [chartData, setChartData] = useState<SalesData[]>([])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Fetch Store Info
      const { data: storeData, error: storeErr } = await supabase
        .from('stores')
        .select('id, store_name, is_verified')
        .eq('user_id', user.id)
        .single()

      if (storeErr || !storeData) {
        toast.error('Gagal mengambil data toko Anda.')
        return
      }
      setStore(storeData)

      // 2. Fetch Orders for Stats and Lists
      const { data: ordersData, error: ordersErr } = await supabase
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
              title
            )
          )
        `)
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false })

      if (ordersErr) throw ordersErr

      const ordersList = (ordersData || []) as unknown as Order[]
      setRecentOrders(ordersList.slice(0, 5))

      // Calculate stats
      const completedOrders = ordersList.filter(o => o.status === 'selesai')
      const totalEarnings = completedOrders.reduce((acc, curr) => acc + Number(curr.total_price), 0)
      
      // Calculate foods saved: Sum quantity of completed order items
      let foodsSaved = 0
      completedOrders.forEach(o => {
        o.order_items?.forEach(item => {
          foodsSaved += item.quantity
        })
      })

      const pendingOrdersCount = ordersList.filter(o => o.status === 'pending' || o.status === 'diproses').length

      // 3. Fetch total active products
      const { count: productCount, error: prodErr } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeData.id)

      if (prodErr) throw prodErr

      setStats({
        totalEarnings,
        foodsSaved,
        pendingOrdersCount,
        totalProducts: productCount || 0
      })

      // Generate Sales chart mock/real data (last 7 days)
      const salesByDay: Record<string, number> = {}
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toLocaleDateString('id-ID', { weekday: 'short' })
        salesByDay[dateStr] = 0
      }

      completedOrders.forEach(o => {
        const orderDate = new Date(o.created_at)
        const dateStr = orderDate.toLocaleDateString('id-ID', { weekday: 'short' })
        if (dateStr in salesByDay) {
          salesByDay[dateStr] += Number(o.total_price)
        }
      })

      const chartFormatted = Object.keys(salesByDay).map(day => ({
        name: day,
        penjualan: salesByDay[day]
      }))
      setChartData(chartFormatted)

    } catch (err) {
      console.error(err)
      toast.error('Gagal memperbarui data dashboard.')
    } finally {
      setLoading(false)
    }
  }

  // Set up real-time subscription for new orders
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData()

    // Subscribe to new orders or status updates
    const channel = supabase
      .channel('store-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Re-fetch data on changes
          fetchDashboardData()
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
      fetchDashboardData()
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

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-dark/10 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-dark/5 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-dark/5 rounded-2xl" />
          <div className="h-96 bg-dark/5 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header & Verification Warning */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-extrabold text-dark tracking-tight">
            Ringkasan Toko
          </h1>
          <p className="text-dark/50 text-sm mt-1">
            Pantau performa penjualan dan penyelamatan makanan Anda hari ini.
          </p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-dark/10 hover:bg-dark/5 rounded-xl text-sm font-semibold transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4 text-dark/70" />
          Refresh Data
        </button>
      </div>

      {!store?.is_verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <AlertTriangle className="size-6 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-amber-900 text-sm">Akun Toko Belum Terverifikasi</h4>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
              Produk Anda tidak akan muncul di halaman jelajah publik sampai admin memverifikasi profil toko Anda. Lengkapi alamat dan jam operasional di halaman Pengaturan.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl border border-dark/5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center text-primary-orange shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-dark/40 font-semibold uppercase tracking-wider block">Total Pendapatan</span>
            <span className="text-xl font-extrabold text-dark font-poppins">{formatPrice(stats.totalEarnings)}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl border border-dark/5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-dark/40 font-semibold uppercase tracking-wider block">Porsi Terselamatkan</span>
            <span className="text-xl font-extrabold text-dark font-poppins">{stats.foodsSaved} Makanan</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl border border-dark/5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-teal/10 flex items-center justify-center text-primary-teal shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-dark/40 font-semibold uppercase tracking-wider block">Pesanan Aktif</span>
            <span className="text-xl font-extrabold text-dark font-poppins">{stats.pendingOrdersCount} Pesanan</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-2xl border border-dark/5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-dark/40 font-semibold uppercase tracking-wider block">Etalase Produk</span>
            <span className="text-xl font-extrabold text-dark font-poppins">{stats.totalProducts} Item</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Column (Left) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-dark/5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold font-poppins text-dark">Statistik Penjualan</h3>
            <p className="text-xs text-dark/50 mb-6">Tren pendapatan harian dari makanan terselamatkan.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip 
                  formatter={(val) => [formatPrice(Number(val)), 'Pendapatan']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #F3F4F6' }}
                />
                <Area type="monotone" dataKey="penjualan" stroke="#0F766E" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders Column (Right) */}
        <div className="bg-white p-6 rounded-2xl border border-dark/5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold font-poppins text-dark">Pesanan Masuk</h3>
              <p className="text-xs text-dark/50">Daftar pesanan aktif terbaru</p>
            </div>
            <Link 
              href="/store/orders"
              className="text-xs font-bold text-primary-teal hover:underline flex items-center gap-1"
            >
              Lihat Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <PackageOpen className="w-10 h-10 text-dark/20 mb-3" />
              <p className="text-xs text-dark/50 font-semibold">Belum ada pesanan masuk</p>
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto max-h-72 pr-1">
              {recentOrders.map(order => (
                <div key={order.id} className="p-4 rounded-xl bg-cream-bg/40 border border-dark/5 hover:bg-cream-bg/85 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-dark">
                        {order.users?.name || 'Customer'}
                      </h4>
                      <p className="text-[10px] text-dark/40 font-semibold">
                        {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {order.payment_method}
                      </p>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      order.status === 'diproses' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'siap_diambil' ? 'bg-green-100 text-green-800' :
                      order.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="text-xs text-dark/60 space-y-1 mb-3">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex justify-between">
                        <span className="truncate max-w-[150px]">{item.products?.title}</span>
                        <span className="font-bold">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons based on status */}
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'diproses')}
                          className="flex-1 py-1.5 rounded-lg bg-primary-teal text-white text-[11px] font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Terima
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'dibatalkan')}
                          className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-50 transition-all flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {order.status === 'diproses' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'siap_diambil')}
                        className="w-full py-1.5 rounded-lg bg-primary-orange text-white text-[11px] font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                          <Package className="w-3 h-3" /> Siap Diambil
                      </button>
                    )}
                    {order.status === 'siap_diambil' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'selesai')}
                        className="w-full py-1.5 rounded-lg bg-green-600 text-white text-[11px] font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                          <CheckCircle className="w-3 h-3" /> Selesai
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
