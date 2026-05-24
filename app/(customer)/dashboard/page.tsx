'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingBag,
  Heart,
  Leaf,
  Search,
  ChevronRight,
  Star,
  Clock,
  MapPin,
  Utensils,
} from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  name: string
  avatar_url: string | null
}

interface Order {
  id: string
  total_price: number
  status: string
  created_at: string
  stores: { store_name: string }
}

interface Stats {
  totalOrders: number
  savedPortions: number
  favoriteStores: number
}

const quickLinks = [
  { href: '/foods', label: 'Jelajahi Makanan', icon: Utensils, color: 'bg-primary-orange/10 text-primary-orange', desc: 'Temukan menu diskon hari ini' },
  { href: '/favorites', label: 'Toko Favorit', icon: Heart, color: 'bg-red-100 text-red-500', desc: 'Pantau toko yang kamu suka' },
  { href: '/orders', label: 'Riwayat Pesanan', icon: ShoppingBag, color: 'bg-primary-teal/10 text-primary-teal', desc: 'Lihat semua pesananmu' },
]

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending:      { label: 'Menunggu',    class: 'bg-amber-100 text-amber-700' },
  diproses:     { label: 'Diproses',   class: 'bg-blue-100 text-blue-700' },
  siap_diambil: { label: 'Siap Ambil', class: 'bg-green-100 text-green-700' },
  selesai:      { label: 'Selesai',    class: 'bg-emerald-100 text-emerald-700' },
  dibatalkan:   { label: 'Batal',      class: 'bg-red-100 text-red-700' },
}

export default function CustomerDashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, savedPortions: 0, favoriteStores: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      if (prof?.role === 'store') router.replace('/store/dashboard')
      else if (prof?.role === 'admin') router.replace('/admin/dashboard')
    }
    checkRole()
  }, [router, supabase])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Profile
        const { data: prof } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single()
        if (prof) setProfile(prof)

        // Orders
        const { data: ords } = await supabase
          .from('orders')
          .select('id, total_price, status, created_at, stores(store_name)')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setOrders((ords || []) as any)

        // Stats
        const { count: orderCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', user.id)
          .eq('status', 'selesai')

        const { count: favCount } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', user.id)

        const { data: items } = await supabase
          .from('order_items')
          .select('quantity, orders!inner(customer_id, status)')
          .eq('orders.customer_id', user.id)
          .eq('orders.status', 'selesai')

        const saved = (items || []).reduce((sum, i) => sum + (i.quantity || 0), 0)

        setStats({
          totalOrders: orderCount || 0,
          savedPortions: saved,
          favoriteStores: favCount || 0,
        })
      } catch {
        toast.error('Gagal memuat data.')
      } finally {
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [supabase])

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

  return (
    <div className="min-h-full bg-cream-bg">
      {/* Top Header */}
      <div className="bg-gradient-to-br from-primary-orange via-[#FF7A00] to-amber-500 pt-safe px-5 pb-12 relative rounded-b-[40px] shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5 pt-4">
            <div>
              {loading ? (
                <div className="h-5 w-32 bg-white/30 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-white/80 text-sm font-medium">Selamat datang kembali</p>
              )}
              <h1 className="text-white font-poppins font-extrabold text-xl tracking-tight">
                {loading ? <span className="inline-block h-6 w-40 bg-white/30 rounded animate-pulse" /> : profile?.name || 'Pengguna'}
              </h1>
            </div>
            <Link href="/profile" className="relative w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill sizes="40px" className="object-cover" />
              ) : (
                profile?.name?.[0]?.toUpperCase() || '?'
              )}
            </Link>
          </div>

          {/* Search Bar */}
          <Link href="/foods" className="flex items-center gap-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3.5 shadow-sm transition-all active:scale-[0.98]">
            <Search className="w-5 h-5 text-white" />
            <span className="text-white/90 text-sm font-medium">Cari makanan diskon...</span>
          </Link>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-5 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-dark/5 border border-dark/5 p-4 flex justify-between">
          {[
            { label: 'Pesanan Selesai', value: stats.totalOrders, icon: ShoppingBag, color: 'text-primary-teal' },
            { label: 'Porsi Terselamatkan', value: stats.savedPortions, icon: Leaf, color: 'text-emerald-600' },
            { label: 'Toko Favorit', value: stats.favoriteStores, icon: Heart, color: 'text-red-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex-1 flex flex-col items-center justify-center gap-1.5 px-2 relative after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-px after:bg-dark/5 last:after:hidden">
              <div className={`p-2 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-center">
                <span className="block text-lg font-extrabold text-dark font-poppins leading-none">{loading ? '—' : value}</span>
                <span className="block text-[9px] text-dark/40 font-semibold mt-1">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-6 space-y-8">
        {/* Quick Actions */}
        <div>
          <h2 className="font-poppins font-bold text-dark text-lg mb-4">Menu Cepat</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickLinks.map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href} className="bg-white rounded-3xl border border-dark/5 shadow-sm p-4 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all active:scale-[0.95]">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="font-bold text-[11px] text-dark leading-tight">{label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-poppins font-bold text-dark text-base">Pesanan Terbaru</h2>
            <Link href="/orders" className="text-xs font-bold text-primary-teal flex items-center gap-0.5">
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-dark/5" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-8 text-center">
              <ShoppingBag className="w-10 h-10 text-dark/20 mx-auto mb-3" />
              <p className="font-bold text-dark/60 text-sm">Belum ada pesanan</p>
              <p className="text-xs text-dark/40 mt-1">Jelajahi makanan diskon dan buat pesanan pertamamu!</p>
              <Link href="/foods" className="mt-4 inline-block py-2 px-5 rounded-xl bg-primary-orange text-white text-xs font-bold shadow-sm hover:-translate-y-0.5 transition-all">
                Explore Makanan
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const s = STATUS_MAP[order.status] ?? { label: order.status, class: 'bg-gray-100 text-gray-600' }
                return (
                  <Link key={order.id} href="/orders" className="bg-white rounded-2xl border border-dark/5 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-[0.99]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-teal/10 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-primary-teal" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-dark">{(order.stores as any)?.store_name || 'Toko'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${s.class}`}>{s.label}</span>
                          <span className="text-[10px] text-dark/40">
                            <Clock className="inline w-3 h-3 mr-0.5" />
                            {new Date(order.created_at).toLocaleDateString('id-ID', { dateStyle: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-primary-orange">{formatPrice(order.total_price)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-primary-teal to-light-teal rounded-2xl p-5 flex items-center justify-between text-white overflow-hidden relative">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative z-10">
            <p className="text-xs font-semibold text-white/80 mb-1">Tips SisaRasa</p>
            <h3 className="font-poppins font-bold text-base leading-snug">Hemat lebih banyak dengan<br />favoritekan toko langgananmu!</h3>
            <Link href="/favorites" className="mt-3 inline-flex items-center gap-1 text-xs font-bold bg-white text-primary-teal px-3 py-1.5 rounded-lg">
              <Star className="w-3 h-3" /> Lihat Favorit
            </Link>
          </div>
          <Leaf className="size-10 text-[#0F766E]/20 relative z-10" />
        </div>
      </div>
    </div>
  )
}
