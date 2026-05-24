'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  User, Mail, LogOut, Settings,
  ChevronRight, ShoppingBag, Heart, Star, Shield,
  Edit3, Camera, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Profile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: string
}

interface Stats {
  totalOrders: number
  totalSaved: number
  favorites: number
}

const menuItems = [
  { href: '/orders', icon: ShoppingBag, label: 'Riwayat Pesanan', color: 'text-[#0F766E]' },
  { href: '/favorites', icon: Heart, label: 'Toko Favorit', color: 'text-red-500' },
  { href: '/chat', icon: Mail, label: 'Percakapan', color: 'text-[#FF8A00]' },
]

export default function ProfilePage() {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalSaved: 0, favorites: 0 })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formName, setFormName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        if (cancelled) return

        const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single()
        if (prof && !cancelled) {
          setProfile(prof as Profile)
          setFormName(prof.name || '')
        }

        if (cancelled) return

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
        if (!cancelled) setStats({ totalOrders: ordCount || 0, totalSaved: saved, favorites: favCount || 0 })
      } catch {
        toast.error('Gagal memuat profil.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchProfile()
    return () => { cancelled = true }
  }, [router])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${user.id}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const avatarUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null)
      toast.success('Foto profil berhasil diupload!')
    } catch (err: any) {
      toast.error('Gagal upload foto: ' + (err.message || ''))
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Nama tidak boleh kosong.'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('users').update({ name: formName }).eq('id', user.id)
      if (error) throw error
      setProfile(prev => prev ? { ...prev, name: formName } : null)
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
    window.location.href = '/login'
  }

  if (loading) return (
    <div className="min-h-full bg-cream-bg overflow-x-hidden">
      <div className="animate-pulse px-5 pt-14 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-[#E5E7EB]" />
          <div className="h-5 w-36 bg-[#E5E7EB] rounded" />
          <div className="h-4 w-24 bg-[#E5E7EB] rounded" />
        </div>
        <div className="h-24 bg-[#E5E7EB] rounded-2xl" />
        {[1,2,3].map(i => <div key={i} className="h-14 bg-[#E5E7EB] rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-full bg-cream-bg overflow-x-hidden">
      <div className="bg-gradient-to-br from-primary-orange via-[#FF7A00] to-amber-500 h-44 relative rounded-b-[40px] shadow-sm">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white" />
        </div>
      </div>

      <div className="px-5 -mt-16 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="relative w-20 h-20 rounded-full border-4 border-white bg-[#0F766E]/20 flex items-center justify-center shadow-lg overflow-hidden">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.name} fill sizes="80px" className="object-cover" />
              ) : (
                <span className="text-2xl font-extrabold text-[#0F766E]">
                  {profile?.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#FF8A00] border-2 border-white flex items-center justify-center shadow-sm hover:bg-[#FF8A00]/90 transition-all"
            >
              {uploading ? <Loader2 className="size-3.5 text-white animate-spin" /> : <Camera className="size-3.5 text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <h2 className="font-bold text-dark text-xl mt-3">{profile?.name || '-'}</h2>
          <span className="text-xs font-bold text-[#0F766E] bg-[#0F766E]/10 px-3 py-1 rounded-full mt-1 capitalize">
            {profile?.role === 'customer' ? 'Pembeli' : profile?.role}
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-dark/5 shadow-sm p-4 flex justify-between mb-5">
          {[
            { label: 'Pesanan', value: stats.totalOrders },
            { label: 'Porsi Selamat', value: stats.totalSaved },
            { label: 'Favorit', value: stats.favorites },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 flex flex-col items-center justify-center gap-1 relative after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-6 after:w-px after:bg-dark/5 last:after:hidden">
              <span className="text-xl font-bold text-dark">{value}</span>
              <span className="text-[10px] text-dark/40 font-semibold">{label}</span>
            </div>
          ))}
        </div>

        {editing ? (
          <div className="bg-white rounded-3xl border border-dark/5 shadow-sm p-6 mb-5 space-y-4">
            <h3 className="font-bold text-dark text-base">Edit Profil</h3>
            <div>
              <label className="text-xs font-semibold text-[#6A7686] block mb-1">Nama Lengkap</label>
              <input
                value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-[#E5E7EB] text-sm text-dark bg-white focus:ring-[#0F766E] outline-none transition-all"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-full ring-1 ring-[#E5E7EB] text-sm font-semibold text-dark hover:bg-[#F3F6F8]">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-full bg-[#0F766E] text-white text-sm font-bold disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dark/5 shadow-sm p-6 mb-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-dark text-base">Informasi Akun</h3>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-[#0F766E] font-bold hover:underline">
                <Edit3 className="size-3.5" /> Edit
              </button>
            </div>
            {[
              { icon: User, label: 'Nama', value: profile?.name },
              { icon: Mail, label: 'Email', value: profile?.email },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F3F6F8] flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-[#0F766E]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#6A7686] font-semibold">{label}</p>
                  <p className="text-sm text-dark font-medium truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-dark/5 shadow-sm divide-y divide-dark/5 mb-5 overflow-hidden">
          {menuItems.map(({ href, icon: Icon, label, color }) => (
            <a key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#F3F6F8] transition-colors">
              <Icon className={`size-4 ${color}`} />
              <span className="flex-1 text-sm font-semibold text-dark">{label}</span>
              <ChevronRight className="size-4 text-[#6A7686]" />
            </a>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-all mb-8 shadow-sm"
        >
          <LogOut className="size-4" /> Keluar dari Akun
        </button>
      </div>
    </div>
  )
}
