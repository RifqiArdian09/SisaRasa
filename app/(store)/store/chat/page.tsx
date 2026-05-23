'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, User, Clock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Conversation {
  id: string
  customer_id: string
  users: { name: string; avatar_url: string }
  messages: { message: string; created_at: string; is_read: boolean; sender_id: string }[]
}

export default function StoreChatListPage() {
  const supabase = createClient()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [storeUserId, setStoreUserId] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchConvs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setStoreUserId(user.id)

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!store) return

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id, customer_id,
          users ( name, avatar_url ),
          messages ( message, created_at, is_read, sender_id )
        `)
        .eq('store_id', store.id)
        .order('id', { ascending: false })

      if (error) throw error
      setConvs((data || []) as any)
    } catch (err: any) {
      toast.error(`Gagal memuat percakapan: ${err?.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConvs()

    // Realtime for new messages
    const channel = supabase
      .channel('store-chat-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchConvs()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const totalUnread = convs.reduce((sum, conv) => {
    const msgs = conv.messages as any[]
    return sum + msgs.filter(m => !m.is_read && m.sender_id !== storeUserId).length
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-poppins font-extrabold text-dark tracking-tight">Pesan Masuk</h1>
          <p className="text-dark/50 text-sm mt-1">Chat langsung dengan pelanggan Anda.</p>
        </div>
        {totalUnread > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-teal/10 text-primary-teal text-sm font-bold">
            <MessageCircle className="w-4 h-4" />
            {totalUnread} belum dibaca
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-dark/5" />
          ))}
        </div>
      ) : convs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-16 text-center flex flex-col items-center">
          <MessageCircle className="w-12 h-12 text-dark/20 mb-4" />
          <h3 className="text-lg font-bold text-dark font-poppins">Belum Ada Pesan</h3>
          <p className="text-sm text-dark/50 mt-1">Pelanggan belum menghubungi toko Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {convs.map(conv => {
            const customer = conv.users as any
            const msgs = (conv.messages as any[]).sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            const lastMsg = msgs[0]
            const unreadCount = msgs.filter(m => !m.is_read && m.sender_id !== storeUserId).length

            return (
              <Link
                key={conv.id}
                href={`/store/chat/${conv.id}`}
                className="bg-white rounded-2xl border border-dark/5 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary-teal/10 flex items-center justify-center shrink-0 relative">
                  <User className="w-6 h-6 text-primary-teal" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-teal text-white text-[10px] font-extrabold flex items-center justify-center">
                      {unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-dark truncate">{customer?.name || 'Pelanggan'}</h3>
                    {lastMsg && (
                      <span className="text-[10px] text-dark/40 font-medium shrink-0 ml-2 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(lastMsg.created_at).toLocaleDateString('id-ID', { dateStyle: 'short' })}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${unreadCount > 0 ? 'font-semibold text-dark' : 'text-dark/50'}`}>
                    {lastMsg ? lastMsg.message || '📷 Gambar' : 'Belum ada pesan'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
