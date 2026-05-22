'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, Trash2, Calendar, MailOpen } from 'lucide-react'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
}

export default function StoreNotificationsPage() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      toast.error('Gagal mengambil daftar notifikasi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      toast.success('Notifikasi ditandai dibaca.')
    } catch (err) {
      toast.error('Gagal memperbarui notifikasi.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notifikasi dihapus.')
    } catch (err) {
      toast.error('Gagal menghapus notifikasi.')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('Semua notifikasi ditandai dibaca.')
    } catch (err) {
      toast.error('Gagal memperbarui notifikasi.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse max-w-3xl">
        <div className="h-10 w-48 bg-dark/10 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-dark/5 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-extrabold text-dark tracking-tight">
            Notifikasi Mitra
          </h1>
          <p className="text-dark/50 text-sm mt-1">
            Riwayat pemesanan baru, ulasan bintang lima, atau pelanggan setia yang memfavoritkan toko Anda.
          </p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-primary-teal text-white rounded-xl text-xs font-bold shadow-md hover:-translate-y-0.5 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <Bell className="w-12 h-12 text-dark/20 mb-4" />
          <h3 className="text-lg font-bold text-dark font-poppins">Tidak Ada Notifikasi</h3>
          <p className="text-sm text-dark/50 mt-1 max-w-xs">
            Belum ada notifikasi atau aktivitas baru untuk akun toko Anda saat ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-5 rounded-2xl border transition-all flex justify-between items-start gap-4 ${
                notif.is_read 
                  ? 'bg-white border-dark/5 shadow-sm opacity-70' 
                  : 'bg-primary-teal/5 border-primary-teal/15 shadow-sm'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${notif.is_read ? 'bg-dark/20' : 'bg-primary-orange animate-pulse'}`} />
                  <h4 className="font-bold text-sm text-dark">
                    {notif.title}
                  </h4>
                </div>
                <p className="text-xs text-dark/70 leading-relaxed pl-4">
                  {notif.body}
                </p>
                <span className="text-[10px] text-dark/40 font-semibold block pl-4">
                  {new Date(notif.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              <div className="flex gap-2">
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="p-2 hover:bg-primary-teal/10 text-primary-teal rounded-lg transition-colors"
                    title="Tandai Dibaca"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notif.id)}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
