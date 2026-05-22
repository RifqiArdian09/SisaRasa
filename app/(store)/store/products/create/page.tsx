'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Plus, Trash } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import Image from 'next/image'

interface Category {
  id: string
  name: string
}

export default function CreateProductPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [stock, setStock] = useState('')
  
  // Expiration settings (Default: 12 hours from now)
  const defaultExpiredDate = new Date()
  defaultExpiredDate.setHours(defaultExpiredDate.getHours() + 12)
  
  const [expiredDate, setExpiredDate] = useState(defaultExpiredDate.toISOString().split('T')[0])
  const [expiredTime, setExpiredTime] = useState(
    defaultExpiredDate.toTimeString().split(' ')[0].substring(0, 5)
  )

  // Images state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')
      if (!error && data) {
        setCategories(data)
        if (data.length > 0) setCategoryId(data[0].id)
      }
    }
    fetchCategories()
  }, [])

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setGalleryFiles(prev => [...prev, ...files])
      const previews = files.map(file => URL.createObjectURL(file))
      setGalleryPreviews(prev => [...prev, ...previews])
    }
  }

  const removeGalleryImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index))
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index))
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

    setLoading(true)
    try {
      // Get current logged-in user store
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Silakan login terlebih dahulu.')

      const { data: store, error: storeErr } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (storeErr || !store) throw new Error('Gagal mencocokkan profil toko Anda.')

      // Process expired datetime
      const expiredAt = new Date(`${expiredDate}T${expiredTime}:00`).toISOString()

      let thumbnail_url = ''
      if (thumbnailFile) {
        try {
          thumbnail_url = await handleUploadImage(thumbnailFile, store.id)
        } catch (err) {
          console.warn('Storage bucket might not exist or failed upload. Using dummy thumbnail.', err)
          thumbnail_url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
        }
      }

      // Insert primary product
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .insert({
          store_id: store.id,
          category_id: categoryId || null,
          title,
          description,
          original_price: parseFloat(originalPrice),
          discount_price: parseFloat(discountPrice),
          stock: parseInt(stock),
          expired_at: expiredAt,
          thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
          is_active: true
        })
        .select()
        .single()

      if (prodErr || !product) throw prodErr

      // Insert gallery images into public.product_images
      if (galleryFiles.length > 0) {
        const imageInsertions = []
        for (const file of galleryFiles) {
          try {
            const url = await handleUploadImage(file, store.id)
            imageInsertions.push({
              product_id: product.id,
              image_url: url
            })
          } catch (err) {
            console.error('Failed uploading gallery image', err)
          }
        }

        if (imageInsertions.length > 0) {
          await supabase.from('product_images').insert(imageInsertions)
        }
      }

      toast.success('Produk makanan berhasil ditambahkan!')
      router.push('/store/products')
      router.refresh()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Gagal menambahkan produk baru.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header link */}
      <Link 
        href="/store/products"
        className="flex items-center gap-2 text-sm font-semibold text-primary-teal hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Produk
      </Link>

      <div>
        <h1 className="text-3xl font-poppins font-extrabold text-dark tracking-tight">
          Tambah Makanan Baru
        </h1>
        <p className="text-dark/50 text-sm mt-1">
          Daftarkan sisa makanan berkualitas untuk diselamatkan oleh pembeli.
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
              placeholder="e.g. Croissant Almond Keju, Nasi Goreng Spesial"
              className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/35 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-dark mb-1.5">Deskripsi / Detail Makanan</label>
            <textarea
              id="description" rows={3} value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi makanan, isi porsi, rasa, atau instruksi penyimpanan..."
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
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-semibold text-dark mb-1.5">Stok Porsi *</label>
              <input
                id="stock" type="number" required min={1} value={stock}
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

        {/* Media & Images section */}
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-dark/5 shadow-sm space-y-6">
          <h3 className="text-base font-bold font-poppins text-dark">Foto Makanan</h3>

          {/* Thumbnail Upload */}
          <div>
            <span className="block text-sm font-semibold text-dark mb-2">Foto Utama (Thumbnail) *</span>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative w-40 h-28 bg-dark/5 border border-dashed border-dark/10 rounded-2xl overflow-hidden flex items-center justify-center">
                {thumbnailPreview ? (
                  <Image src={thumbnailPreview} alt="Preview" fill className="object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-dark/20" />
                )}
              </div>
              <label className="cursor-pointer py-2.5 px-4 rounded-xl border border-dark/10 hover:bg-dark/5 text-xs font-bold text-dark transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" /> Pilih Foto Utama
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
              </label>
            </div>
          </div>

          {/* Multiple image gallery upload */}
          <div>
            <span className="block text-sm font-semibold text-dark mb-2">Foto Tambahan (Galeri)</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {galleryPreviews.map((preview, idx) => (
                <div key={idx} className="relative aspect-video bg-dark/5 border rounded-xl overflow-hidden group">
                  <Image src={preview} alt="Gallery Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <label className="cursor-pointer aspect-video bg-dark/5 border border-dashed border-dark/10 hover:bg-dark/10 rounded-xl flex flex-col items-center justify-center text-dark/30 hover:text-dark/50 transition-all">
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Tambah Foto</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
              </label>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3">
          <Link
            href="/store/products"
            className="py-3 px-6 rounded-xl border border-dark/10 hover:bg-dark/5 text-dark font-semibold text-sm transition-colors text-center"
          >
            Batal
          </Link>
          <button
            type="submit" disabled={loading}
            className="py-3 px-8 rounded-xl bg-primary-teal text-white font-poppins font-bold text-sm shadow-lg shadow-primary-teal/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Produk'}
          </button>
        </div>
      </form>
    </div>
  )
}
