'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Star, 
  MessageSquare, 
  Send, 
  MessageCircle, 
  Trash2,
  User,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface ReviewReply {
  id: string
  reply: string
  created_at: string
}

interface Review {
  id: string
  rating: number
  comment: string
  image_url: string
  created_at: string
  products: {
    title: string
    thumbnail_url: string
  }
  users: {
    name: string
    avatar_url: string
  }
  review_replies?: ReviewReply | null
}

export default function MerchantReviewsPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState('')
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({})

  const fetchReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!store) return
      setStoreId(store.id)

      // Fetch reviews belonging to the store's products
      // We can do this by selecting reviews and filtering by product's store_id
      // Fetch products first or filter using inner join/relationship
      const { data: revs, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          image_url,
          created_at,
          products!inner (
            title,
            thumbnail_url,
            store_id
          ),
          users (
            name,
            avatar_url
          ),
          review_replies (
            id,
            reply,
            created_at
          )
        `)
        .eq('products.store_id', store.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Flatten nested review replies array into single object since it has UNIQUE(review_id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted = (revs || []).map((r: any) => ({
        ...r,
        review_replies: Array.isArray(r.review_replies) 
          ? r.review_replies[0] || null 
          : r.review_replies || null
      })) as unknown as Review[]

      setReviews(formatted)
    } catch (err) {
      toast.error('Gagal memuat ulasan pelanggan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews()
  }, [])

  const handlePostReply = async (reviewId: string) => {
    const text = replyText[reviewId]?.trim()
    if (!text) {
      toast.error('Harap ketik balasan ulasan terlebih dahulu!')
      return
    }

    setSubmittingReply(prev => ({ ...prev, [reviewId]: true }))
    try {
      const { data, error } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          store_id: storeId,
          reply: text
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Balasan berhasil diposting.')
      setReplyText(prev => ({ ...prev, [reviewId]: '' }))
      
      // Update local reviews list state
      setReviews(prev => 
        prev.map(r => r.id === reviewId ? { ...r, review_replies: data } : r)
      )
    } catch (err) {
      toast.error('Gagal mengirim balasan ulasan.')
    } finally {
      setSubmittingReply(prev => ({ ...prev, [reviewId]: false }))
    }
  }

  const handleDeleteReply = async (replyId: string, reviewId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus balasan ini?')) return

    try {
      const { error } = await supabase
        .from('review_replies')
        .delete()
        .eq('id', replyId)

      if (error) throw error

      toast.success('Balasan ulasan berhasil dihapus.')
      setReviews(prev => 
        prev.map(r => r.id === reviewId ? { ...r, review_replies: null } : r)
      )
    } catch (err) {
      toast.error('Gagal menghapus balasan.')
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star 
        key={idx} 
        className={`w-4 h-4 ${idx < rating ? 'text-primary-orange fill-primary-orange' : 'text-dark/15'}`} 
      />
    ))
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-dark/10 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-dark/5 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-poppins font-extrabold text-dark tracking-tight">
          Ulasan & Rating
        </h1>
        <p className="text-dark/50 text-sm mt-1">
          Dengar tanggapan langsung dari pembeli yang menyelamatkan makanan Anda.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <MessageCircle className="w-12 h-12 text-dark/20 mb-4" />
          <h3 className="text-lg font-bold text-dark font-poppins">Belum Ada Ulasan</h3>
          <p className="text-sm text-dark/50 mt-1 max-w-sm">
            Pelanggan Anda belum menuliskan ulasan untuk makanan yang mereka beli.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-2xl border border-dark/5 shadow-sm space-y-4">
              {/* Reviewer Header info */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cream-bg flex items-center justify-center overflow-hidden shrink-0 border border-dark/5">
                    {review.users?.avatar_url ? (
                      <Image 
                        src={review.users.avatar_url} 
                        alt={review.users.name} 
                        width={40} 
                        height={40} 
                        className="object-cover" 
                      />
                    ) : (
                      <User className="w-5 h-5 text-dark/30" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-dark">
                      {review.users?.name || 'Customer'}
                    </h4>
                    <p className="text-[10px] text-dark/40 font-semibold mt-0.5">
                      {new Date(review.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-0.5">
                  {renderStars(review.rating)}
                </div>
              </div>

              {/* Product and Comment Details */}
              <div className="pl-13 space-y-3">
                <div className="text-xs font-bold text-primary-teal bg-primary-teal/5 border border-primary-teal/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  Membeli: {review.products?.title}
                </div>

                {review.comment && (
                  <p className="text-sm text-dark/80 leading-relaxed font-sans">
                    {review.comment}
                  </p>
                )}

                {review.image_url && (
                  <div className="relative w-40 aspect-video rounded-xl overflow-hidden bg-dark/5 border border-dark/5 mt-2">
                    <Image 
                      src={review.image_url} 
                      alt="Ulasan Makanan" 
                      fill 
                      sizes="160px"
                      className="object-cover" 
                    />
                  </div>
                )}
              </div>

              {/* Replies Section */}
              <div className="pl-13 border-t border-dark/5 pt-4 mt-2">
                {review.review_replies ? (
                  /* Existing Reply Panel */
                  <div className="bg-cream-bg/60 border border-dark/5 rounded-xl p-4 space-y-2 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-primary-teal uppercase tracking-wider">
                        Balasan Toko Anda
                      </span>
                      <button
                        onClick={() => handleDeleteReply(review.review_replies!.id, review.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-dark/80 leading-relaxed">
                      {review.review_replies.reply}
                    </p>
                    <span className="text-[9px] text-dark/30 block text-right font-medium">
                      {new Date(review.review_replies.created_at).toLocaleDateString('id-ID', { dateStyle: 'short' })}
                    </span>
                  </div>
                ) : (
                  /* Reply Input field */
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Tulis balasan terima kasih atau penjelasan kepada pembeli..."
                      value={replyText[review.id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                      className="flex-1 px-4 py-2 rounded-xl border border-dark/10 bg-white text-xs text-dark placeholder-dark/35 focus:border-primary-orange focus:ring-1 focus:ring-primary-orange/20 transition-all outline-none"
                    />
                    <button
                      onClick={() => handlePostReply(review.id)}
                      disabled={submittingReply[review.id]}
                      className="py-2 px-4 rounded-xl bg-primary-teal text-white text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Kirim
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
