'use client'

import { useState, useEffect } from 'react'
import { Search, Star, Flag, CheckCircle, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700', 'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700', 'bg-pink-100 text-pink-700'
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`size-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-[#E5E7EB]'}`} />
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'flagged'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id, rating, comment, created_at,
          users!customer_id ( name ),
          products ( title, stores ( store_name ) )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formatted = (data || []).map((r: any, idx: number) => {
        const customerName = r.users?.name || 'Anonim'
        const initials = customerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        const isFlagged = r.rating <= 2
        return {
          id: r.id,
          customer: customerName,
          initials,
          color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          product: r.products?.title || 'Unknown Product',
          store: r.products?.stores?.store_name || 'Unknown Store',
          rating: r.rating,
          comment: r.comment || '',
          date: new Date(r.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
          flagged: isFlagged
        }
      })

      setReviews(formatted)
    } catch (error: any) {
      toast.error('Gagal mengambil ulasan: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = (id: string) => {
    setApprovedIds(prev => new Set(prev).add(id))
    toast.success('Review diabaikan')
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id)
      if (error) throw error
      setReviews(prev => prev.filter(r => r.id !== id))
      toast.success('Review berhasil dihapus')
    } catch (error: any) {
      toast.error('Gagal menghapus review: ' + error.message)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const filtered = reviews.filter(r => {
    const matchSearch = r.product.toLowerCase().includes(search.toLowerCase()) || r.customer.toLowerCase().includes(search.toLowerCase())
    const isFlagged = r.flagged && !approvedIds.has(r.id)
    return matchSearch && (filter === 'all' || isFlagged)
  })

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bold text-2xl">Moderasi Ulasan</h1>
          <p className="text-sm text-[#6A7686] mt-0.5">Pantau dan moderasi ulasan dari customer</p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-bold self-start">
          {reviews.filter(r => r.flagged && !approvedIds.has(r.id)).length} Perlu Perhatian
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 ring-1 ring-[#E5E7EB] shadow-sm">
          {[{ key: 'all', label: 'Semua' }, { key: 'flagged', label: 'Dilaporkan' }].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key as 'all' | 'flagged')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === t.key ? 'bg-[#0F766E] text-white' : 'text-[#6A7686] hover:bg-[#F3F6F8]'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
          <input type="text" placeholder="Cari ulasan berdasarkan produk/customer..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl ring-1 ring-[#E5E7EB] text-sm outline-none focus:ring-[#0F766E] shadow-sm" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm ring-1 ring-[#E5E7EB]">
            <Loader2 className="size-8 animate-spin text-[#0F766E] mb-4" />
            <p className="text-[#6A7686] font-medium">Memuat data ulasan...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl ring-1 ring-[#E5E7EB] bg-white p-16 text-center shadow-sm">
            <Star className="size-10 mx-auto mb-3 text-[#E5E7EB]" />
            <p className="font-semibold text-[#6A7686]">Tidak ada ulasan ditemukan</p>
          </div>
        ) : filtered.map(review => {
          const isFlagged = review.flagged && !approvedIds.has(review.id)
          return (
            <div key={review.id} className={`rounded-3xl ring-1 p-6 bg-white shadow-sm ${isFlagged ? 'ring-red-200 bg-red-50/30' : 'ring-[#E5E7EB]'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`size-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${review.color}`}>{review.initials}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm">{review.customer}</span>
                      <StarRating rating={review.rating} />
                      {isFlagged && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold"><Flag className="size-2.5" /> Rating Rendah</span>}
                    </div>
                    <p className="text-xs text-[#6A7686] mb-2"><strong>{review.product}</strong> · {review.store} · {review.date}</p>
                    <p className="text-sm leading-relaxed">&quot;{review.comment}&quot;</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isFlagged && (
                    <button onClick={() => handleApprove(review.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all">
                      <CheckCircle className="size-3.5" /> Abaikan
                    </button>
                  )}
                  <button onClick={() => setDeleteConfirm(review.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 className="size-3.5" /> Hapus
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">Hapus Review</h3>
            <p className="text-[#6A7686] text-sm mb-6 text-center">Apakah kamu yakin ingin menghapus review ini?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 rounded-full ring-1 ring-[#E5E7EB] font-bold hover:bg-[#F3F6F8] transition-all">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-3 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-all">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
