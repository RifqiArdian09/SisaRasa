'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Settings, 
  Store as StoreIcon, 
  MapPin, 
  Clock, 
  Upload, 
  Save, 
  RefreshCw 
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import dynamic from 'next/dynamic'

// Dynamically import map location picker to avoid SSR leaflet window errors
const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-dark/5 rounded-2xl flex items-center justify-center text-xs font-semibold text-dark/40 animate-pulse">
      Memuat peta Leaflet...
    </div>
  )
})

interface StoreData {
  id: string
  store_name: string
  description: string
  address: string
  latitude: number
  longitude: number
  logo_url: string
  banner_url: string
  open_time: string
  close_time: string
  is_verified: boolean
}

export default function MerchantSettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeId, setStoreId] = useState('')

  // Form Fields
  const [storeName, setStoreName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState(-6.2088)
  const [longitude, setLongitude] = useState(106.8456)
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('20:00')
  const [isVerified, setIsVerified] = useState(false)

  // Visual Assets Files
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  // Local Previews
  const [logoPreview, setLogoPreview] = useState('')
  const [bannerPreview, setBannerPreview] = useState('')

  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: store, error } = await supabase
          .from('stores')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error || !store) {
          toast.error('Profil toko tidak ditemukan.')
          return
        }

        const storeData = store as StoreData
        setStoreId(storeData.id)
        setStoreName(storeData.store_name)
        setDescription(storeData.description || '')
        setAddress(storeData.address || '')
        setLatitude(storeData.latitude || -6.2088)
        setLongitude(storeData.longitude || 106.8456)
        
        // Strip seconds from open/close time
        setOpenTime(storeData.open_time ? storeData.open_time.substring(0, 5) : '08:00')
        setCloseTime(storeData.close_time ? storeData.close_time.substring(0, 5) : '20:00')
        
        setLogoUrl(storeData.logo_url || '')
        setBannerUrl(storeData.banner_url || '')
        setIsVerified(storeData.is_verified || false)
      } catch (err) {
        toast.error('Gagal mengambil konfigurasi toko.')
      } finally {
        setLoading(false)
      }
    }

    fetchStoreSettings()
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const uploadAsset = async (file: File, bucketName: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${storeId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeName || !address) {
      toast.error('Nama toko dan alamat wajib diisi!')
      return
    }

    setSaving(true)
    try {
      let finalLogoUrl = logoUrl
      let finalBannerUrl = bannerUrl

      // Upload logo if updated
      if (logoFile) {
        try {
          finalLogoUrl = await uploadAsset(logoFile, 'stores')
        } catch (err: any) {
          toast.error(`Gagal upload logo: ${err?.message || 'Periksa bucket storage Supabase'}`)
          setSaving(false)
          return
        }
      }

      // Upload banner if updated
      if (bannerFile) {
        try {
          finalBannerUrl = await uploadAsset(bannerFile, 'stores')
        } catch (err: any) {
          toast.error(`Gagal upload banner: ${err?.message || 'Periksa bucket storage Supabase'}`)
          setSaving(false)
          return
        }
      }

      // Update store details
      const { error } = await supabase
        .from('stores')
        .update({
          store_name: storeName,
          description,
          address,
          latitude,
          longitude,
          logo_url: finalLogoUrl,
          banner_url: finalBannerUrl,
          open_time: `${openTime}:00`,
          close_time: `${closeTime}:00`,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId)

      if (error) throw error

      toast.success('Pengaturan profil toko berhasil diperbarui!')
      router.refresh()
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal memperbarui pengaturan.'
      toast.error(errMsg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="w-10 h-10 text-primary-teal animate-spin" />
        <span className="text-sm font-semibold text-dark/60">Memuat profil toko...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-poppins font-extrabold text-dark tracking-tight">
          Pengaturan Toko
        </h1>
        <p className="text-dark/50 text-sm mt-1">
          Atur banner, deskripsi toko, jam operasional, dan titik peta untuk memudahkan pembeli menemukan Anda.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Banner & Logo configuration */}
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm overflow-hidden">
          {/* Banner container */}
          <div className="relative h-44 bg-dark/5 overflow-hidden">
            {bannerPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerPreview} alt="Banner Preview" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            ) : bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="Store Banner" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-primary-teal/20 to-primary-orange/20 pointer-events-none" />
            )}
            {/* Banner Edit overlay button — z-20 ensures it's always above the image */}
            <label className="absolute right-4 bottom-4 cursor-pointer py-2 px-3 bg-white/90 hover:bg-white backdrop-blur-sm rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all text-dark z-20">
              <Upload className="w-3.5 h-3.5" /> Ganti Banner
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
            </label>
          </div>

          {/* Profile details logo card */}
          <div className="px-8 pb-6 relative flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-10 z-10">
            <div className="relative w-24 h-24 rounded-2xl bg-white border border-dark/10 overflow-hidden shadow-md flex items-center justify-center shrink-0">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover p-1 pointer-events-none" />
              ) : logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Store Logo" className="w-full h-full object-cover p-1 pointer-events-none" />
              ) : (
                <StoreIcon className="w-10 h-10 text-dark/20 pointer-events-none" />
              )}
              {/* Logo edit overlay — z-10 ensures hover works */}
              <label className="absolute inset-0 bg-black/40 hover:bg-black/60 opacity-0 hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity z-10">
                <Upload className="w-4 h-4 mb-1" />
                <span className="text-[9px] font-bold">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
            </div>
            
            <div className="text-center sm:text-left space-y-1">
              <h3 className="font-poppins font-extrabold text-xl text-dark">
                {storeName || 'Nama Toko'}
              </h3>
              <p className="text-xs text-dark/50 font-semibold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                Status Toko: 
                <span className={isVerified ? 'text-green-600 font-extrabold' : 'text-amber-600 font-extrabold'}>
                  {isVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form Details */}
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-dark/5 shadow-sm space-y-6">
          <h4 className="text-base font-bold font-poppins text-dark flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-teal" />
            Informasi Profil Toko
          </h4>

          {/* Store Name */}
          <div>
            <label htmlFor="storeName" className="block text-sm font-semibold text-dark mb-1.5">Nama Toko / UMKM *</label>
            <input
              id="storeName" type="text" required value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Warung Bu Sri, Bakery Mama"
              className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/35 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
            />
          </div>

          {/* Store Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-dark mb-1.5">Deskripsi Toko</label>
            <textarea
              id="description" rows={3} value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan secara singkat jenis makanan yang Anda tawarkan, komitmen penyelamatan pangan, atau cerita toko Anda..."
              className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/35 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm resize-none"
            />
          </div>

          {/* Store Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-dark mb-1.5">Alamat Lengkap Toko *</label>
            <input
              id="address" type="text" required value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Jl. Sudirman No. 12, Jakarta Pusat"
              className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/35 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
            />
          </div>

          {/* Open & Close time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="openTime" className="block text-sm font-semibold text-dark mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary-teal" />
                  Jam Buka Operasional *
                </span>
              </label>
              <input
                id="openTime" type="time" required value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
              />
            </div>

            <div>
              <label htmlFor="closeTime" className="block text-sm font-semibold text-dark mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary-teal" />
                  Jam Tutup Operasional *
                </span>
              </label>
              <input
                id="closeTime" type="time" required value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-white text-dark focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Map Location Picker */}
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-dark/5 shadow-sm space-y-6">
          <h4 className="text-base font-bold font-poppins text-dark flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-orange" />
            Titik Koordinat Lokasi Toko (Map Leaflet)
          </h4>
          <p className="text-xs text-dark/50 leading-relaxed -mt-3">
            Tentukan koordinat toko Anda agar pembeli dapat menghitung jarak pengiriman/pengambilan makanan dengan akurat di radar map.
          </p>

          <LocationPicker 
            lat={latitude} 
            lng={longitude} 
            onChange={(lat, lng) => {
              setLatitude(lat)
              setLongitude(lng)
            }} 
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] font-extrabold text-dark/40 uppercase tracking-widest">Latitude</span>
              <span className="text-xs font-mono font-bold text-dark mt-1 block px-3 py-2 bg-dark/5 rounded-lg">
                {latitude.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-extrabold text-dark/40 uppercase tracking-widest">Longitude</span>
              <span className="text-xs font-mono font-bold text-dark mt-1 block px-3 py-2 bg-dark/5 rounded-lg">
                {longitude.toFixed(6)}
              </span>
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <button
            type="submit" disabled={saving}
            className="py-3 px-8 rounded-xl bg-primary-teal text-white font-poppins font-bold text-sm shadow-lg shadow-primary-teal/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              'Menyimpan...'
            ) : (
              <>
                <Save className="w-4 h-4" /> Simpan Konfigurasi Toko
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
