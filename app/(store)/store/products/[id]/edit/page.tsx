'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Upload, Trash, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import Image from 'next/image'

interface Category {
  id: string
  name: string
}

interface ProductData {
  id: string
  store_id: string
  category_id: string
  title: string
  description: string
  original_price: number
  discount_price: number
  stock: number
  expired_at: string
  thumbnail_url: string
}

export default function EditProductPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const productId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [stock, setStock] = useState('')
  
  const [expiredDate, setExpiredDate] = useState('')
  const [expiredTime, setExpiredTime] = useState('')
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState('')

  // Images state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')
        if (cats) setCategories(cats)

        // Fetch product
        const { data: prod, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (error || !prod) {
          toast.error('Produk tidak ditemukan atau Anda tidak memiliki akses.')
          router.push('/store/products')
          return
        }

        const product = prod as ProductData
        setTitle(product.title)
        setDescription(product.description || '')
        setCategoryId(product.category_id || '')
        setOriginalPrice(product.original_price.toString())
        setDiscountPrice(product.discount_price.toString())
        setStock(product.stock.toString())
        setExistingThumbnailUrl(product.thumbnail_url || '')

        const expiredDateTime = new Date(product.expired_at)
        setExpiredDate(expiredDateTime.toISOString().split('T')[0])
        setExpiredTime(expiredDateTime.toTimeString().split(' ')[0].substring(0, 5))

      } catch (err) {
        toast.error('Terjadi kesalahan saat memuat data produk.')
      } finally {
        setLoading(false)
      }
    }

    if (productId) fetchData()
  }, [productId])

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const handleUploadImage = async (file: File, storeId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${storeId}/${fileName}`

    // Upload to 'products' bucket
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !originalPrice || !discountPrice || !stock || !expiredDate || !expiredTime) {
      toast.error('Harap lengkapi seluruh kolom input wajib!')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Silakan login terlebih dahulu.')

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!store) throw new Error('Profil toko Anda tidak terdaftar.')

      const expiredAt = new Date(`${expiredDate}T${expiredTime}:00`).toISOString()

      let thumbnail_url = existingThumbnailUrl
      if (thumbnailFile) {
        try {
          thumbnail_url = await handleUploadImage(thumbnailFile, store.id)
        } catch (err) {
          console.warn('Storage bucket might not exist or failed upload. Keeping existing URL.', err)
        }
      }

      const { error: updateErr } = await supabase
        .from('products')
        .update({
          category_id: categoryId || null,
          title,
          description,
          original_price: parseFloat(originalPrice),
          discount_price: parseFloat(discountPrice),
          stock: parseInt(stock),
          expired_at: expiredAt,
          thumbnail_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (updateErr) throw updateErr

      toast.success('Informasi makanan berhasil diupdate!')
      router.push('/store/products')
      router.refresh()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Gagal memperbarui produk.'
      toast.error(errMsg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="w-10 h-10 text-primary-teal animate-spin" />
        <span className="text-sm font-semibold text-dark/60">Memuat detail produk...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link 
        href="/store/products"
        className="flex items-center gap-2 text-sm font-semibold text-primary-teal hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Produk
      </Link>

      <div>
        <h1 className="text-3xl font-poppins font-extrabold text-dark tracking-tight">
          Edit Makanan
        </h1>
        <p className="text-dark/50 text-sm mt-1">
          Perbarui info makanan, harga, sisa porsi, atau batas expired.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-dark/5 shadow-sm space-y-6">
          
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-dark mb-1.5">Nama Makanan *</label>
            <input
              id="title" type="text" required value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Croissant Almond Keju"
              className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/35 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-dark mb-1.5">Deskripsi / Detail Makanan</label>
            <textarea
              id="description" rows={3} value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi makanan..."
              className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/35 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm resize-none"
            />
          </div>

          {/* Row Category & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-dark mb-1.5">Kategori Makanan *</label>
              <select
                id="category" value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
              >
                <option value="">Tanpa Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-semibold text-dark mb-1.5">Stok Porsi *</label>
              <input
                id="stock" type="number" required min={0} value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/35 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
              />
            </div>
          </div>

          {/* Row Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="originalPrice" className="block text-sm font-semibold text-dark mb-1.5">Harga Asli (Rp) *</label>
              <input
                id="originalPrice" type="number" required value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="e.g. 30000"
                className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/35 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
              />
            </div>

            <div>
              <label htmlFor="discountPrice" className="block text-sm font-semibold text-dark mb-1.5">Harga Penyelamatan / Diskon (Rp) *</label>
              <input
                id="discountPrice" type="number" required value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/35 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
              />
            </div>
          </div>

          {/* Row Expiration Limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="expiredDate" className="block text-sm font-semibold text-dark mb-1.5">Tanggal Batas Konsumsi *</label>
              <input
                id="expiredDate" type="date" required value={expiredDate}
                onChange={(e) => setExpiredDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
              />
            </div>

            <div>
              <label htmlFor="expiredTime" className="block text-sm font-semibold text-dark mb-1.5">Jam Batas Konsumsi *</label>
              <input
                id="expiredTime" type="time" required value={expiredTime}
                onChange={(e) => setExpiredTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Thumbnail Upload section */}
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-dark/5 shadow-sm space-y-6">
          <h3 className="text-base font-bold font-poppins text-dark">Foto Makanan</h3>

          <div>
            <span className="block text-sm font-semibold text-dark mb-2">Foto Utama (Thumbnail) *</span>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative w-40 h-28 bg-dark/5 border border-dashed border-dark/10 rounded-2xl overflow-hidden flex items-center justify-center">
                {thumbnailPreview ? (
                  <Image src={thumbnailPreview} alt="Preview" fill className="object-cover" />
                ) : existingThumbnailUrl ? (
                  <Image src={existingThumbnailUrl} alt="Current" fill className="object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-dark/20" />
                )}
              </div>
              <label className="cursor-pointer py-2.5 px-4 rounded-xl border border-dark/10 hover:bg-dark/5 text-xs font-bold text-dark transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" /> Ganti Foto Utama
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Link
            href="/store/products"
            className="py-3 px-6 rounded-xl border border-dark/10 hover:bg-dark/5 text-dark font-semibold text-sm transition-colors text-center"
          >
            Batal
          </Link>
          <button
            type="submit" disabled={saving}
            className="py-3 px-8 rounded-xl bg-primary-teal text-white font-poppins font-bold text-sm shadow-lg shadow-primary-teal/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}
