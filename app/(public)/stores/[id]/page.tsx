'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, Heart, MessageCircle, Star, ChevronRight, Store as StoreIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

interface StoreData {
  id: string
  store_name: string
  description: string
  address: string
  latitude: number
  longitude: number
  banner_url: string
  logo_url: string
  is_verified: boolean
  open_time: string
  close_time: string
}

interface Product {
  id: string
  title: string
  discount_price: number
  original_price: number
  stock: number
  expired_at: string
  thumbnail_url: string
}

export default function StoreDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const storeId = params?.id as string

  const [store, setStore] = useState<StoreData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isFav, setIsFav] = useState(false)
  const [favId, setFavId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [convId, setConvId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data: storeData, error } = await supabase
        .from('stores').select('*').eq('id', storeId).single()
      if (error || !storeData) { router.push('/foods'); return }
      setStore(storeData as StoreData)

      const { data: prods } = await supabase
        .from('products')
        .select('id, title, discount_price, original_price, stock, expired_at, thumbnail_url')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .gt('stock', 0)
        .gt('expired_at', new Date().toISOString())
        .order('expired_at', { ascending: true })
      setProducts(prods || [])

      if (user) {
        const { data: favData } = await supabase
          .from('favorites').select('id')
          .eq('customer_id', user.id).eq('store_id', storeId).maybeSingle()
        if (favData) { setIsFav(true); setFavId(favData.id) }

        // Check existing conversation
        const { data: convData } = await supabase
          .from('conversations').select('id')
          .eq('customer_id', user.id).eq('store_id', storeId).maybeSingle()
        if (convData) setConvId(convData.id)
      }

      // Reviews aggregate
      const { data: revs } = await supabase
        .from('reviews')
        .select('rating, products!inner(store_id)')
        .eq('products.store_id', storeId)
      if (revs && revs.length > 0) {
        const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length
        setAvgRating(Math.round(avg * 10) / 10)
        setReviewCount(revs.length)
      }
    } catch {
      toast.error('Gagal memuat data toko.')
    } finally {
      setLoading(false)
    }
  }, [supabase, storeId, router])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const handleFavorite = async () => {
    if (!userId) { router.push('/login'); return }
    if (isFav && favId) {
      await supabase.from('favorites').delete().eq('id', favId)
      setIsFav(false); setFavId(null)
      toast.success('Toko dihapus dari favorit.')
    } else {
      const { data } = await supabase.from('favorites')
        .insert({ customer_id: userId, store_id: storeId }).select().single()
      setIsFav(true); setFavId(data?.id || null)
      toast.success('Toko ditambahkan ke favorit!')
    }
  }

  const handleChat = async () => {
    if (!userId) { router.push('/login'); return }
    if (convId) { router.push(`/chat/${convId}`); return }
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ customer_id: userId, store_id: storeId })
        .select('id').single()
      if (error) throw error
      router.push(`/chat/${data.id}`)
    } catch {
      toast.error('Gagal memulai percakapan.')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-cream-bg animate-pulse">
      <div className="h-48 bg-dark/10" />
      <div className="px-4 py-5 space-y-3">
        <div className="h-6 bg-dark/10 rounded-xl w-2/3" />
        <div className="h-4 bg-dark/5 rounded-xl" />
      </div>
    </div>
  )

  if (!store) return null

  const now = new Date()
  const isOpen = (() => {
    if (!store.open_time || !store.close_time) return true
    const [oh, om] = store.open_time.split(':').map(Number)
    const [ch, cm] = store.close_time.split(':').map(Number)
    const cur = now.getHours() * 60 + now.getMinutes()
    return cur >= oh * 60 + om && cur <= ch * 60 + cm
  })()

  return (
    <div className="min-h-screen bg-cream-bg pb-8">
      {/* Back button */}
      <div className="fixed top-4 left-4 z-30">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-dark" />
        </button>
      </div>

      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-br from-primary-teal/30 to-light-teal/30">
        {store.banner_url && (
          <Image src={store.banner_url} alt={store.store_name} fill sizes="100vw" className="object-cover brightness-75" />
        )}
      </div>

      {/* Store Header Card */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl border border-dark/5 shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary-teal/10 flex items-center justify-center border-2 border-white shadow-sm shrink-0 overflow-hidden -mt-8">
              {store.logo_url ? (
                <Image src={store.logo_url} alt={store.store_name} width={56} height={56} className="object-cover w-full h-full" />
              ) : (
                <StoreIcon className="w-7 h-7 text-primary-teal" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="font-poppins font-extrabold text-dark text-lg">{store.store_name}</h1>
                {store.is_verified && (
                  <span className="text-[9px] font-extrabold bg-primary-teal/10 text-primary-teal px-2 py-0.5 rounded-full">✓ VERIFIED</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {avgRating !== null && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-dark/60">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {avgRating} ({reviewCount})
                  </span>
                )}
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {isOpen ? '● BUKA' : '● TUTUP'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {store.address && (
              <p className="text-xs text-dark/60 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary-teal shrink-0 mt-0.5" />
                {store.address}
              </p>
            )}
            {store.open_time && store.close_time && (
              <p className="text-xs text-dark/60 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary-teal" />
                Jam Buka: {store.open_time} – {store.close_time}
              </p>
            )}
            {store.description && (
              <p className="text-xs text-dark/70 leading-relaxed mt-2">{store.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleFavorite}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                isFav ? 'border-red-300 bg-red-50 text-red-600' : 'border-dark/10 text-dark/60 hover:bg-cream-bg'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
              {isFav ? 'Difavoritkan' : 'Favorit'}
            </button>
            <button
              onClick={handleChat}
              className="flex-1 py-2.5 rounded-xl bg-primary-teal text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-all"
            >
              <MessageCircle className="w-4 h-4" /> Chat Toko
            </button>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-poppins font-bold text-dark text-base">Menu Tersedia</h2>
          <span className="text-xs text-dark/40 font-semibold">{products.length} item</span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-orange/10 flex items-center justify-center mx-auto mb-4">
              <StoreIcon className="w-7 h-7 text-primary-orange" />
            </div>
            <p className="font-bold text-dark/50 text-sm">Belum ada menu aktif</p>
            <p className="text-xs text-dark/35 mt-1">Toko belum mengupload makanan saat ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(prod => {
              const disc = Math.round((1 - prod.discount_price / prod.original_price) * 100)
              return (
                <Link key={prod.id} href={`/foods/${prod.id}`} className="bg-white rounded-2xl border border-dark/5 shadow-sm p-3 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.99]">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-dark/5 shrink-0">
                    {prod.thumbnail_url && <Image src={prod.thumbnail_url} alt={prod.title} fill sizes="64px" className="object-cover" />}
                    <div className="absolute top-1 left-1 bg-primary-orange text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">-{disc}%</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-dark truncate">{prod.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-extrabold text-primary-orange">Rp{prod.discount_price.toLocaleString('id-ID')}</span>
                      <span className="text-xs line-through text-dark/30">Rp{prod.original_price.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-dark/40 font-semibold">Sisa {prod.stock}</span>
                      <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {(() => {
                          const diff = new Date(prod.expired_at).getTime() - Date.now()
                          const h = Math.floor(diff / 3600000)
                          const m = Math.floor((diff % 3600000) / 60000)
                          return h > 0 ? `${h}j ${m}m` : `${m}m`
                        })()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-dark/30 shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
