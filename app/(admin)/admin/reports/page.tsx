'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, TrendingUp, ShoppingBag, Store, Users, Download, Loader2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface TopStore {
  name: string
  orders: number
  revenue: number
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="flex flex-col rounded-3xl ring-1 ring-[#E5E7EB] p-6 gap-3 bg-white shadow-sm">
      <div className={`size-12 rounded-2xl flex items-center justify-center`} style={{ background: color + '1A' }}>
        <Icon className="size-6" style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-[#6A7686] font-medium">{label}</p>
        <p className="font-bold text-2xl mt-0.5">{value}</p>
        <p className="text-xs text-[#6A7686] mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#080C1A] text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-xl">
      <p className="text-[#6A7686] text-xs mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.name === 'Revenue' ? 'Rp ' + p.value.toLocaleString('id-ID') : p.value}</p>
      ))}
    </div>
  )
}

export default function AdminReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ revenue: 0, orders: 0, stores: 0, users: 0 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chartData, setChartData] = useState<any[]>([])
  const [topStores, setTopStores] = useState<TopStore[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      // Fetch aggregate stats
      const [
        { count: usersCount },
        { count: storesCount },
        { data: storesData },
        { data: ordersData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('stores').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('stores').select('id, store_name, created_at'),
        supabase.from('orders').select(`total_price, created_at, status, store_id, stores(store_name)`)
      ])

      const ordersDataArr: any[] = ordersData || []
      const completedOrders: any[] = []
      const totalRev = ordersDataArr.reduce((acc, o) => {
        if (o.status === 'selesai') {
          completedOrders.push(o)
          return acc + o.total_price
        }
        return acc
      }, 0)
      
      // Set stats now
      setStats({
        revenue: totalRev,
        orders: ordersDataArr.length,
        stores: storesCount || 0,
        users: usersCount || 0
      })

      // Group by Month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const groupedData: Record<string, { month: string, revenue: number, orders: number, stores: number }> = {}
      
      // Initialize months for current year
      const currentYear = new Date().getFullYear()
      for(let i=0; i < 12; i++) {
        groupedData[months[i]] = { month: months[i], revenue: 0, orders: 0, stores: 0 }
      }

      ;(completedOrders as any[]).forEach((o: any) => {
        const d = new Date(o.created_at)
        if (d.getFullYear() === currentYear) {
          groupedData[months[d.getMonth()]].revenue += o.total_price
          groupedData[months[d.getMonth()]].orders += 1
        }
      })

      ;(storesData || []).forEach((s: any) => {
        const d = new Date(s.created_at)
        if (d.getFullYear() === currentYear) {
          groupedData[months[d.getMonth()]].stores += 1
        }
      })

      setChartData(Object.values(groupedData).filter(g => g.revenue > 0 || g.orders > 0 || g.stores > 0 || g.month === months[new Date().getMonth()]))

      // Calculate Top Stores
      const storeStats: Record<string, TopStore> = {}
      ;(completedOrders as any[]).forEach((o: any) => {
        const sName = o.stores?.store_name || 'Unknown'
        if (!storeStats[sName]) {
          storeStats[sName] = { name: sName, orders: 0, revenue: 0 }
        }
        storeStats[sName].orders += 1
        storeStats[sName].revenue += o.total_price
      })

      const sortedStores = Object.values(storeStats).sort((a, b) => b.orders - a.orders).slice(0, 5)
      setTopStores(sortedStores)

    } catch (error: any) {
      toast.error('Gagal memuat analitik: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const exportXLSX = () => {
    try {
      const wb = XLSX.utils.book_new()

      // Sheet 1: Ringkasan
      const summaryData = [
        ['Metrik', 'Nilai'],
        ['Total Revenue', `Rp ${stats.revenue.toLocaleString('id-ID')}`],
        ['Total Orders', stats.orders],
        ['Toko Aktif', stats.stores],
        ['Total Users', stats.users],
      ]
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan')

      // Sheet 2: Revenue & Order per Bulan
      const monthlyData = [
        ['Bulan', 'Revenue (Rp)', 'Orders', 'Toko Baru'],
        ...chartData.map((d: { month: string; revenue: number; orders: number; stores: number }) => [
          d.month, d.revenue, d.orders, d.stores
        ]),
      ]
      const ws2 = XLSX.utils.aoa_to_sheet(monthlyData)
      XLSX.utils.book_append_sheet(wb, ws2, 'Per Bulan')

      // Sheet 3: Top Stores
      const storesData = [
        ['Peringkat', 'Nama Toko', 'Orders', 'Revenue (Rp)'],
        ...topStores.map((s, i) => [i + 1, s.name, s.orders, s.revenue]),
      ]
      const ws3 = XLSX.utils.aoa_to_sheet(storesData)
      XLSX.utils.book_append_sheet(wb, ws3, 'Top Toko')

      XLSX.writeFile(wb, `SisaRasa-Laporan-${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Laporan berhasil di-export ke XLSX!')
    } catch (error: any) {
      toast.error('Gagal export: ' + error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="size-10 animate-spin text-[#0F766E] mb-4" />
        <p className="text-[#6A7686] font-medium text-lg">Menganalisis Data Laporan...</p>
      </div>
    )
  }

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bold text-2xl">Laporan & Analitik</h1>
          <p className="text-sm text-[#6A7686] mt-0.5">Ringkasan performa platform SisaRasa</p>
        </div>
        <button onClick={exportXLSX} className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#0F766E] rounded-full font-semibold text-sm ring-1 ring-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-all self-start">
          <Download className="size-4" /> Export XLSX
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} label="Total Revenue" value={`Rp ${stats.revenue.toLocaleString('id-ID')}`} sub="Tahun ini" color="#0F766E" />
        <StatCard icon={ShoppingBag} label="Total Order" value={stats.orders.toString()} sub="Tahun ini" color="#FF8A00" />
        <StatCard icon={Store} label="Toko Aktif" value={stats.stores.toString()} sub="Verified" color="#0EA5E9" />
        <StatCard icon={Users} label="Total User" value={stats.users.toString()} sub="Semua role" color="#EF4444" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-3xl ring-1 ring-[#E5E7EB] bg-white p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-1">Revenue & Order Trend</h3>
          <p className="text-sm text-[#6A7686] mb-5">Performa bulanan</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F6F8" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6A7686', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6A7686', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#0F766E" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="orders" name="Orders" stroke="#FF8A00" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl ring-1 ring-[#E5E7EB] bg-white p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-1">Pertumbuhan Toko</h3>
          <p className="text-sm text-[#6A7686] mb-5">Jumlah toko terdaftar per bulan</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F6F8" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6A7686', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6A7686', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="stores" name="Toko" fill="#0F766E" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Stores */}
      <div className="rounded-3xl ring-1 ring-[#E5E7EB] bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h3 className="font-bold text-lg">Top 5 Toko Terlaris</h3>
          <p className="text-sm text-[#6A7686]">Berdasarkan total pesanan sukses</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {topStores.length === 0 ? (
            <div className="text-center text-[#6A7686] py-4">Belum ada data toko terlaris</div>
          ) : topStores.map((store, i) => (
            <div key={store.name} className="flex items-center gap-4">
              <span className={`size-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-[#0F766E]/10 text-[#0F766E]' : 'bg-[#F3F6F8] text-[#6A7686]'
              }`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm truncate">{store.name}</span>
                  <span className="text-sm font-bold text-[#0F766E] shrink-0 ml-2">Rp {store.revenue.toLocaleString('id-ID')}</span>
                </div>
                <div className="h-2 bg-[#F3F6F8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0F766E] rounded-full transition-all"
                    style={{ width: `${(store.orders / topStores[0].orders) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[#6A7686] mt-1">{store.orders} order</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
