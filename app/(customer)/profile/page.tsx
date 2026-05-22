'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  User, Mail, Phone, LogOut, Settings,
  ChevronRight, ShoppingBag, Heart, Star, Shield,
  Edit3, Camera
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role: string
}

interface Stats {
  totalOrders: number
  totalSaved: number
  favorites: number
}

const menuItems = [
  { href: '/orders', icon: ShoppingBag, label: 'Riwayat Pesanan', color: 'text-primary-teal' },
  { href: '/favorites', icon: Heart, label: 'Toko Favorit', color: 'text-red-500' },
  { href: '/chat', icon: Mail, label: 'Percakapan', color: 'text-primary-orange' },
]

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalSaved: 0, favorites: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single()
        if (prof) {
          setProfile(prof as Profile)
          setFormName(prof.name || '')
          setFormPhone(prof.phone || '')
        }

        const { count: ordCount } = await supabase
          .from('orders').select('*', { count: 'exact', head: true })
          .eq('customer_id', user.id).eq('status', 'selesai')

        const { count: favCount } = await supabase
          .from('favorites').select('*', { count: 'exact', head: true })
          .eq('customer_id', user.id)

        const { data: items } = await supabase
          .from('order_items')
          .select('quantity, orders!inner(customer_id, status)')
          .eq('orders.customer_id', user.id)
          .eq('orders.status', 'selesai')

        const saved = (items || []).reduce((s, i) => s + (i.quantity || 0), 0)
        setStats({ totalOrders: ordCount || 0, totalSaved: saved, favorites: favCount || 0 })
      } catch {
        toast.error('Gagal memuat profil.')
      } finally {
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile()
  }, [supabase, router])

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Nama tidak boleh kosong.'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('users').update({ name: formName, phone: formPhone }).eq('id', user.id)
      if (error) throw error
      setProfile(prev => prev ? { ...prev, name: formName, phone: formPhone } : null)
      setEditing(false)
      toast.success('Profil berhasil diperbarui!')
    } catch {
      toast.error('Gagal menyimpan perubahan.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Berhasil keluar. Sampai jumpa!')
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-cream-bg">
      <div className="animate-pulse px-5 pt-14 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-dark/10" />
          <div className="h-5 w-36 bg-dark/10 rounded" />
          <div className="h-4 w-24 bg-dark/10 rounded" />
        </div>
        <div className="h-24 bg-dark/5 rounded-2xl" />
        {[1,2,3].map(i => <div key={i} className="h-14 bg-dark/5 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Header bg gradient */}
      <div className="bg-gradient-to-br from-primary-teal to-light-teal h-44 relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white" />
        </div>
      </div>

      {/* Avatar + Name — overlap header */}
      <div className="px-5 -mt-16 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-white bg-primary-teal/20 flex items-center justify-center shadow-lg overflow-hidden">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.name} fill sizes="80px" className="object-cover" />
              ) : (
                <span className="text-2xl font-extrabold text-primary-teal font-poppins">
                  {profile?.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary-orange border-2 border-white flex items-center justify-center shadow-sm">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <h2 className="font-poppins font-extrabold text-dark text-xl mt-3">{profile?.name || '—'}</h2>
          <span className="text-xs font-bold text-primary-teal bg-primary-teal/10 px-3 py-1 rounded-full mt-1 capitalize">
            {profile?.role === 'customer' ? '🚶 Pembeli' : profile?.role}
          </span>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-4 grid grid-cols-3 divide-x divide-dark/5 mb-5">
          {[
            { label: 'Pesanan', value: stats.totalOrders },
            { label: 'Porsi Selamat', value: stats.totalSaved },
            { label: 'Favorit', value: stats.favorites },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 px-3">
              <span className="text-xl font-extrabold text-dark font-poppins">{value}</span>
              <span className="text-[10px] text-dark/40 font-semibold">{label}</span>
            </div>
          ))}
        </div>

        {/* Edit Profile */}
        {editing ? (
          <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-5 mb-5 space-y-4">
            <h3 className="font-poppins font-bold text-dark">Edit Profil</h3>
            <div>
              <label className="text-xs font-semibold text-dark/60 block mb-1">Nama Lengkap</label>
              <input
                value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-dark/10 text-sm text-dark bg-cream-bg focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-dark/60 block mb-1">Nomor HP</label>
              <input
                value={formPhone || ''} onChange={e => setFormPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-dark/10 text-sm text-dark bg-cream-bg focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 outline-none transition-all"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl border border-dark/10 text-sm font-semibold text-dark hover:bg-dark/5">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-teal text-white text-sm font-bold shadow-sm disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-5 mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-poppins font-bold text-dark text-sm">Informasi Akun</h3>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-primary-teal font-bold hover:underline">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            {[
              { icon: User, label: 'Nama', value: profile?.name },
              { icon: Mail, label: 'Email', value: profile?.email },
              { icon: Phone, label: 'Nomor HP', value: profile?.phone || '(belum diisi)' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cream-bg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary-teal" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-dark/40 font-semibold">{label}</p>
                  <p className="text-sm text-dark font-medium truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Menu Links */}
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm divide-y divide-dark/5 mb-5 overflow-hidden">
          {menuItems.map(({ href, icon: Icon, label, color }) => (
            <a key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-cream-bg transition-colors">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="flex-1 text-sm font-semibold text-dark">{label}</span>
              <ChevronRight className="w-4 h-4 text-dark/30" />
            </a>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-all mb-8"
        >
          <LogOut className="w-4 h-4" /> Keluar dari Akun
        </button>
      </div>
    </div>
  )
}
