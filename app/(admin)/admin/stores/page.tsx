'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, CheckCircle, XCircle, Eye, MapPin, Clock, Store as StoreIcon, Loader2, X, Mail, Clock3, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

type StoreStatus = 'pending' | 'approved' | 'rejected'

interface StoreItem {
  id: string
  name: string
  owner: string
  owner_email: string
  address: string
  description: string | null
  city: string
  status: StoreStatus
  rejection_reason: string | null
  joinedAt: string
  open_time: string | null
  close_time: string | null
  products: number
  orders: number
  logo_url: string | null
  banner_url: string | null
}

const STATUS_CONFIG: Record<StoreStatus, { label: string; cls: string }> = {
  pending:  { label: 'Pending',  cls: 'bg-orange-50 text-orange-700' },
  approved: { label: 'Aktif',    cls: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Ditolak',  cls: 'bg-red-50 text-red-700' },
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | StoreStatus>('all')
  const [confirmModal, setConfirmModal] = useState<{ id: string; name: string; action: 'approve' | 'reject' } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [detailStore, setDetailStore] = useState<StoreItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const supabase = createClient()

  useEffect(() => { fetchStores() }, [])

  const fetchStores = async () => {
    setIsLoading(true)
    try {
      const { data: storesData, error } = await supabase
        .from('stores')
        .select('id, store_name, description, address, is_verified, verification_status, rejection_reason, created_at, logo_url, banner_url, open_time, close_time, users ( name, email )')
        .order('created_at', { ascending: false })
      if (error) throw error

      const { data: productsData } = await supabase.from('products').select('store_id')
      const { data: ordersData } = await supabase.from('orders').select('store_id')

      const formattedStores: StoreItem[] = (storesData || []).map(s => {
        const user = (s as any).users || {}
        const verificationStatus = (s.verification_status as StoreStatus) || (s.is_verified ? 'approved' : 'pending')

        return {
          id: s.id,
          name: s.store_name,
          owner: user.name || 'Unknown',
          owner_email: user.email || '-',
          address: s.address,
          description: s.description,
          city: s.address?.split(',')[0] || s.address || '-',
          status: verificationStatus,
          rejection_reason: s.rejection_reason,
          joinedAt: new Date(s.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
          open_time: s.open_time,
          close_time: s.close_time,
          products: productsData?.filter(p => p.store_id === s.id).length || 0,
          orders: ordersData?.filter(o => o.store_id === s.id).length || 0,
          logo_url: s.logo_url,
          banner_url: s.banner_url,
        }
      })
      setStores(formattedStores)
    } catch (error: any) {
      toast.error('Gagal memuat data toko: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const confirmAction = async () => {
    if (!confirmModal) return
    setIsProcessing(true)

    try {
      if (confirmModal.action === 'approve') {
        const { error } = await supabase
          .from('stores')
          .update({ is_verified: true, verification_status: 'approved', rejection_reason: null })
          .eq('id', confirmModal.id)
        if (error) throw error
        toast.success(`${confirmModal.name} berhasil diverifikasi!`)
      } else {
        if (!rejectReason.trim()) {
          toast.error('Harap isi alasan penolakan')
          setIsProcessing(false)
          return
        }
        const { error } = await supabase
          .from('stores')
          .update({ is_verified: false, verification_status: 'rejected', rejection_reason: rejectReason.trim() })
          .eq('id', confirmModal.id)
        if (error) throw error
        toast.success(`${confirmModal.name} telah ditolak.`)
      }

      fetchStores()
      setConfirmModal(null)
      setRejectReason('')
    } catch (error: any) {
      toast.error('Gagal: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const openApprove = (store: StoreItem) => {
    setConfirmModal({ id: store.id, name: store.name, action: 'approve' })
    setRejectReason('')
  }

  const openReject = (store: StoreItem) => {
    setConfirmModal({ id: store.id, name: store.name, action: 'reject' })
    setRejectReason('')
  }

  const openDetail = async (store: StoreItem) => {
    setDetailStore(store)
  }

  const filtered = stores.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.owner.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
    const matchTab = activeTab === 'all' || s.status === activeTab
    return matchSearch && matchTab
  })

  const counts = {
    all: stores.length,
    pending: stores.filter(s => s.status === 'pending').length,
    approved: stores.filter(s => s.status === 'approved').length,
    rejected: stores.filter(s => s.status === 'rejected').length,
  }

  const TABS = [
    { key: 'all', label: 'Semua' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Aktif' },
    { key: 'rejected', label: 'Ditolak' },
  ] as const

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bold text-2xl">Manajemen Toko</h1>
          <p className="text-sm text-[#6A7686] mt-0.5">Kelola dan verifikasi toko mitra SisaRasa</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-1 bg-white rounded-2xl p-1.5 ring-1 ring-[#E5E7EB] shadow-sm overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#0F766E] text-white'
                  : 'text-[#6A7686] hover:bg-[#F3F6F8]'
              }`}
            >
              {tab.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-[#F3F6F8]'
              }`}>
                {counts[tab.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
          <input
            type="text"
            placeholder="Cari nama toko, owner, kota..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl ring-1 ring-[#E5E7EB] text-sm outline-none focus:ring-[#0F766E] transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="rounded-3xl ring-1 ring-[#E5E7EB] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-cream-bg">
              <tr>
                {['Toko', 'Lokasi', 'Status', 'Produk / Order', 'Bergabung', 'Aksi'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-[#6A7686] uppercase ${i === 5 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="size-8 animate-spin text-[#0F766E] mx-auto mb-3" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[#6A7686]">
                    <StoreIcon className="size-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">Tidak ada toko ditemukan</p>
                  </td>
                </tr>
              ) : (
                filtered.map(store => (
                  <tr key={store.id} className="hover:bg-[#F3F6F8]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 rounded-2xl bg-[#0F766E]/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {store.logo_url ? (
                            <Image src={store.logo_url} alt={store.name} fill className="object-cover" />
                          ) : (
                            <StoreIcon className="size-5 text-[#0F766E]" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{store.name}</p>
                          <p className="text-xs text-[#6A7686]">{store.owner}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-[#6A7686]">
                        <MapPin className="size-3.5 text-[#0F766E] shrink-0" />
                        <span className="truncate max-w-[140px]">{store.city}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[store.status]?.cls || 'bg-gray-50 text-gray-700'}`}>
                          {STATUS_CONFIG[store.status]?.label || store.status}
                        </span>
                        {store.status === 'rejected' && store.rejection_reason && (
                          <span className="text-xs text-red-500 max-w-[160px] truncate" title={store.rejection_reason}>
                            {store.rejection_reason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6A7686]">
                      <span className="font-bold text-dark">{store.products}</span> produk /{' '}
                      <span className="font-bold text-dark">{store.orders}</span> order
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#6A7686]">
                        <Clock className="size-3.5" />
                        {store.joinedAt}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(store)}
                          className="size-9 inline-flex items-center justify-center rounded-xl ring-1 ring-[#E5E7EB] hover:ring-[#0F766E] hover:text-[#0F766E] hover:bg-[#0F766E]/5 transition-all"
                          title="Detail Toko"
                        >
                          <Eye className="size-4" />
                        </button>
                        {store.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openApprove(store)}
                              className="size-9 inline-flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                              title="Setujui Toko"
                            >
                              <CheckCircle className="size-4" />
                            </button>
                            <button
                              onClick={() => openReject(store)}
                              className="size-9 inline-flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                              title="Tolak Toko"
                            >
                              <XCircle className="size-4" />
                            </button>
                          </>
                        )}
                        {store.status === 'rejected' && (
                          <button
                            onClick={() => openApprove(store)}
                            className="size-9 inline-flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                            title="Setujui Ulang"
                          >
                            <CheckCircle className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailStore && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setDetailStore(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {detailStore.banner_url ? (
              <div className="relative h-36 rounded-t-3xl overflow-hidden">
                <Image src={detailStore.banner_url} alt="" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            ) : (
              <div className="h-24 bg-gradient-to-r from-[#0F766E]/20 to-[#14B8A6]/20 rounded-t-3xl" />
            )}

            <div className={`relative px-6 ${detailStore.banner_url ? '-mt-12' : '-mt-8'}`}>
              <div className="relative size-20 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden ring-4 ring-white mb-3">
                {detailStore.logo_url ? (
                  <Image src={detailStore.logo_url} alt={detailStore.name} fill className="object-cover" />
                ) : (
                  <StoreIcon className="size-8 text-[#0F766E]" />
                )}
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">{detailStore.name}</h2>
                  <p className="text-sm text-[#6A7686]">{detailStore.owner}</p>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold shrink-0 ${STATUS_CONFIG[detailStore.status]?.cls}`}>
                  {STATUS_CONFIG[detailStore.status]?.label}
                </span>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="size-4 text-[#0F766E] mt-0.5 shrink-0" />
                  <span className="text-[#6A7686]">{detailStore.address}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="size-4 text-[#0F766E] shrink-0" />
                  <span className="text-[#6A7686]">{detailStore.owner_email}</span>
                </div>
                {detailStore.open_time && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Clock3 className="size-4 text-[#0F766E] shrink-0" />
                    <span className="text-[#6A7686]">
                      {detailStore.open_time} - {detailStore.close_time || 'Selesai'}
                    </span>
                  </div>
                )}
                {detailStore.description && (
                  <div className="flex items-start gap-2.5 text-sm">
                    <span className="text-base mt-0.5 shrink-0">📝</span>
                    <span className="text-[#6A7686]">{detailStore.description}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mb-5">
                <div className="flex-1 bg-[#F3F6F8] rounded-xl px-4 py-3 text-center">
                  <p className="text-lg font-bold text-dark">{detailStore.products}</p>
                  <p className="text-xs text-[#6A7686]">Produk</p>
                </div>
                <div className="flex-1 bg-[#F3F6F8] rounded-xl px-4 py-3 text-center">
                  <p className="text-lg font-bold text-dark">{detailStore.orders}</p>
                  <p className="text-xs text-[#6A7686]">Order</p>
                </div>
                <div className="flex-1 bg-[#F3F6F8] rounded-xl px-4 py-3 text-center">
                  <p className="text-lg font-bold text-dark">{detailStore.joinedAt}</p>
                  <p className="text-xs text-[#6A7686]">Bergabung</p>
                </div>
              </div>

              {detailStore.status === 'rejected' && detailStore.rejection_reason && (
                <div className="bg-red-50 rounded-xl p-4 mb-4 flex items-start gap-3">
                  <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Alasan Ditolak</p>
                    <p className="text-sm text-red-600">{detailStore.rejection_reason}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {detailStore.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { setDetailStore(null); openApprove(detailStore) }}
                      className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all"
                    >
                      Setujui Toko
                    </button>
                    <button
                      onClick={() => { setDetailStore(null); openReject(detailStore) }}
                      className="flex-1 px-4 py-3 rounded-xl ring-1 ring-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-all"
                    >
                      Tolak
                    </button>
                  </>
                )}
                <button
                  onClick={() => setDetailStore(null)}
                  className={`px-4 py-3 rounded-xl ring-1 ring-[#E5E7EB] font-bold text-sm hover:bg-[#F3F6F8] transition-all ${detailStore.status === 'pending' ? '' : 'w-full'}`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Approve/Reject Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => { setConfirmModal(null); setRejectReason('') }}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className={`mx-auto size-14 rounded-2xl flex items-center justify-center mb-3 ${
                confirmModal.action === 'approve' ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                {confirmModal.action === 'approve' ? (
                  <CheckCircle className="size-7 text-emerald-600" />
                ) : (
                  <XCircle className="size-7 text-red-500" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-1">
                {confirmModal.action === 'approve' ? 'Setujui Toko' : 'Tolak Toko'}
              </h3>
              <p className="text-[#6A7686] text-sm">
                {confirmModal.action === 'approve'
                  ? `Toko "${confirmModal.name}" akan aktif dan dapat menjual produk.`
                  : `Toko "${confirmModal.name}" akan ditolak dan tidak dapat mengakses platform.`
                }
              </p>
            </div>

            {confirmModal.action === 'reject' && (
              <div className="mb-5">
                <label className="text-sm font-bold text-[#6A7686] mb-1.5 block">Alasan Penolakan *</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Masukkan alasan mengapa toko ini ditolak..."
                  className="w-full px-4 py-3 rounded-xl ring-1 ring-[#E5E7EB] text-sm outline-none focus:ring-red-400 transition-all resize-none h-24"
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmModal(null); setRejectReason('') }}
                className="flex-1 px-4 py-3 rounded-full ring-1 ring-[#E5E7EB] font-bold text-sm hover:bg-[#F3F6F8] transition-all"
                disabled={isProcessing}
              >
                Batal
              </button>
              <button
                onClick={confirmAction}
                disabled={isProcessing || (confirmModal.action === 'reject' && !rejectReason.trim())}
                className={`flex-1 px-4 py-3 rounded-full font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${
                  confirmModal.action === 'approve'
                    ? 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300'
                    : 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
                } disabled:cursor-not-allowed`}
              >
                {isProcessing && <Loader2 className="size-4 animate-spin" />}
                {confirmModal.action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
