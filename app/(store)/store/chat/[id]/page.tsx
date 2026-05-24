'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Send, ArrowLeft, User } from 'lucide-react'
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
  customer_id: string
  users: { name: string; avatar_url: string }
}

export default function StoreChatDetailPage() {
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
  const userIdRef = useRef('')
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (data) {
      setMessages(data)
      const unread = data.filter(m => !m.is_read && m.sender_id !== userIdRef.current)
      if (unread.length > 0) {
        await supabase.from('messages').update({ is_read: true }).in('id', unread.map(m => m.id))
      }
    }
  }, [supabase, conversationId])

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUserId(user.id)
        userIdRef.current = user.id

        const { data: convData } = await supabase
          .from('conversations')
          .select('id, customer_id, users(name, avatar_url)')
          .eq('id', conversationId)
          .single()
        if (convData) setConv(convData as any)

        await fetchMessages()
      } catch (err: any) {
        toast.error(`Gagal memuat percakapan: ${err?.message}`)
      } finally {
        setLoading(false)
      }
    }
    init()

    const channel = supabase
      .channel(`store-chat-detail-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === (payload.new as Message).id)) return prev
            return [...prev, payload.new as Message]
          })
          if ((payload.new as Message).sender_id !== userIdRef.current) {
            supabase.from('messages').update({ is_read: true }).eq('id', (payload.new as Message).id)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (!pollingRef.current) pollingRef.current = setInterval(fetchMessages, 3000)
        }
      })

    // Safe polling fallback every 5s
    pollingRef.current = setInterval(fetchMessages, 5000)

    return () => {
      supabase.removeChannel(channel)
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [supabase, conversationId, router, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || !userId) return
    setSending(true)

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      message: trimmed,
      image_url: null,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setText('')

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        message: trimmed,
        is_read: false,
      })
      if (error) {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id))
        setText(trimmed)
        toast.error('Gagal mengirim pesan.')
      } else {
        await fetchMessages()
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setText(trimmed)
      toast.error('Gagal mengirim pesan.')
    } finally {
      setSending(false)
    }
  }

  const customer = (conv?.users) as any

  const formatDateSep = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Hari ini'
    if (d.toDateString() === yesterday.toDateString()) return 'Kemarin'
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const shouldShowDateSep = (idx: number) => {
    if (idx === 0) return true
    const curr = new Date(messages[idx].created_at).toDateString()
    const prev = new Date(messages[idx - 1].created_at).toDateString()
    return curr !== prev
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-[#F8FAFC] rounded-2xl overflow-hidden border border-dark/5 shadow-sm">
      {/* Header */}
      <div className="bg-white border-b border-dark/5 px-5 py-4 flex items-center gap-3 shrink-0 shadow-sm">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-[#F3F6F8] text-dark/60 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-primary-orange/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-primary-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm text-dark truncate">{loading ? '...' : customer?.name || 'Pelanggan'}</h2>
          <p className="text-[10px] text-primary-teal font-semibold">● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary-orange/10 flex items-center justify-center mb-3">
              <User className="w-8 h-8 text-primary-orange/50" />
            </div>
            <p className="text-sm font-bold text-dark/50">Belum ada pesan</p>
            <p className="text-xs text-dark/35 mt-1">Balas pertanyaan pelanggan di sini</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === userId
              const isTemp = msg.id.startsWith('temp-')
              return (
                <React.Fragment key={msg.id}>
                  {shouldShowDateSep(idx) && (
                    <div className="flex justify-center py-3">
                      <span className="text-[11px] font-bold text-dark/40 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-dark/5 shadow-sm">
                        {formatDateSep(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 shadow-sm transition-opacity ${isTemp ? 'opacity-60' : 'opacity-100'} ${
                      isMe
                        ? 'bg-primary-teal text-white rounded-br-sm'
                        : 'bg-white border border-dark/5 text-dark rounded-bl-sm'
                    }`}>
                      {msg.image_url && (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-2">
                          <Image src={msg.image_url} alt="foto" fill sizes="300px" className="object-cover" />
                        </div>
                      )}
                      <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-dark/40'} text-right`}>
                        {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        {isMe && !isTemp && <span className="ml-1">{msg.is_read ? ' ✓✓' : ' ✓'}</span>}
                        {isTemp && <span className="ml-1">⏳</span>}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-dark/5 px-5 py-4 flex items-center gap-3 shrink-0">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Balas pesan pelanggan..."
          className="flex-1 px-4 py-3 rounded-2xl bg-[#F3F6F8] border border-dark/5 text-sm text-dark placeholder-dark/35 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/10 outline-none transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-11 h-11 rounded-2xl bg-primary-teal text-white disabled:opacity-40 hover:bg-primary-teal/90 transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-md shadow-primary-teal/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
