'use client'

import { useState, useEffect } from 'react'
import { Save, User, Shield, Loader2, Camera, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar_url: ''
  })
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      // If user is not logged in (e.g., viewing without proper auth flow), we handle gracefully
      if (authError || !authUser) {
        toast.error('Anda belum login.')
        setLoading(false)
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError) throw userError

      setUser(userData)
      setFormData({
        name: userData.name || '',
        email: userData.email || authUser.email || '',
        avatar_url: userData.avatar_url || ''
      })
    } catch (error: any) {
      toast.error('Gagal mengambil profil: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profil berhasil diperbarui!')
    } catch (error: any) {
      toast.error('Gagal memperbarui profil: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Password baru dan konfirmasi tidak cocok!')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password harus memiliki minimal 6 karakter.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error
      
      toast.success('Password berhasil diperbarui!')
      setPasswordData({ newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      toast.error('Gagal mengubah password: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    
    setSaving(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      
      const { error: updateError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
      if (updateError) throw updateError
      
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      toast.success('Foto profil berhasil diupload!')
    } catch (error: any) {
      toast.error('Gagal upload foto: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="size-10 animate-spin text-[#0F766E] mb-4" />
        <p className="text-[#6A7686] font-medium text-lg">Memuat Profil...</p>
      </div>
    )
  }

  return (
    <div className="p-5 md:p-8 pb-24 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-bold text-2xl">Pengaturan Profil</h1>
        <p className="text-sm text-[#6A7686] mt-0.5">Kelola informasi pribadi akun Admin Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Avatar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-3xl p-6 ring-1 ring-[#E5E7EB] shadow-sm flex flex-col items-center text-center">
            <div className="relative size-32 rounded-full overflow-hidden bg-[#F3F6F8] mb-4 ring-4 ring-white shadow-lg">
              {formData.avatar_url ? (
                <Image src={formData.avatar_url} alt="Profile" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#0F766E]/10 text-[#0F766E] text-4xl font-bold">
                  {formData.name.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
              {/* Overlay change photo */}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="size-8 text-white" />
                <input type="file" accept="image/*" onChange={handleUploadPhoto} className="hidden" />
              </label>
            </div>
            <h3 className="font-bold text-lg">{formData.name || 'Admin SisaRasa'}</h3>
            <p className="text-sm text-[#6A7686]">{user?.role?.toUpperCase() || 'ADMIN'}</p>
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Form Profil */}
          <div className="bg-white rounded-3xl p-6 ring-1 ring-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><User className="size-5" /></div>
              <h3 className="font-bold text-lg">Informasi Dasar</h3>
            </div>
            
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F8FAFC] rounded-2xl ring-1 ring-[#E5E7EB] outline-none focus:ring-[#0F766E] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email (Hanya Baca)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
                  <input 
                    type="email" 
                    value={formData.email}
                    disabled
                    className="w-full pl-11 pr-4 py-3 bg-[#E5E7EB]/30 text-[#6A7686] rounded-2xl ring-1 ring-[#E5E7EB] outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0F766E] text-white rounded-full font-bold text-sm hover:bg-[#0D655E] transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>

          {/* Form Password */}
          <div className="bg-white rounded-3xl p-6 ring-1 ring-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Shield className="size-5" /></div>
              <h3 className="font-bold text-lg">Keamanan</h3>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
                  <input 
                    type="password" 
                    placeholder="Minimal 6 karakter"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] rounded-2xl ring-1 ring-[#E5E7EB] outline-none focus:ring-[#0F766E] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Konfirmasi Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
                  <input 
                    type="password" 
                    placeholder="Ulangi password baru"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] rounded-2xl ring-1 ring-[#E5E7EB] outline-none focus:ring-[#0F766E] transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  disabled={saving || !passwordData.newPassword}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-[#080C1A] ring-1 ring-[#E5E7EB] rounded-full font-bold text-sm hover:ring-[#0F766E] hover:text-[#0F766E] transition-all disabled:opacity-50"
                >
                  Ubah Password
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
