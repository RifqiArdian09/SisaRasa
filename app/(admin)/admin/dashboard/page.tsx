'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp, TrendingDown, Wallet, ShoppingBag, Store, Users,
  Eye, MapPin, CheckCircle, XCircle, Loader2, Store as StoreIcon
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

const STATUS_STYLES: Record<string, string> = {
  selesai: 'bg-emerald-50 text-emerald-700',
  diproses: 'bg-orange-50 text-orange-700',
  dibatalkan: 'bg-red-50 text-red-700',
  pending: 'bg-yellow-50 text-yellow-700',
  siap_diambil: 'bg-blue-50 text-blue-700',
}

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700', 'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700',
]

function StatCard({ icon: Icon, label, value, trend, trendPositive, iconBg, iconColor }: any) {
  return (
    <div className="flex flex-col rounded-3xl ring-1 ring-[#E5E7EB] p-6 gap-4 bg-white shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`size-6 ${iconColor}`} />
        </div>
        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${trendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {trendPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {trend}
        </span>
      </div>
      <div>
        <p className="font-medium text-[#6A7686] text-sm mb-1">{label}</p>
        <p className="font-bold text-3xl tracking-tight">{value}</p>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#080C1A] text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-xl">
      <p className="text-[#6A7686] text-xs mb-1">{label}</p>
      <p>Rp {payload[0].value.toLocaleString('id-ID')}</p>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, stores: 0, users: 0, revTrend: 0, orderTrend: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [pendingStores, setPendingStores] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [verifyModal, setVerifyModal] = useState<any>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [orderModal, setOrderModal] = useState<any>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'admin') {
        router.push('/login')
        return
      }

      const [
        { count: usersCount },
        { count: storesCount },
        { data: ordersData },
        { data: storesData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('stores').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('orders').select(`id, total_price, status, created_at, users ( name ), stores ( store_name )`).order('created_at', { ascending: false }),
        supabase.from('stores').select('id, store_name, address, logo_url, created_at, users(name)').eq('is_verified', false)
      ])

      const orders = ordersData || []
      setAllOrders(orders)
      const completedOrders = orders.filter(o => o.status === 'selesai')
      const totalRev = completedOrders.reduce((acc, o) => acc + o.total_price, 0)

      const currentMonth = new Date().getMonth()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const currentYear = new Date().getFullYear()
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

      const currentMonthRev = completedOrders.filter(o => new Date(o.created_at).getMonth() === currentMonth && new Date(o.created_at).getFullYear() === currentYear).reduce((acc, o) => acc + o.total_price, 0)
      const lastMonthRev = completedOrders.filter(o => new Date(o.created_at).getMonth() === lastMonth && new Date(o.created_at).getFullYear() === lastMonthYear).reduce((acc, o) => acc + o.total_price, 0)
      const revTrendVal = lastMonthRev === 0 ? 100 : ((currentMonthRev - lastMonthRev) / lastMonthRev) * 100

      const currentMonthOrders = orders.filter(o => new Date(o.created_at).getMonth() === currentMonth && new Date(o.created_at).getFullYear() === currentYear).length
      const lastMonthOrders = orders.filter(o => new Date(o.created_at).getMonth() === lastMonth && new Date(o.created_at).getFullYear() === lastMonthYear).length
      const orderTrendVal = lastMonthOrders === 0 ? 100 : ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100

      setStats({
        revenue: totalRev,
        orders: orders.length,
        stores: storesCount || 0,
        users: usersCount || 0,
        revTrend: revTrendVal,
        orderTrend: orderTrendVal
      })
      setRecentOrders(orders.slice(0, 5))
      setPendingStores(storesData || [])

      generateChartData(orders, currentYear)
    } catch (error: any) {
      toast.error('Gagal memuat dashboard: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const generateChartData = (orders: any[], year: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const groupedChart: Record<string, number> = {}
    for (let i = 0; i < 12; i++) groupedChart[months[i]] = 0

    orders.filter(o => o.status === 'selesai').forEach(o => {
      const d = new Date(o.created_at)
      if (d.getFullYear() === year) {
        groupedChart[months[d.getMonth()]] += o.total_price
      }
    })

    const currentMonthIndex = year === new Date().getFullYear() ? new Date().getMonth() : 11
    const finalChartData = months.slice(0, currentMonthIndex + 1).map(m => ({
      month: m,
      value: groupedChart[m]
    }))

    setChartData(finalChartData)
  }

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    generateChartData(allOrders, year)
  }

  const handleVerify = (storeId: string, storeName: string, action: 'approve' | 'reject') => setVerifyModal({ storeId, storeName, action })

  const confirmVerify = async () => {
    if (!verifyModal) return
    const isApproving = verifyModal.action === 'approve'
    try {
      if (isApproving) {
        const { error } = await supabase.from('stores').update({ is_verified: true }).eq('id', verifyModal.storeId)
        if (error) throw error
        toast.success(`${verifyModal.storeName} berhasil diverifikasi!`)
      } else {
        const { error } = await supabase.from('stores').delete().eq('id', verifyModal.storeId)
        if (error) throw error
        toast.success(`${verifyModal.storeName} ditolak.`)
      }
      setPendingStores(prev => prev.filter(s => s.id !== verifyModal.storeId))
    } catch (error: any) {
      toast.error('Verifikasi gagal: ' + error.message)
    } finally {
      setVerifyModal(null)
    }
  }

  const orderStatusData = [
    { name: 'Selesai', value: recentOrders.filter(o => o.status === 'selesai').length, color: '#0F766E' },
    { name: 'Diproses', value: recentOrders.filter(o => o.status === 'diproses').length, color: '#FF8A00' },
    { name: 'Pending', value: recentOrders.filter(o => o.status === 'pending').length, color: '#EAB308' },
    { name: 'Dibatalkan', value: recentOrders.filter(o => o.status === 'dibatalkan').length, color: '#EF4444' },
  ].filter(d => d.value > 0)

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <Loader2 className="size-10 animate-spin text-[#0F766E] mb-4" />
      <p className="text-[#6A7686] font-medium text-lg">Memuat Dashboard...</p>
    </div>
  )

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatCard icon={Wallet} label="Total Revenue" value={`Rp ${stats.revenue.toLocaleString('id-ID')}`} trend={`${stats.revTrend > 0 ? '+' : ''}${stats.revTrend.toFixed(1)}%`} trendPositive={stats.revTrend >= 0} iconBg="bg-[#0F766E]/10" iconColor="text-[#0F766E]" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.orders} trend={`${stats.orderTrend > 0 ? '+' : ''}${stats.orderTrend.toFixed(1)}%`} trendPositive={stats.orderTrend >= 0} iconBg="bg-[#FF8A00]/10" iconColor="text-[#FF8A00]" />
        <StatCard icon={Store} label="Active Stores" value={stats.stores} trend="Realtime" trendPositive iconBg="bg-sky-50" iconColor="text-sky-700" />
        <StatCard icon={Users} label="Total Users" value={stats.users} trend="Realtime" trendPositive iconBg="bg-purple-50" iconColor="text-purple-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="lg:col-span-2 flex flex-col rounded-3xl ring-1 ring-[#E5E7EB] p-6 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-lg">Revenue Overview</h3>
              <p className="text-sm text-[#6A7686]">Monthly revenue performance</p>
            </div>
            <select
              value={selectedYear}
              onChange={e => handleYearChange(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl bg-[#F3F6F8] text-sm font-medium outline-none focus:ring-2 focus:ring-[#0F766E] cursor-pointer border-0"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F6F8" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6A7686', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6A7686', fontSize: 12 }} tickFormatter={v => `${v / 1000}k`} dx={-5} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={3} dot={{ fill: '#fff', stroke: '#0F766E', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#0F766E' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col rounded-3xl ring-1 ring-[#E5E7EB] p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Order Status</h3>
          </div>
          <div className="relative h-[220px] flex items-center justify-center mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} dataKey="value" paddingAngle={3}>
                  {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} Orders`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold">{stats.orders}</span>
              <span className="text-xs text-[#6A7686]">Total Orders</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-auto">
            {orderStatusData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: item.color }} /><span className="font-medium text-[#6A7686]">{item.name}</span></div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="xl:col-span-2 flex flex-col rounded-3xl ring-1 ring-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 border-b border-[#E5E7EB]">
            <div><h3 className="font-bold text-lg">Recent Orders</h3><p className="text-sm text-[#6A7686]">Latest transactions</p></div>
            <button onClick={() => router.push('/admin/orders')} className="text-sm font-semibold text-[#0F766E] hover:underline">Lihat Semua</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-cream-bg">
                <tr>
                  {['Customer', 'Store', 'Amount', 'Status', 'Action'].map((h, i) => <th key={h} className={`px-6 py-4 text-xs font-bold text-[#6A7686] uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {recentOrders.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-[#6A7686]">Belum ada pesanan</td></tr> : recentOrders.map((order, idx) => (
                  <tr key={order.id} className="hover:bg-[#F3F6F8]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                          {order.users?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div><p className="font-semibold text-sm">{order.users?.name}</p><p className="text-xs text-[#6A7686]">ORD-{order.id.substring(0, 4).toUpperCase()}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><p className="font-medium text-sm">{order.stores?.store_name}</p></td>
                    <td className="px-6 py-4"><p className="font-bold text-sm">Rp {order.total_price.toLocaleString('id-ID')}</p></td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>{order.status}</span></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setOrderModal(order)} className="size-8 inline-flex items-center justify-center rounded-lg ring-1 ring-[#E5E7EB] bg-white hover:ring-[#0F766E] hover:text-[#0F766E] transition-all cursor-pointer"><Eye className="size-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col rounded-3xl ring-1 ring-[#E5E7EB] bg-white shadow-sm overflow-hidden h-[500px]">
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
            <div><h3 className="font-bold text-lg">Pending Stores</h3><p className="text-sm text-[#6A7686]">Requires verification</p></div>
            <span className="size-8 rounded-full bg-[#FF8A00]/10 text-[#FF8A00] font-bold flex items-center justify-center text-sm">{pendingStores.length}</span>
          </div>
          <div className="flex flex-col p-2 flex-1 overflow-y-auto">
            {pendingStores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3"><CheckCircle className="size-7 text-emerald-600" /></div>
                <p className="font-bold text-sm">Semua toko diverifikasi!</p>
              </div>
            ) : pendingStores.map((store, i) => (
              <div key={store.id} className={`flex flex-col gap-3 p-4 rounded-2xl hover:bg-[#F8FAFC] transition-all ${i > 0 ? 'border-t border-[#E5E7EB]/50' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="relative size-12 rounded-xl bg-[#0F766E]/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {store.logo_url ? (
                      <Image src={store.logo_url} alt={store.store_name} fill className="object-cover" />
                    ) : (
                      <StoreIcon className="size-6 text-[#0F766E]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{store.store_name}</h4>
                    <p className="text-xs text-[#6A7686] truncate mb-1">Owner: {store.users?.name}</p>
                    <div className="flex items-center gap-1 text-[10px] text-[#6A7686]"><MapPin className="size-3" /> {store.address?.split(',')[0]}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleVerify(store.id, store.store_name, 'approve')} className="flex-1 py-2 bg-[#0F766E]/10 text-[#0F766E] rounded-xl text-xs font-bold hover:bg-[#0F766E] hover:text-white transition-all">Approve</button>
                  <button onClick={() => handleVerify(store.id, store.store_name, 'reject')} className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {verifyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${verifyModal.action === 'approve' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {verifyModal.action === 'approve' ? <CheckCircle className="w-8 h-8 text-emerald-600" /> : <XCircle className="w-8 h-8 text-red-500" />}
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">{verifyModal.action === 'approve' ? 'Approve Store' : 'Reject Store'}</h3>
            <p className="text-[#6A7686] text-sm mb-6 text-center">{verifyModal.action === 'approve' ? <>Approve <strong className="text-dark">{verifyModal.storeName}</strong>?</> : <>Tolak dan hapus <strong className="text-dark">{verifyModal.storeName}</strong>?</>}</p>
            <div className="flex gap-3">
              <button onClick={() => setVerifyModal(null)} className="flex-1 px-4 py-3 rounded-full ring-1 ring-[#E5E7EB] font-bold hover:bg-[#F3F6F8] transition-all">Cancel</button>
              <button onClick={confirmVerify} className={`flex-1 px-4 py-3 rounded-full font-bold text-white transition-all ${verifyModal.action === 'approve' ? 'bg-emerald-500' : 'bg-red-500'}`}>{verifyModal.action === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}</button>
            </div>
          </div>
        </div>
      )}

      {orderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOrderModal(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Detail Pesanan</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#6A7686]">ID</span><span className="font-semibold">ORD-{orderModal.id.substring(0, 6).toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-[#6A7686]">Customer</span><span className="font-semibold">{orderModal.users?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#6A7686]">Toko</span><span className="font-semibold">{orderModal.stores?.store_name}</span></div>
              <div className="flex justify-between"><span className="text-[#6A7686]">Total</span><span className="font-bold text-[#0F766E]">Rp {orderModal.total_price.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span className="text-[#6A7686]">Status</span><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_STYLES[orderModal.status] || STATUS_STYLES.pending}`}>{orderModal.status}</span></div>
              <div className="flex justify-between"><span className="text-[#6A7686]">Tanggal</span><span className="font-semibold">{new Date(orderModal.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
            </div>
            <button onClick={() => setOrderModal(null)} className="w-full mt-6 py-3 rounded-full bg-[#0F766E] text-white font-bold hover:bg-[#0F766E]/90 transition-all">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}
