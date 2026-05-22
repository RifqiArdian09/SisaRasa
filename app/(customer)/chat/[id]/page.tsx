'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Send, ArrowLeft, Store, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface Message {
  id: string
  sender_id: string
  message: string
  image_url: string | null
  is_read: boolean
  created_at: string
}

interface Conversation {
  id: string
  store_id: string
  stores: { store_name: string; logo_url: string }
}

export default function ChatDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const conversationId = params?.id as string

  const [conv, setConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userId, setUserId] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUserId(user.id)

        // Fetch conversation
        const { data: convData } = await supabase
          .from('conversations')
          .select('id, store_id, stores(store_name, logo_url)')
          .eq('id', conversationId)
          .single()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (convData) setConv(convData as any)

        // Fetch messages
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
        setMessages(msgs || [])

        // Mark messages as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
      } catch (err: any) {
        console.error('Chat error:', err)
        toast.error(`Gagal memuat percakapan: ${err?.message || 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init()

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, conversationId, router])

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setSending(true)
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        message: trimmed,
        is_read: false,
      })
      if (error) throw error
      setText('')
    } catch {
      toast.error('Gagal mengirim pesan.')
    } finally {
      setSending(false)
    }
  }

  const store = conv?.stores as any

  return (
    <div className="flex flex-col h-screen bg-cream-bg">
      {/* Header */}
      <div className="bg-white border-b border-dark/5 px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <Link href="/chat" className="p-2 rounded-xl hover:bg-cream-bg text-dark/60 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-primary-teal/10 flex items-center justify-center">
          <Store className="w-5 h-5 text-primary-teal" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-dark">{loading ? '...' : store?.store_name || 'Toko'}</h2>
          <p className="text-[10px] text-primary-teal font-semibold">● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary-teal/10 flex items-center justify-center mb-3">
              <Store className="w-8 h-8 text-primary-teal/50" />
            </div>
            <p className="text-sm font-bold text-dark/50">Mulai percakapan</p>
            <p className="text-xs text-dark/35 mt-1">Tanyakan ketersediaan atau detail makanan</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === userId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                  isMe
                    ? 'bg-primary-teal text-white rounded-br-sm'
                    : 'bg-white border border-dark/5 text-dark rounded-bl-sm'
                }`}>
                  {msg.image_url && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-2">
                      <Image src={msg.image_url} alt="foto" fill sizes="300px" className="object-cover" />
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-dark/40'} text-right`}>
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-dark/5 px-4 py-3 flex items-center gap-2">
        <button className="p-2 rounded-xl text-dark/40 hover:bg-cream-bg transition-colors">
          <ImageIcon className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Tulis pesan..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-cream-bg border border-dark/5 text-sm text-dark placeholder-dark/35 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/10 outline-none transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="p-2.5 rounded-xl bg-primary-teal text-white disabled:opacity-40 hover:opacity-90 transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
