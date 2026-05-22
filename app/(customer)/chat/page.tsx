'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Store, Clock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Conversation {
  id: string
  store_id: string
  customer_id: string
  stores: { store_name: string; logo_url: string }
  messages: { message: string; created_at: string; is_read: boolean; sender_id: string }[]
}

export default function ChatListPage() {
  const supabase = createClient()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        const { data, error } = await supabase
          .from('conversations')
          .select(`
            id, store_id, customer_id,
            stores ( store_name, logo_url ),
            messages ( message, created_at, is_read, sender_id )
          `)
          .eq('customer_id', user.id)
          .order('id', { ascending: false })

        if (error) throw error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setConvs((data || []) as any)
      } catch (err: any) {
        console.error('Chat error:', err)
        toast.error(`Gagal memuat percakapan: ${err?.message || 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConvs()
  }, [supabase])

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="bg-white border-b border-dark/5 px-5 pt-12 pb-5 sticky top-0 z-20">
        <h1 className="font-poppins font-extrabold text-xl text-dark">Percakapan</h1>
        <p className="text-xs text-dark/50 mt-0.5">Chat langsung dengan mitra toko</p>
      </div>

      <div className="px-5 py-6 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-dark/5" />)}
          </div>
        ) : convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-teal/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-primary-teal/50" />
            </div>
            <p className="font-poppins font-bold text-dark/60">Belum Ada Percakapan</p>
            <p className="text-xs text-dark/40 mt-1 max-w-xs">Mulai chat dengan toko dari halaman detail produk.</p>
          </div>
        ) : (
          convs.map(conv => {
            const store = conv.stores as any
            // Get the last message
            const msgs = (conv.messages as any[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            const lastMsg = msgs[0]
            const unreadCount = msgs.filter(m => !m.is_read && m.sender_id !== userId).length

            return (
              <Link key={conv.id} href={`/chat/${conv.id}`} className="bg-white rounded-2xl border border-dark/5 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.99]">
                <div className="w-12 h-12 rounded-full bg-primary-teal/10 flex items-center justify-center shrink-0">
                  <Store className="w-6 h-6 text-primary-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-dark truncate">{store?.store_name || 'Toko'}</h3>
                    {lastMsg && (
                      <span className="text-[10px] text-dark/40 font-medium shrink-0 ml-2">
                        <Clock className="inline w-3 h-3 mr-0.5" />
                        {new Date(lastMsg.created_at).toLocaleDateString('id-ID', { dateStyle: 'short' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-dark/50 mt-0.5 truncate">
                    {lastMsg ? lastMsg.message : 'Belum ada pesan'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-primary-teal text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                    {unreadCount}
                  </div>
                )}
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
