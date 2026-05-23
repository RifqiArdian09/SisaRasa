'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Store, Clock, Star, Heart, MessageCircle, ShoppingCart, ChevronRight, Leaf, Flame } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart-store'

interface Review {
  id: string
  rating: number
  comment: string
  image_url: string
  created_at: string
  users: { name: string; avatar_url: string }
  review_replies: { reply: string } | null
}

interface Product {
  id: string
  title: string
  description: string
  original_price: number
  discount_price: number
  stock: number
  expired_at: string
  thumbnail_url: string
  is_active: boolean
  stores: { id: string; store_name: string; logo_url: string; address: string; is_verified: boolean }
  categories: { name: string }
  product_images: { image_url: string }[]
}

function CountdownTimer({ expiredAt }: { expiredAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiredAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [expiredAt])

  return <span className="font-mono font-extrabold">{timeLeft}</span>
}

export default function FoodDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [isFav, setIsFav] = useState(false)
  const [favId, setFavId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [ordering, setOrdering] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer' | 'toko'>('cod')
  const [showOrderModal, setShowOrderModal] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data: prod, error } = await supabase
        .from('products')
        .select(`*, stores(id, store_name, logo_url, address, is_verified), categories(name), product_images(image_url)`)
        .eq('id', productId)
        .single()
      if (error || !prod) { router.push('/foods'); return }
      setProduct(prod as unknown as Product)

      if (user) {
        // Check if store is favorited
        const store = (prod as any).stores
        const { data: favData } = await supabase
          .from('favorites')
          .select('id')
          .eq('customer_id', user.id)
          .eq('store_id', store?.id)
          .maybeSingle()
        if (favData) { setIsFav(true); setFavId(favData.id) }
      }

      // Reviews
      const { data: revs } = await supabase
        .from('reviews')
        .select('id, rating, comment, image_url, created_at, users(name, avatar_url), review_replies(reply)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(5)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReviews((revs || []).map((r: any) => ({
        ...r,
        review_replies: Array.isArray(r.review_replies) ? r.review_replies[0] || null : r.review_replies
      })) as Review[])
    } catch {
      toast.error('Gagal memuat detail produk.')
    } finally {
      setLoading(false)
    }
  }, [supabase, productId, router])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const handleFavorite = async () => {
    if (!userId) { router.push('/login'); return }
    const store = product?.stores as any
    if (!store?.id) return

    try {
      if (isFav && favId) {
        await supabase.from('favorites').delete().eq('id', favId)
        setIsFav(false); setFavId(null)
        toast.success('Toko dihapus dari favorit.')
      } else {
        const { data, error } = await supabase.from('favorites').insert({ customer_id: userId, store_id: store.id }).select().single()
        if (error) throw error
        setIsFav(true); setFavId(data?.id || null)
        toast.success('Toko ditambahkan ke favorit! 🌟')
      }
    } catch (e) {
      toast.error('Gagal memperbarui favorit.')
    }
  }

  const { addItem } = useCartStore()

  const handleAddToCart = () => {
    if (!product) return
    const storeData = product.stores as any
    addItem({
      product_id: product.id,
      title: product.title,
      price: product.discount_price,
      quantity: qty,
      thumbnail_url: product.thumbnail_url,
      stock: product.stock
    }, {
      id: storeData.id,
      store_name: storeData.store_name
    })
    
    setShowOrderModal(false)
    toast.success('Berhasil ditambahkan ke keranjang! 🛒')
    router.push('/cart')
  }

  if (loading) return (
    <div className="min-h-screen bg-cream-bg animate-pulse">
      <div className="h-64 bg-dark/10" />
      <div className="px-4 py-5 space-y-3">
        <div className="h-6 bg-dark/10 rounded-xl w-3/4" />
        <div className="h-4 bg-dark/5 rounded-xl" />
        <div className="h-4 bg-dark/5 rounded-xl w-2/3" />
      </div>
    </div>
  )

  if (!product) return null

  const store = product.stores as any
  const allImages = [product.thumbnail_url, ...(product.product_images?.map(i => i.image_url) || [])].filter(Boolean)
  const disc = Math.round((1 - product.discount_price / product.original_price) * 100)
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="min-h-screen bg-cream-bg pb-24">
      {/* Fixed Header Actions */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30 pointer-events-none flex justify-between">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-all pointer-events-auto">
          <ArrowLeft className="w-4 h-4 text-dark" />
        </button>
        <button onClick={handleFavorite} className="w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-all pointer-events-auto">
          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-dark/50'}`} />
        </button>
      </div>

      {/* Image Gallery */}
      <div className="relative h-72 bg-dark/10">
        {allImages[activeImg] ? (
          <Image src={allImages[activeImg]} alt={product.title} fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">🍱</div>
        )}
        <div className="absolute top-2 right-16 bg-primary-orange text-white text-xs font-extrabold px-2 py-1 rounded-full shadow">
          -{disc}%
        </div>
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {allImages.map((_, i) => (
              <button key={i} onClick={() => setActiveImg(i)} className={`rounded-full transition-all ${i === activeImg ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="bg-white px-4 py-2 flex gap-2 overflow-x-auto">
          {allImages.map((img, i) => (
            <button key={i} onClick={() => setActiveImg(i)} className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${i === activeImg ? 'border-primary-orange' : 'border-transparent'}`}>
              <Image src={img} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-5 space-y-5">
        {/* Title & Category */}
        <div>
          <span className="text-xs font-bold text-primary-teal bg-primary-teal/10 px-2 py-0.5 rounded-full">
            {(product.categories as any)?.name || 'Makanan'}
          </span>
          <h1 className="text-xl font-poppins font-extrabold text-dark mt-2 leading-tight">{product.title}</h1>

          {avgRating && (
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-dark">{avgRating}</span>
              <span className="text-xs text-dark/40">({reviews.length} ulasan)</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-dark/40 font-semibold">Harga Diskon</p>
            <p className="text-2xl font-extrabold text-primary-orange font-poppins">
              Rp{product.discount_price.toLocaleString('id-ID')}
            </p>
            <p className="text-xs line-through text-dark/30 font-medium">
              Rp{product.original_price.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-dark/40 font-semibold">Stok</p>
            <p className="text-xl font-extrabold text-dark font-poppins">{product.stock}</p>
            <p className="text-xs text-dark/40">porsi</p>
          </div>
        </div>

        {/* Expired countdown */}
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${
          new Date(product.expired_at).getTime() - Date.now() < 3 * 3600000
            ? 'bg-red-50 border border-red-200'
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <Clock className={`w-5 h-5 shrink-0 ${new Date(product.expired_at).getTime() - Date.now() < 3 * 3600000 ? 'text-red-500' : 'text-amber-600'}`} />
          <div>
            <p className="text-xs font-semibold text-dark/60">Sisa Waktu</p>
            <p className={`text-base ${new Date(product.expired_at).getTime() - Date.now() < 3 * 3600000 ? 'text-red-600' : 'text-amber-700'}`}>
              <CountdownTimer expiredAt={product.expired_at} />
            </p>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-4">
            <h3 className="font-poppins font-bold text-dark text-sm mb-2">Deskripsi</h3>
            <p className="text-sm text-dark/70 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Store info */}
        <Link href={`/stores/${store?.id}`} className="bg-white rounded-2xl border border-dark/5 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-primary-teal/10 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6 text-primary-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-dark text-sm">{store?.store_name}</h3>
              {store?.is_verified && <span className="text-[9px] font-extrabold text-primary-teal bg-primary-teal/10 px-1.5 py-0.5 rounded-full">✓ VERIFIED</span>}
            </div>
            <p className="text-xs text-dark/50 truncate mt-0.5">{store?.address}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-dark/30 shrink-0" />
        </Link>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <h3 className="font-poppins font-bold text-dark text-base mb-3">Ulasan Pembeli</h3>
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-white rounded-2xl border border-dark/5 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-teal/10 flex items-center justify-center text-xs font-bold text-primary-teal">
                      {(review.users as any)?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark">{(review.users as any)?.name || 'Customer'}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-dark/15'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && <p className="text-xs text-dark/70 leading-relaxed">{review.comment}</p>}
                  {review.review_replies && (
                    <div className="mt-2 bg-primary-teal/5 border border-primary-teal/10 rounded-xl p-3">
                      <p className="text-[10px] font-extrabold text-primary-teal mb-1">Balasan Toko</p>
                      <p className="text-xs text-dark/70">{review.review_replies.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-dark/5 px-4 py-3 pb-safe flex gap-3 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <Link
          href={`/chat?store=${store?.id}`}
          className="w-12 h-12 rounded-xl border border-dark/10 flex items-center justify-center text-dark/60 hover:bg-cream-bg transition-colors shrink-0"
        >
          <MessageCircle className="w-5 h-5" />
        </Link>
        <button
          onClick={() => setShowOrderModal(true)}
          disabled={!product.is_active || product.stock === 0}
          className="flex-1 py-3 rounded-xl bg-primary-orange text-white font-poppins font-bold text-sm shadow-lg shadow-primary-orange/25 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {product.stock === 0 ? 'Stok Habis' : 'Tambah Keranjang'}
        </button>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end overflow-hidden justify-center">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 space-y-5 animate-slide-up pb-safe shadow-2xl relative">
            <div className="w-10 h-1 bg-dark/20 rounded-full mx-auto mb-1" />
            <h3 className="font-poppins font-extrabold text-dark text-lg">Tambah ke Keranjang</h3>

            {/* Item */}
            <div className="flex items-center gap-3 bg-cream-bg rounded-2xl p-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-dark/10 shrink-0">
                {product.thumbnail_url && <Image src={product.thumbnail_url} alt={product.title} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-dark truncate">{product.title}</p>
                <p className="text-primary-orange font-extrabold text-sm">Rp{product.discount_price.toLocaleString('id-ID')}</p>
              </div>
            </div>

            {/* Qty */}
            <div>
              <p className="text-xs font-bold text-dark/60 mb-2">Jumlah Porsi</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl bg-cream-bg border border-dark/10 flex items-center justify-center font-bold text-dark text-lg">−</button>
                <span className="text-xl font-extrabold text-dark w-8 text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-9 h-9 rounded-xl bg-cream-bg border border-dark/10 flex items-center justify-center font-bold text-dark text-lg">+</button>
                <span className="text-xs text-dark/40 ml-2">maks. {product.stock}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-dark/5">
              <p className="text-sm font-semibold text-dark/60">Total Harga</p>
              <p className="text-xl font-extrabold text-primary-orange font-poppins">
                Rp{(product.discount_price * qty).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowOrderModal(false)} className="flex-1 py-3 rounded-xl border border-dark/10 text-sm font-semibold text-dark hover:bg-cream-bg">Batal</button>
              <button onClick={handleAddToCart} className="flex-1 py-3 rounded-xl bg-primary-orange text-white font-bold text-sm shadow-md">
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
