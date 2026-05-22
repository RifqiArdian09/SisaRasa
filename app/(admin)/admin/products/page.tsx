'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, Trash2, Package, Clock, AlertTriangle, Loader2, Image as ImageIcon, Store, Tag, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

interface ProductItem {
  id: string
  name: string
  description: string | null
  store: string
  store_id: string
  category: string
  category_id: string | null
  price: number
  originalPrice: number
  stock: number
  expiredAt: string
  expiredIn: string
  isExpired: boolean
  isActive: boolean
  status: 'active' | 'expired' | 'low_stock'
  thumbnail_url: string | null
  images: string[]
  createdAt: string
}

const STATUS_CONFIG = {
  active:    { label: 'Aktif',      cls: 'bg-emerald-50 text-emerald-700' },
  expired:   { label: 'Expired',    cls: 'bg-red-50 text-red-700' },
  low_stock: { label: 'Stok Tipis', cls: 'bg-orange-50 text-orange-700' },
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'low_stock'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null)
  const [detailImageIdx, setDetailImageIdx] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`id, title, description, original_price, discount_price, stock, expired_at, is_active, thumbnail_url, created_at, store_id, category_id, stores ( store_name ), categories ( name )`)
        .order('created_at', { ascending: false })
      if (error) throw error

      const { data: imagesData } = await supabase.from('product_images').select('product_id, image_url').order('created_at')

      const now = new Date()
      const formattedProducts: ProductItem[] = (data || []).map(p => {
        const expiredDate = new Date(p.expired_at)
        const isExpired = expiredDate <= now
        const hoursLeft = Math.max(0, Math.floor((expiredDate.getTime() - now.getTime()) / (1000 * 60 * 60)))

        let status: 'active' | 'expired' | 'low_stock' = 'active'
        if (isExpired || p.stock === 0) status = 'expired'
        else if (p.stock <= 5) status = 'low_stock'

        const productImages = imagesData?.filter(img => img.product_id === p.id).map(img => img.image_url) || []

        return {
          id: p.id,
          name: p.title,
          description: p.description,
          store: (p as any).stores?.store_name || 'Unknown Store',
          store_id: p.store_id,
          category: (p as any).categories?.name || 'Uncategorized',
          category_id: p.category_id,
          price: p.discount_price,
          originalPrice: p.original_price,
          stock: p.stock,
          expiredAt: p.expired_at,
          expiredIn: isExpired || p.stock === 0 ? 'Expired' : (hoursLeft > 24 ? `${Math.floor(hoursLeft / 24)} hari` : `${hoursLeft} jam`),
          isExpired: isExpired || p.stock === 0,
          isActive: p.is_active,
          status,
          thumbnail_url: p.thumbnail_url,
          images: productImages,
          createdAt: new Date(p.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
        }
      })
      setProducts(formattedProducts)
    } catch (error: any) {
      toast.error('Gagal memuat data produk: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', confirmDelete)
      if (error) throw error
      setProducts(prev => prev.filter(p => p.id !== confirmDelete))
      toast.success('Produk berhasil dihapus.')
      setConfirmDelete(null)
    } catch (error: any) {
      toast.error('Gagal menghapus produk: ' + error.message)
    }
  }

  const openDetail = (product: ProductItem) => {
    setDetailProduct(product)
    setDetailImageIdx(0)
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.store.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (statusFilter === 'all' || p.status === statusFilter)
  })

  const counts = { all: products.length, active: products.filter(p => p.status === 'active').length, expired: products.filter(p => p.status === 'expired').length, low_stock: products.filter(p => p.status === 'low_stock').length }
  const discount = (orig: number, disc: number) => orig > 0 ? Math.round((1 - disc / orig) * 100) : 0
  const TABS = [{ key: 'all', label: 'Semua' }, { key: 'active', label: 'Aktif' }, { key: 'low_stock', label: '⚠️ Stok Tipis' }, { key: 'expired', label: '❌ Expired' }] as const

  const allImages = (product: ProductItem) => {
    const imgs: string[] = []
    if (product.thumbnail_url) imgs.push(product.thumbnail_url)
    imgs.push(...product.images)
    return imgs
  }

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div><h1 className="font-bold text-2xl">Moderasi Produk</h1><p className="text-sm text-[#6A7686] mt-0.5">Pantau semua produk yang dijual di platform</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 ring-1 ring-[#E5E7EB] shadow-sm overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === tab.key ? 'bg-[#0F766E] text-white' : 'text-[#6A7686] hover:bg-[#F3F6F8]'}`}>
              {tab.label} <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${statusFilter === tab.key ? 'bg-white/20' : 'bg-[#F3F6F8]'}`}>{counts[tab.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
          <input type="text" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl ring-1 ring-[#E5E7EB] text-sm outline-none focus:ring-[#0F766E] shadow-sm" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-[#0F766E] mb-4" /><p className="text-[#6A7686] font-medium">Memuat produk...</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(product => (
            <div key={product.id} className={`rounded-3xl ring-1 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md ${product.status === 'expired' ? 'ring-red-200' : product.status === 'low_stock' ? 'ring-orange-200' : 'ring-[#E5E7EB]'}`}>
              <div className={`relative h-32 flex items-center justify-center overflow-hidden ${product.status === 'expired' ? 'bg-red-50' : product.status === 'low_stock' ? 'bg-orange-50' : 'bg-[#0F766E]/5'}`}>
                {product.thumbnail_url ? <Image src={product.thumbnail_url} alt={product.name} fill className="object-cover" /> : <ImageIcon className="size-8 text-[#6A7686]/30" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0"><h3 className="font-bold text-sm truncate">{product.name}</h3><p className="text-xs text-[#6A7686] mt-0.5">{product.store}</p></div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${STATUS_CONFIG[product.status].cls}`}>{STATUS_CONFIG[product.status].label}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-base text-[#0F766E]">Rp {product.price.toLocaleString('id-ID')}</span>
                    <span className="text-xs text-[#6A7686] line-through ml-2">Rp {product.originalPrice.toLocaleString('id-ID')}</span>
                  </div>
                  {discount(product.originalPrice, product.price) > 0 && <span className="px-2 py-0.5 rounded-full bg-[#FF8A00]/10 text-[#FF8A00] text-[10px] font-bold">-{discount(product.originalPrice, product.price)}%</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6A7686] mb-4">
                  <span className="flex items-center gap-1"><Package className="size-3.5" /> {product.stock} stok</span>
                  <span className={`flex items-center gap-1 ${product.status === 'expired' ? 'text-red-600 font-bold' : product.status === 'low_stock' ? 'text-orange-600 font-semibold' : ''}`}>
                    {product.status === 'expired' ? <AlertTriangle className="size-3.5" /> : <Clock className="size-3.5" />} {product.expiredIn}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openDetail(product)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0F766E]/10 text-[#0F766E] rounded-xl text-xs font-bold hover:bg-[#0F766E] hover:text-white transition-all"><Eye className="size-3.5" /> Detail</button>
                  <button onClick={() => setConfirmDelete(product.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full rounded-3xl ring-1 ring-[#E5E7EB] bg-white p-16 text-center"><Package className="size-10 mx-auto mb-3 text-[#E5E7EB]" /><p className="font-semibold text-[#6A7686]">Tidak ada produk ditemukan</p></div>}
        </div>
      )}

      {/* Detail Modal */}
      {detailProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setDetailProduct(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Image Gallery */}
            <div className="relative h-56 bg-[#F3F6F8] rounded-t-3xl overflow-hidden">
              {allImages(detailProduct).length > 0 ? (
                <>
                  <Image src={allImages(detailProduct)[detailImageIdx]} alt={detailProduct.name} fill className="object-cover" />
                  {allImages(detailProduct).length > 1 && (
                    <>
                      <button onClick={() => setDetailImageIdx(i => (i - 1 + allImages(detailProduct).length) % allImages(detailProduct).length)} className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg"><ChevronLeft className="size-4" /></button>
                      <button onClick={() => setDetailImageIdx(i => (i + 1) % allImages(detailProduct).length)} className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg"><ChevronRight className="size-4" /></button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">{allImages(detailProduct).map((_, i) => (<button key={i} onClick={() => setDetailImageIdx(i)} className={`size-2 rounded-full transition-all ${i === detailImageIdx ? 'w-5 bg-white' : 'bg-white/50'}`} />))}</div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full"><ImageIcon className="size-12 text-[#6A7686]/30" /></div>
              )}
              <button onClick={() => setDetailProduct(null)} className="absolute top-3 right-3 size-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"><X className="size-4 text-white" /></button>
              <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[detailProduct.status].cls}`}>{STATUS_CONFIG[detailProduct.status].label}</span>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold">{detailProduct.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-[#6A7686] mt-1">
                    <Store className="size-3.5" />
                    <span>{detailProduct.store}</span>
                    <span className="text-[#E5E7EB]">|</span>
                    <Tag className="size-3.5" />
                    <span>{detailProduct.category}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F3F6F8] rounded-2xl p-4 mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-[#0F766E]">Rp {detailProduct.price.toLocaleString('id-ID')}</span>
                  <span className="text-sm text-[#6A7686] line-through">Rp {detailProduct.originalPrice.toLocaleString('id-ID')}</span>
                  {discount(detailProduct.originalPrice, detailProduct.price) > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FF8A00]/10 text-[#FF8A00] text-xs font-bold">-{discount(detailProduct.originalPrice, detailProduct.price)}%</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#F3F6F8] rounded-xl px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-[#080C1A]">{detailProduct.stock}</p>
                  <p className="text-[10px] text-[#6A7686] font-semibold">Stok</p>
                </div>
                <div className="bg-[#F3F6F8] rounded-xl px-3 py-2.5 text-center">
                  <p className={`text-lg font-bold ${detailProduct.isExpired ? 'text-red-500' : 'text-[#080C1A]'}`}>{detailProduct.expiredIn}</p>
                  <p className="text-[10px] text-[#6A7686] font-semibold">Masa Berlaku</p>
                </div>
                <div className="bg-[#F3F6F8] rounded-xl px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-[#080C1A]">{detailProduct.createdAt}</p>
                  <p className="text-[10px] text-[#6A7686] font-semibold">Dibuat</p>
                </div>
              </div>

              {detailProduct.description && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-[#6A7686] mb-1.5 uppercase tracking-wide">Deskripsi</p>
                  <p className="text-sm text-[#6A7686] leading-relaxed">{detailProduct.description}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-[#E5E7EB]">
                <button onClick={() => { setDetailProduct(null); setConfirmDelete(detailProduct.id) }} className="flex-1 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><Trash2 className="size-4" /> Hapus Produk</button>
                <button onClick={() => setDetailProduct(null)} className="flex-1 px-4 py-3 rounded-xl ring-1 ring-[#E5E7EB] font-bold text-sm hover:bg-[#F3F6F8] transition-all">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="mx-auto size-14 rounded-2xl bg-red-100 flex items-center justify-center mb-3"><Trash2 className="size-7 text-red-500" /></div>
            <h3 className="text-xl font-bold mb-2">Hapus Produk</h3>
            <p className="text-[#6A7686] text-sm mb-6">Produk akan dihapus permanen. Lanjutkan?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-3 rounded-full ring-1 ring-[#E5E7EB] font-bold text-sm">Batal</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-3 rounded-full bg-red-500 text-white font-bold text-sm hover:bg-red-600">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
