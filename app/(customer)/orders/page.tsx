'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, Clock, Package, CheckCircle, XCircle, Loader2, MessageCircle, Star, X, MapPin,  } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  quantity: number
  price: number
  products: { id: string; title: string; thumbnail_url: string }
}

interface Order {
  id: string
  total_price: number
  payment_method: string
  status: 'pending' | 'diproses' | 'siap_diambil' | 'selesai' | 'dibatalkan'
  created_at: string
  store_id: string
  stores: { store_name: string; logo_url: string; latitude: number; longitude: number }
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

interface ReviewModal {
  orderId: string
  productId: string
  productName: string
}

export default function CustomerOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('semua')
  const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set())
  const [reviewModal, setReviewModal] = useState<ReviewModal | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState('')

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, total_price, payment_method, status, created_at, store_id,
          stores ( store_name, logo_url, latitude, longitude ),
          order_items (
            id, quantity, price,
            products ( id, title, thumbnail_url )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data || []) as any)

      // Fetch already reviewed products by this user
      const { data: revs } = await supabase
        .from('reviews')
        .select('product_id')
        .eq('customer_id', user.id)
      if (revs) {
        setReviewedProducts(new Set(revs.map((r: any) => r.product_id)))
      }
    } catch {
      toast.error('Gagal memuat riwayat pesanan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('customer-orders-page-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const handleSubmitReview = async () => {
    if (!reviewModal || !userId) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        customer_id: userId,
        product_id: reviewModal.productId,
        rating,
        comment: comment.trim() || null,
      })
      if (error) throw error

      setReviewedProducts(prev => new Set([...prev, reviewModal.productId]))
      toast.success('Ulasan berhasil dikirim! Terima kasih 🌟')
      setReviewModal(null)
      setRating(5)
      setComment('')
    } catch {
      toast.error('Gagal mengirim ulasan.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = activeTab === 'semua' ? orders : orders.filter(o => o.status === activeTab)
  const formatPrice = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

  return (
    <div className="min-h-full bg-cream-bg">
      {/* Header */}
      <div className="bg-white px-5 pt-safe pb-4 sticky top-0 z-20 shadow-sm rounded-b-3xl">
        <div className="mt-4">
          <h1 className="font-poppins font-extrabold text-2xl text-dark">Pesanan Saya</h1>
          <p className="text-sm text-dark/50 mt-1 font-medium">Pantau status dan riwayat pesananmu</p>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`shrink-0 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === t.value
                  ? 'bg-[#0F766E] text-white shadow-md'
                  : 'bg-[#F3F6F8] text-[#6A7686] hover:bg-[#E5E7EB]'
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
            const isSelesai = order.status === 'selesai'

            // Products in this order that haven't been reviewed yet
            const unreviewedItems = (order.order_items || []).filter(
              item => !reviewedProducts.has((item.products as any)?.id)
            )

            return (
              <div key={order.id} className="bg-white rounded-3xl border border-dark/5 shadow-sm overflow-hidden hover:shadow-md transition-all">
                {/* Order Header */}
                <div className="px-5 py-4 border-b border-dark/5 flex items-center justify-between">
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
                <div className="px-5 py-4 space-y-2.5">
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

                {/* Review prompt - only for completed orders with unreviewed items */}
                {isSelesai && unreviewedItems.length > 0 && (
                  <div className="px-5 pb-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        Bagaimana pesananmu?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {unreviewedItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setReviewModal({
                              orderId: order.id,
                              productId: (item.products as any)?.id,
                              productName: (item.products as any)?.title || 'Produk',
                            })}
                            className="py-1.5 px-3 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all active:scale-95"
                          >
                            Nilai "{(item.products as any)?.title}"
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-5 py-4 border-t border-dark/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark/[0.02]">
                  <div>
                    <p className="text-xs text-dark/40 font-medium">Total Pembayaran</p>
                    <p className="text-base font-extrabold text-primary-orange font-poppins">{formatPrice(order.total_price)}</p>
                    <span className="text-[10px] font-bold text-primary-teal bg-primary-teal/10 px-2 py-1 rounded-lg uppercase inline-block mt-1">
                      {order.payment_method}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <Link
                      href={`/chat?store=${order.store_id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-white border border-dark/10 text-primary-teal text-xs font-bold shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" /> Hubungi Toko
                    </Link>
                    {(storeData?.latitude && storeData?.longitude) ? (
                      <a
                        href={`https://www.google.com/maps?q=${storeData.latitude},${storeData.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-white border border-dark/10 text-primary-orange text-xs font-bold shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                      >
                        <MapPin className="w-4 h-4" /> Lihat Google Maps
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          }))}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-5 animate-slide-up shadow-2xl pb-32">
            {/* Handle */}
            <div className="w-10 h-1 bg-dark/20 rounded-full mx-auto -mt-1" />

            <div className="flex items-center justify-between">
              <h3 className="font-poppins font-extrabold text-dark text-lg">Beri Ulasan</h3>
              <button onClick={() => { setReviewModal(null); setRating(5); setComment('') }}
                className="w-8 h-8 rounded-full bg-dark/5 flex items-center justify-center hover:bg-dark/10 transition-colors">
                <X className="w-4 h-4 text-dark/60" />
              </button>
            </div>

            <p className="text-sm text-dark/60 -mt-2">
              Produk: <span className="font-bold text-dark">{reviewModal.productName}</span>
            </p>

            {/* Star Rating */}
            <div>
              <p className="text-xs font-bold text-dark/60 mb-3">Rating Produk</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-all active:scale-90"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-dark/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-dark/50 mt-2">
                {rating === 1 ? '😞 Sangat Buruk' : rating === 2 ? '😕 Buruk' : rating === 3 ? '😐 Cukup' : rating === 4 ? '😊 Bagus' : '🤩 Sangat Bagus!'}
              </p>
            </div>

            {/* Comment */}
            <div>
              <p className="text-xs font-bold text-dark/60 mb-2">Komentar (opsional)</p>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Ceritakan pengalamanmu dengan produk ini..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-[#F3F6F8] border border-dark/5 text-sm text-dark placeholder-dark/35 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/10 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setReviewModal(null); setRating(5); setComment('') }}
                className="flex-1 py-3 rounded-xl border border-dark/10 text-sm font-semibold text-dark hover:bg-dark/5 transition-colors"
              >
                Nanti Saja
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-primary-orange text-white font-bold text-sm shadow-md shadow-primary-orange/20 disabled:opacity-50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Kirim Ulasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
