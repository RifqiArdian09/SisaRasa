'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit3, Trash2, Calendar, Layers, Clock, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface ProductData {
  id: string
  title: string
  description: string
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

export default function MerchantProductDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProductDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('id', productId)
        .single()

      if (error || !data) {
        toast.error('Produk tidak ditemukan.')
        router.push('/store/products')
        return
      }

      setProduct(data as unknown as ProductData)
    } catch (err) {
      toast.error('Terjadi kesalahan memuat detail produk.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (productId) fetchProductDetails()
  }, [productId])

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      toast.success('Produk berhasil dihapus.')
      router.push('/store/products')
    } catch (err) {
      toast.error('Gagal menghapus produk.')
    }
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse max-w-4xl">
        <div className="h-6 w-32 bg-dark/10 rounded-lg" />
        <div className="h-96 bg-dark/5 rounded-2xl" />
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Back */}
      <Link 
        href="/store/products"
        className="flex items-center gap-2 text-sm font-semibold text-primary-teal hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Produk
      </Link>

      <div className="bg-white rounded-2xl border border-dark/5 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 lg:p-8">
        {/* Left: Thumbnail & Badges */}
        <div className="relative aspect-square md:aspect-auto md:h-96 rounded-xl overflow-hidden bg-dark/5">
          {product.thumbnail_url ? (
            <Image 
              src={product.thumbnail_url} 
              alt={product.title} 
              fill 
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover" 
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-dark/20 text-sm font-bold font-poppins">
              No Photo Available
            </div>
          )}

          <div className="absolute top-4 left-4 z-10">
            <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider ${
              product.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {product.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        </div>

        {/* Right: Info panel details */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-1 text-[10px] text-primary-teal font-extrabold uppercase tracking-widest">
              <Layers className="w-3.5 h-3.5" />
              {product.categories?.name || 'Tanpa Kategori'}
            </div>

            <h1 className="text-2xl lg:text-3xl font-poppins font-extrabold text-dark tracking-tight">
              {product.title}
            </h1>

            {/* Prices */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-primary-orange font-poppins">
                {formatPrice(product.discount_price)}
              </span>
              <span className="text-sm line-through text-dark/30 font-semibold">
                {formatPrice(product.original_price)}
              </span>
            </div>

            {/* Stats widgets */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-dark/5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-dark/40 uppercase tracking-wider block">Sisa Stok</span>
                <span className="text-base font-extrabold text-dark font-poppins">{product.stock} Porsi</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-dark/40 uppercase tracking-wider block">Expired At</span>
                <span className="text-xs font-bold text-dark/75 block truncate">
                  {new Date(product.expired_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-extrabold text-dark/40 uppercase tracking-wider">Deskripsi Produk</h4>
              <p className="text-sm text-dark/70 leading-relaxed font-sans">
                {product.description || 'Tidak ada deskripsi untuk makanan ini.'}
              </p>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="flex gap-3 border-t border-dark/5 pt-6">
            <Link
              href={`/store/products/${product.id}/edit`}
              className="flex-1 py-3 px-6 rounded-xl bg-primary-teal text-white font-poppins font-bold text-sm text-center shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> Edit Detail Makanan
            </Link>
            <button
              onClick={handleDelete}
              className="py-3 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
