'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, Filter, Loader2, MapPin, X, CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

const STATUS_STYLES: Record<string, string> = {
  selesai: 'bg-emerald-50 text-emerald-700',
  diproses: 'bg-orange-50 text-orange-700',
  dibatalkan: 'bg-red-50 text-red-700',
  pending: 'bg-yellow-50 text-yellow-700',
  siap_diambil: 'bg-blue-50 text-blue-700',
}

const STATUS_OPTIONS = ['semua', 'pending', 'diproses', 'siap_diambil', 'selesai', 'dibatalkan']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [showFilter, setShowFilter] = useState(false)
  const [orderModal, setOrderModal] = useState<any>(null)

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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
      if (orderModal?.id === id) setOrderModal({ ...orderModal, status: newStatus })
      toast.success(`Status pesanan diubah ke ${newStatus}`)
    } catch (error: any) {
      toast.error('Gagal mengubah status: ' + error.message)
    }
  }

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.stores?.store_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'semua' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const getNextStatuses = (current: string) => {
    const flow: Record<string, string[]> = {
      pending: ['diproses', 'dibatalkan'],
      diproses: ['siap_diambil', 'dibatalkan'],
      siap_diambil: ['selesai', 'dibatalkan'],
      selesai: [],
      dibatalkan: [],
    }
    return flow[current] || []
  }

  const countByStatus = (status: string) =>
    status === 'semua' ? orders.length : orders.filter(o => o.status === status).length

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
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl ring-1 ring-[#E5E7EB] text-sm font-semibold text-[#6A7686] shadow-sm hover:text-dark"
          >
            <Filter className="size-4" /> {statusFilter === 'semua' ? 'Filter' : statusFilter} <ChevronDown className="size-3.5" />
          </button>
          {showFilter && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl ring-1 ring-[#E5E7EB] shadow-xl z-10 py-2 overflow-hidden">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setShowFilter(false) }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-[#F3F6F8] flex items-center justify-between transition-all ${
                    statusFilter === s ? 'text-[#0F766E]' : 'text-[#6A7686]'
                  }`}
                >
                  {s === 'semua' ? 'Semua' : s.replace('_', ' ')}
                  <span className="text-xs bg-[#F3F6F8] px-2 py-0.5 rounded-full">{countByStatus(s)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl ring-1 ring-[#E5E7EB] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-cream-bg">
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
                  <td className="px-6 py-4"><span className="font-bold text-sm">ORD-{order.id.substring(0, 6).toUpperCase()}</span></td>
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
                    <button
                      onClick={() => setOrderModal(order)}
                      className="size-8 inline-flex items-center justify-center rounded-xl ring-1 ring-[#E5E7EB] bg-white hover:ring-[#0F766E] hover:text-[#0F766E] transition-all"
                    >
                      <Eye className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {orderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOrderModal(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Detail Pesanan</h3>
              <button onClick={() => setOrderModal(null)} className="size-8 flex items-center justify-center rounded-lg hover:bg-[#F3F6F8] transition-all">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between pb-3 border-b border-[#E5E7EB]">
                <span className="text-[#6A7686]">ID Pesanan</span>
                <span className="font-bold">ORD-{orderModal.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#E5E7EB]">
                <span className="text-[#6A7686]">Customer</span>
                <span className="font-semibold">{orderModal.users?.name}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#E5E7EB]">
                <span className="text-[#6A7686]">Email</span>
                <span className="font-semibold">{orderModal.users?.email}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#E5E7EB]">
                <span className="text-[#6A7686]">Toko</span>
                <span className="font-semibold">{orderModal.stores?.store_name}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#E5E7EB]">
                <span className="text-[#6A7686]">Alamat Toko</span>
                <span className="font-semibold text-right max-w-[200px]">{orderModal.stores?.address}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#E5E7EB]">
                <span className="text-[#6A7686]">Metode Bayar</span>
                <span className="font-semibold capitalize">{orderModal.payment_method?.replace('_', ' ') || '-'}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#E5E7EB]">
                <span className="text-[#6A7686]">Total</span>
                <span className="font-bold text-lg text-[#0F766E]">Rp {orderModal.total_price.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#E5E7EB]">
                <span className="text-[#6A7686]">Tanggal</span>
                <span className="font-semibold">{new Date(orderModal.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6A7686]">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLES[orderModal.status] || STATUS_STYLES.pending}`}>
                  {orderModal.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {getNextStatuses(orderModal.status).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#6A7686] uppercase mb-3 tracking-wider">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {getNextStatuses(orderModal.status).map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(orderModal.id, status)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        status === 'dibatalkan'
                          ? 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white'
                          : 'bg-[#0F766E]/10 text-[#0F766E] hover:bg-[#0F766E] hover:text-white'
                      }`}
                    >
                      {status === 'dibatalkan' ? <XCircle className="size-4" /> : <CheckCircle className="size-4" />}
                      {status === 'siap_diambil' ? 'Siap Diambil' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
