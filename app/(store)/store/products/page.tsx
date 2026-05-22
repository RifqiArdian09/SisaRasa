'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Layers, 
  AlertTriangle,
  Search,
  Eye,
  EyeOff
} from 'lucide-react'
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
  category_id: string
  categories?: {
    name: string
  }
}

export default function MerchantProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>(0 as unknown as Product[])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!store) return

      const { data: prods, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts((prods || []) as unknown as Product[])
    } catch (err) {
      toast.error('Gagal mengambil daftar produk.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts()
  }, [])

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      toast.success(currentStatus ? 'Produk dinonaktifkan' : 'Produk diaktifkan')
      setProducts(prev => 
        prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p)
      )
    } catch (err) {
      toast.error('Gagal memperbarui status produk.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Produk berhasil dihapus.')
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      toast.error('Gagal menghapus produk.')
    }
  }

  const getExpirationBadge = (expiredAtStr: string) => {
    const expiredAt = new Date(expiredAtStr)
    const now = new Date()
    const diffMs = expiredAt.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours <= 0) {
      return (
        <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
          Expired / Lewat Waktu
        </span>
      )
    } else if (diffHours <= 4) {
      return (
        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
          Last Chance ({Math.ceil(diffHours)}j lagi)
        </span>
      )
    } else {
      return (
        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
          Aktif ({Math.ceil(diffHours)}j lagi)
        </span>
      )
    }
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val)
  }

  const filteredProducts = Array.isArray(products) ? products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-dark/10 rounded-xl" />
        <div className="h-12 w-full bg-dark/5 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-dark/5 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-extrabold text-dark tracking-tight">
            Manajemen Produk
          </h1>
          <p className="text-dark/50 text-sm mt-1">
            Kelola makanan, harga diskon, stok, dan batas konsumsi (expired time).
          </p>
        </div>
        <Link
          href="/store/products/create"
          className="flex items-center gap-2 py-3 px-5 bg-primary-teal text-white rounded-xl font-poppins font-bold text-sm shadow-lg shadow-primary-teal/20 hover:-translate-y-0.5 active:translate-y-0 transition-all text-center w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Tambah Makanan Baru
        </Link>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" />
        <input
          type="text"
          placeholder="Cari makanan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/30 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-bold text-dark font-poppins">Tidak Ada Produk</h3>
          <p className="text-sm text-dark/50 mt-1 max-w-sm">
            {searchQuery ? 'Tidak ada makanan yang cocok dengan kata kunci pencarian Anda.' : 'Anda belum mengupload makanan apa pun. Klik tombol di atas untuk mulai menjual.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className={`bg-white rounded-2xl border border-dark/5 shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
                !product.is_active ? 'opacity-70' : ''
              }`}
            >
              {/* Product Visual */}
              <div className="relative h-48 bg-dark/5">
                {product.thumbnail_url ? (
                  <Image
                    src={product.thumbnail_url}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-dark/20 text-xs font-bold font-poppins">
                    No Image
                  </div>
                )}
                {/* Expired Countdown Badge */}
                <div className="absolute top-4 left-4 z-10">
                  {getExpirationBadge(product.expired_at)}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-[10px] text-primary-teal font-extrabold uppercase tracking-widest">
                    <Layers className="w-3 h-3" />
                    {product.categories?.name || 'Kategori'}
                  </div>
                  <h3 className="font-poppins font-bold text-dark text-lg truncate">
                    {product.title}
                  </h3>
                  
                  {/* Prices */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm line-through text-dark/30 font-semibold">
                      {formatPrice(product.original_price)}
                    </span>
                    <span className="text-base font-extrabold text-primary-orange font-poppins">
                      {formatPrice(product.discount_price)}
                    </span>
                  </div>

                  {/* Stock */}
                  <p className="text-xs text-dark/60 font-semibold">
                    Stok Tersedia: <span className={product.stock === 0 ? 'text-red-500' : 'text-primary-teal'}>{product.stock} porsi</span>
                  </p>
                </div>

                {/* Quick actions panel */}
                <div className="flex items-center justify-between border-t border-dark/5 mt-6 pt-4">
                  <button
                    onClick={() => handleToggleActive(product.id, product.is_active)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                      product.is_active
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {product.is_active ? (
                      <>
                        <EyeOff className="w-4 h-4" /> Nonaktifkan
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" /> Aktifkan
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <Link
                      href={`/store/products/${product.id}/edit`}
                      className="p-2 bg-cream-bg hover:bg-dark/5 text-dark/70 rounded-xl transition-colors border border-dark/5"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors border border-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
