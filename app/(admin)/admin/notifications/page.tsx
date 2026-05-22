'use client'

import { useState, useEffect } from 'react'
import { Bell, Search, CheckCircle2, Trash2, Loader2, Info, AlertCircle, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => { fetchNotifications() }, [])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`id, title, body, type, is_read, created_at, users ( name )`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error: any) {
      toast.error('Gagal mengambil data notifikasi: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'order': return <ShoppingBag className="size-5 text-blue-600" />
      case 'system': return <Info className="size-5 text-[#0F766E]" />
      case 'alert': return <AlertCircle className="size-5 text-red-600" />
      default: return <Bell className="size-5 text-orange-600" />
    }
  }

  const getBgColor = (type: string) => {
    switch(type) {
      case 'order': return 'bg-blue-50'
      case 'system': return 'bg-teal-50'
      case 'alert': return 'bg-red-50'
      default: return 'bg-orange-50'
    }
  }

  const filtered = notifications.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.body.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-5 md:p-8 pb-24 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bold text-2xl">Notifikasi</h1>
          <p className="text-sm text-[#6A7686] mt-0.5">Riwayat pesan sistem dan aktivitas pengguna</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
          <input type="text" placeholder="Cari isi notifikasi..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl ring-1 ring-[#E5E7EB] text-sm outline-none focus:ring-[#0F766E] shadow-sm" />
        </div>
      </div>

      <div className="rounded-3xl ring-1 ring-[#E5E7EB] bg-white shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-[#0F766E] mb-3" />
            <p className="text-[#6A7686] font-medium">Memuat notifikasi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="size-10 text-[#E5E7EB] mb-3" />
            <p className="font-bold text-sm">Tidak ada notifikasi</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {filtered.map(n => (
              <div key={n.id} className={`p-5 flex gap-4 hover:bg-[#F8FAFC] transition-all ${!n.is_read ? 'bg-[#F3F6F8]/40' : ''}`}>
                <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${getBgColor(n.type)}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm text-[#080C1A]">{n.title}</h4>
                    <span className="text-xs text-[#6A7686] shrink-0">
                      {new Date(n.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-[#6A7686] leading-relaxed mb-1">{n.body}</p>
                  <p className="text-xs font-medium text-[#0F766E]">Kepada: {n.users?.name || 'Semua Pengguna'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
