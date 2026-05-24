'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, SlidersHorizontal, Clock, Star, Flame, Leaf, ChevronRight, X, Filter, Package, MapPin } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface Product {
  id: string
  title: string
  original_price: number
  discount_price: number
  stock: number
  expired_at: string
  thumbnail_url: string
  is_active: boolean
  stores: { id: string; store_name: string; logo_url: string; latitude: number; longitude: number }
  categories: { name: string; slug: string }
  distance?: number
}

interface Category {
  id: string
  name: string
  slug: string
}

function CountdownBadge({ expiredAt }: { expiredAt: string }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiredAt).getTime() - Date.now()
      if (diff <= 0) { setLabel('Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setLabel(h > 0 ? `${h}j ${m}m` : `${m}m`)
    }
    update()
    const t = setInterval(update, 60000)
    return () => clearInterval(t)
  }, [expiredAt])

  const diff = new Date(expiredAt).getTime() - Date.now()
  const urgent = diff < 3 * 3600000

  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
      urgent ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
    }`}>
      <Clock className="w-3 h-3" /> {label}
    </span>
  )
}

function ProductCard({ product }: { product: Product }) {
  const disc = Math.round((1 - product.discount_price / product.original_price) * 100)
  const isLastChance = product.stock <= 3
  const isFresh = new Date(product.expired_at).getTime() - Date.now() > 12 * 3600000

  return (
    <Link href={`/foods/${product.id}`} className="bg-white rounded-2xl border border-dark/5 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-200 active:scale-[0.98] group">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-dark/5 overflow-hidden">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><Package className="w-10 h-10 text-dark/30" /></div>
        )}

        {/* Discount badge */}
        <div className="absolute top-2 left-2 bg-primary-orange text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
          -{disc}%
        </div>

        {/* Status badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {isLastChance && (
            <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow">
              <Flame className="w-2.5 h-2.5" /> LAST CHANCE
            </span>
          )}
          {isFresh && (
            <span className="bg-emerald-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow">
              <Leaf className="w-2.5 h-2.5" /> FRESH
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-dark/40 font-medium truncate">{(product.stores as any)?.store_name}</p>
            {product.distance !== undefined && (
              <span className="text-[10px] text-primary-teal font-bold shrink-0">
                {product.distance < 1000
                  ? `${Math.round(product.distance)}m`
                  : `${(product.distance / 1000).toFixed(1)}km`}
              </span>
            )}
          </div>
          <h3 className="font-bold text-dark text-sm leading-snug line-clamp-2 mt-0.5">{product.title}</h3>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-base font-extrabold text-primary-orange font-poppins">
              Rp{product.discount_price.toLocaleString('id-ID')}
            </span>
            <span className="text-xs line-through text-dark/30 font-medium">
              Rp{product.original_price.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <CountdownBadge expiredAt={product.expired_at} />
            <span className="text-[10px] text-dark/40 font-semibold">Sisa {product.stock}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const PROVINCES: { name: string; lat: number; lng: number }[] = [
  { name: 'Aceh', lat: 5.55, lng: 95.3172 },
  { name: 'Sumatera Utara', lat: 3.5952, lng: 98.6722 },
  { name: 'Sumatera Barat', lat: -0.9093, lng: 100.3616 },
  { name: 'Riau', lat: 0.5073, lng: 101.4478 },
  { name: 'Kepulauan Riau', lat: 0.8615, lng: 104.4591 },
  { name: 'Jambi', lat: -1.6101, lng: 103.6131 },
  { name: 'Bengkulu', lat: -3.8005, lng: 102.2606 },
  { name: 'Sumatera Selatan', lat: -2.9761, lng: 104.7754 },
  { name: 'Bangka Belitung', lat: -2.7411, lng: 106.4406 },
  { name: 'Lampung', lat: -5.4501, lng: 105.2671 },
  { name: 'Banten', lat: -6.1209, lng: 106.1503 },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  { name: 'Jawa Barat', lat: -6.8894, lng: 107.6098 },
  { name: 'Jawa Tengah', lat: -7.1509, lng: 110.1403 },
  { name: 'DI Yogyakarta', lat: -7.7971, lng: 110.3688 },
  { name: 'Jawa Timur', lat: -7.5361, lng: 112.2384 },
  { name: 'Bali', lat: -8.3405, lng: 115.092 },
  { name: 'Nusa Tenggara Barat', lat: -8.5833, lng: 116.1167 },
  { name: 'Nusa Tenggara Timur', lat: -10.1772, lng: 123.607 },
  { name: 'Kalimantan Barat', lat: -0.0352, lng: 109.3302 },
  { name: 'Kalimantan Tengah', lat: -1.4999, lng: 113.3833 },
  { name: 'Kalimantan Selatan', lat: -3.3291, lng: 114.5911 },
  { name: 'Kalimantan Timur', lat: -1.2458, lng: 116.8326 },
  { name: 'Kalimantan Utara', lat: 3.5734, lng: 116.6386 },
  { name: 'Sulawesi Utara', lat: 1.447, lng: 125.1852 },
  { name: 'Gorontalo', lat: 0.5435, lng: 123.0568 },
  { name: 'Sulawesi Tengah', lat: -0.896, lng: 121.3049 },
  { name: 'Sulawesi Barat', lat: -2.8495, lng: 119.2505 },
  { name: 'Sulawesi Selatan', lat: -5.1354, lng: 119.4238 },
  { name: 'Sulawesi Tenggara', lat: -3.9692, lng: 122.5949 },
  { name: 'Maluku', lat: -3.6553, lng: 128.1909 },
  { name: 'Maluku Utara', lat: 0.6259, lng: 127.7098 },
  { name: 'Papua', lat: -2.5333, lng: 140.7167 },
  { name: 'Papua Barat', lat: -1.3362, lng: 133.174 },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga ↑' },
  { value: 'price_desc', label: 'Harga ↓' },
  { value: 'expired_soon', label: 'Segera Expired' },
  { value: 'nearest', label: 'Terdekat' },
]

export default function ExploreFoodsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilter, setShowFilter] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState('')
  const [showProvincePicker, setShowProvincePicker] = useState(false)
  const PAGE_SIZE = 12

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  const selectProvince = (prov: typeof PROVINCES[number]) => {
    setUserLocation({ lat: prov.lat, lng: prov.lng })
    setLocationName(prov.name)
    setShowProvincePicker(false)
  }

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('id, name, slug').order('name')
    setCategories(data || [])
  }, [supabase])

  const computeDistances = useCallback((items: Product[]) => {
    if (!userLocation) return items
    return items.map(p => {
      const store = p.stores as any
      if (store?.latitude && store?.longitude) {
        return { ...p, distance: haversineDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude) }
      }
      return p
    })
  }, [userLocation])

  const sortedByNearest = useCallback((items: Product[]) => {
    const withDist = computeDistances(items)
    if (sortBy === 'nearest') {
      withDist.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    }
    return withDist
  }, [sortBy, userLocation])

  const fetchProducts = useCallback(async (reset = false, pageOverride?: number) => {
    setLoading(true)
    const currentPage = pageOverride ?? (reset ? 0 : page)
    try {
      let query = supabase
        .from('products')
        .select('id, title, original_price, discount_price, stock, expired_at, thumbnail_url, is_active, stores(id, store_name, logo_url, latitude, longitude), categories(name, slug)')
        .eq('is_active', true)
        .gt('stock', 0)
        .gt('expired_at', new Date().toISOString())

      if (search) query = query.ilike('title', `%${search}%`)
      if (selectedCategory) query = query.eq('category_id', selectedCategory)

      if (sortBy === 'price_asc') query = query.order('discount_price', { ascending: true })
      else if (sortBy === 'price_desc') query = query.order('discount_price', { ascending: false })
      else if (sortBy === 'expired_soon') query = query.order('expired_at', { ascending: true })
      else query = query.order('created_at', { ascending: false })

      query = query.range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)

      const { data, error } = await query
      if (error) throw error

      const items = sortedByNearest((data || []) as unknown as Product[])
      if (reset) {
        setProducts(items)
        setPage(0)
      } else {
        setProducts(prev => sortedByNearest([...prev, ...items]))
      }
      setHasMore(items.length === PAGE_SIZE)
    } catch (e) {
      console.error('Foods fetch error:', e)
      toast.error('Gagal memuat produk.')
    } finally {
      setLoading(false)
    }
  }, [supabase, search, selectedCategory, sortBy, page, sortedByNearest])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProducts(true)
    }, 300)
    return () => clearTimeout(t)
  }, [search, selectedCategory, sortBy, userLocation]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-full bg-cream-bg">
      {/* Top Search Bar */}
      <div className="bg-white px-4 pt-safe pb-3 sticky top-0 z-20 shadow-sm rounded-b-3xl">
        <div className="flex items-center gap-2 mb-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/35" />
            <input
              type="text"
              placeholder="Cari makanan diskon..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F3F6F8] border border-transparent shadow-inner text-sm text-dark placeholder-dark/40 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 outline-none transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-dark">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowProvincePicker(!showProvincePicker)}
            className={`p-2.5 rounded-xl border transition-all relative ${showProvincePicker ? 'bg-primary-teal border-primary-teal text-white' : 'border-dark/10 text-primary-teal hover:bg-cream-bg'}`}
            title={locationName || 'Pilih provinsi'}
          >
            <MapPin className="w-4 h-4" />
            {userLocation && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />}
          </button>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`p-2.5 rounded-xl border transition-all ${showFilter ? 'bg-primary-teal border-primary-teal text-white' : 'border-dark/10 text-dark/60 hover:bg-cream-bg'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Province Picker */}
        {showProvincePicker && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-dark/50 uppercase tracking-wider">Pilih Provinsi</p>
              {locationName && (
                <span className="text-[10px] font-bold text-primary-teal bg-primary-teal/10 px-2 py-0.5 rounded-full">
                  {locationName}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto bg-white rounded-2xl border border-dark/5 shadow-sm p-2">
              {PROVINCES.map(prov => (
                <button
                  key={prov.name}
                  onClick={() => selectProvince(prov)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    locationName === prov.name
                      ? 'bg-primary-teal text-white'
                      : 'text-dark/70 hover:bg-cream-bg'
                  }`}
                >
                  {prov.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`shrink-0 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              !selectedCategory ? 'bg-primary-orange text-white' : 'bg-cream-bg text-dark/50 hover:bg-dark/5'
            }`}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
              className={`shrink-0 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.id ? 'bg-primary-orange text-white' : 'bg-cream-bg text-dark/50 hover:bg-dark/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort filter dropdown */}
        {showFilter && (
          <div className="mt-3 pt-3 border-t border-dark/5">
            <p className="text-xs font-bold text-dark/50 mb-2 uppercase tracking-wider">Urutkan</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    sortBy === opt.value ? 'bg-primary-teal text-white' : 'bg-cream-bg text-dark/50 hover:bg-dark/5 border border-dark/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="text-xl font-poppins font-extrabold text-dark">
          Jelajahi Makanan
        </h1>
        <p className="text-sm font-semibold text-dark/50 bg-white px-3 py-1 rounded-full shadow-sm">
          {loading ? 'Memuat...' : `${products.length} makanan`}
        </p>
      </div>

      {/* Product Grid */}
      <div className="px-4 pb-8 max-w-7xl mx-auto">
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white rounded-2xl animate-pulse border border-dark/5" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-dark/20 mx-auto mb-4" />
            <p className="font-poppins font-bold text-dark/50">Tidak ada makanan ditemukan</p>
            <p className="text-xs text-dark/35 mt-1">Coba kata kunci atau filter yang berbeda</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>

            {/* Load more */}
            {hasMore && (
              <button
                onClick={() => { const next = page + 1; setPage(next); fetchProducts(false, next) }}
                disabled={loading}
                className="w-full mt-5 py-3 rounded-2xl border border-dark/10 text-sm font-bold text-dark/60 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
