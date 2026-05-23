'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, SlidersHorizontal, Clock, Star, Flame, Leaf, ChevronRight, X, Filter, Package } from 'lucide-react'
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
  stores: { id: string; store_name: string; logo_url: string }
  categories: { name: string; slug: string }
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
          <p className="text-xs text-dark/40 font-medium truncate">{(product.stores as any)?.store_name}</p>
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

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga ↑' },
  { value: 'price_desc', label: 'Harga ↓' },
  { value: 'expired_soon', label: 'Segera Expired' },
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
  const PAGE_SIZE = 12

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('id, name, slug').order('name')
    setCategories(data || [])
  }, [supabase])

  const fetchProducts = useCallback(async (reset = false) => {
    setLoading(true)
    const currentPage = reset ? 0 : page
    try {
      let query = supabase
        .from('products')
        .select('id, title, original_price, discount_price, stock, expired_at, thumbnail_url, is_active, stores(id, store_name, logo_url), categories(name, slug)')
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

      console.log('Foods raw data:', data)
      const items = (data || []) as unknown as Product[]
      if (reset) {
        setProducts(items)
        setPage(0)
      } else {
        setProducts(prev => [...prev, ...items])
      }
      setHasMore(items.length === PAGE_SIZE)
    } catch (e) {
      console.error('Foods fetch error:', e)
      toast.error('Gagal memuat produk.')
    } finally {
      setLoading(false)
    }
  }, [supabase, search, selectedCategory, sortBy, page])

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
  }, [search, selectedCategory, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-full bg-[#F3F6F8]">
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
            onClick={() => setShowFilter(!showFilter)}
            className={`p-2.5 rounded-xl border transition-all ${showFilter ? 'bg-primary-teal border-primary-teal text-white' : 'border-dark/10 text-dark/60 hover:bg-cream-bg'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

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
                onClick={() => { setPage(prev => prev + 1); fetchProducts(false) }}
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
