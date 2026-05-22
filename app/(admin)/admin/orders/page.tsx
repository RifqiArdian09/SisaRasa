'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, Filter, Loader2, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

const STATUS_STYLES: Record<string, string> = {
  selesai: 'bg-emerald-50 text-emerald-700',
  diproses: 'bg-orange-50 text-orange-700',
  dibatalkan: 'bg-red-50 text-red-700',
  pending: 'bg-yellow-50 text-yellow-700',
  siap_diambil: 'bg-blue-50 text-blue-700',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const supabase = createClient()

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, total_price, payment_method, status, created_at,
          users!customer_id ( name, email ),
          stores!store_id ( store_name, address )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      toast.error('Gagal mengambil data pesanan: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    o.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.stores?.store_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bold text-2xl">Manajemen Pesanan</h1>
          <p className="text-sm text-[#6A7686] mt-0.5">Pantau semua pesanan masuk di SisaRasa</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
          <input type="text" placeholder="Cari ID Pesanan, Customer, atau Toko..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl ring-1 ring-[#E5E7EB] text-sm outline-none focus:ring-[#0F766E] shadow-sm" />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl ring-1 ring-[#E5E7EB] text-sm font-semibold text-[#6A7686] shadow-sm"><Filter className="size-4" /> Filter</button>
      </div>

      <div className="rounded-3xl ring-1 ring-[#E5E7EB] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                {['ID Pesanan', 'Customer', 'Toko & Lokasi', 'Status', 'Total', 'Tanggal', 'Aksi'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-[#6A7686] uppercase tracking-wider ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center"><Loader2 className="size-8 animate-spin text-[#0F766E] mx-auto mb-3" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center font-medium text-[#6A7686]">Tidak ada pesanan.</td></tr>
              ) : filtered.map(order => (
                <tr key={order.id} className="hover:bg-[#F3F6F8]/50 transition-colors">
                  <td className="px-6 py-4"><span className="font-bold text-sm">ORD-{order.id.substring(0,6).toUpperCase()}</span></td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm">{order.users?.name}</p>
                    <p className="text-xs text-[#6A7686]">{order.users?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm">{order.stores?.store_name}</p>
                    <p className="text-xs text-[#6A7686] flex items-center gap-1"><MapPin className="size-3" /> {order.stores?.address?.split(',')[0]}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#0F766E] whitespace-nowrap">Rp {order.total_price.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-sm text-[#6A7686] whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="size-8 inline-flex items-center justify-center rounded-xl ring-1 ring-[#E5E7EB] bg-white hover:ring-[#0F766E] hover:text-[#0F766E] transition-all"><Eye className="size-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
