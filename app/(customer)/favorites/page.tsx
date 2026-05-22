'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, MapPin, Star, ChevronRight, Store } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface FavoriteStore {
  id: string
  stores: {
    id: string
    store_name: string
    description: string
    address: string
    logo_url: string
    banner_url: string
    is_verified: boolean
  }
}

export default function FavoritesPage() {
  const supabase = createClient()
  const [favorites, setFavorites] = useState<FavoriteStore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('favorites')
          .select(`
            id,
            stores (
              id, store_name, description, address,
              logo_url, banner_url, is_verified
            )
          `)
          .eq('customer_id', user.id)
          .order('id', { ascending: false })

        if (error) throw error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFavorites((data || []) as any)
      } catch {
        toast.error('Gagal memuat toko favorit.')
      } finally {
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFavorites()
  }, [supabase])

  const handleUnfavorite = async (favoriteId: string, storeName: string) => {
    try {
      const { error } = await supabase.from('favorites').delete().eq('id', favoriteId)
      if (error) throw error
      setFavorites(prev => prev.filter(f => f.id !== favoriteId))
      toast.success(`${storeName} dihapus dari favorit.`)
    } catch {
      toast.error('Gagal menghapus favorit.')
    }
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Header */}
      <div className="bg-white border-b border-dark/5 px-5 pt-12 pb-5 sticky top-0 z-20">
        <h1 className="font-poppins font-extrabold text-xl text-dark">Toko Favorit</h1>
        <p className="text-xs text-dark/50 mt-0.5">
          {loading ? '...' : `${favorites.length} toko tersimpan`}
        </p>
      </div>

      <div className="px-5 py-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-dark/5" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-red-300" />
            </div>
            <p className="font-poppins font-bold text-dark/60 text-base">Belum Ada Favorit</p>
            <p className="text-xs text-dark/40 mt-1 max-w-xs">
              Tambahkan toko ke favorit untuk mendapatkan notifikasi saat mereka upload makanan baru.
            </p>
            <Link href="/foods" className="mt-5 py-2.5 px-6 rounded-xl bg-primary-orange text-white text-sm font-bold shadow-sm hover:-translate-y-0.5 transition-all">
              Jelajahi Toko
            </Link>
          </div>
        ) : (
          favorites.map(fav => {
            const store = fav.stores as any
            return (
              <div key={fav.id} className="bg-white rounded-2xl border border-dark/5 shadow-sm overflow-hidden">
                {/* Banner */}
                <div className="relative h-24 bg-gradient-to-br from-primary-teal/20 to-light-teal/20">
                  {store.banner_url && (
                    <Image src={store.banner_url} alt={store.store_name} fill sizes="100vw" className="object-cover opacity-60" />
                  )}
                  {/* Unfavorite btn */}
                  <button
                    onClick={() => handleUnfavorite(fav.id, store.store_name)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-red-500 hover:scale-110 transition-all"
                  >
                    <Heart className="w-4 h-4 fill-red-500" />
                  </button>
                </div>

                <div className="px-4 pb-4 -mt-5 relative">
                  {/* Logo */}
                  <div className="w-12 h-12 rounded-xl border-2 border-white bg-white shadow-sm overflow-hidden mb-2">
                    {store.logo_url ? (
                      <Image src={store.logo_url} alt={store.store_name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-primary-teal/10 flex items-center justify-center">
                        <Store className="w-6 h-6 text-primary-teal" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-poppins font-bold text-dark text-sm truncate">{store.store_name}</h3>
                        {store.is_verified && (
                          <span className="shrink-0 text-[9px] font-extrabold bg-primary-teal/10 text-primary-teal px-2 py-0.5 rounded-full">✓ TERVERIFIKASI</span>
                        )}
                      </div>
                      {store.address && (
                        <p className="text-xs text-dark/50 flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {store.address}
                        </p>
                      )}
                      {store.description && (
                        <p className="text-xs text-dark/60 mt-1 line-clamp-2">{store.description}</p>
                      )}
                    </div>
                    <Link
                      href={`/stores/${store.id}`}
                      className="shrink-0 ml-3 py-2 px-3 rounded-xl bg-primary-teal text-white text-xs font-bold flex items-center gap-1 hover:opacity-90 transition-all"
                    >
                      Kunjungi <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
