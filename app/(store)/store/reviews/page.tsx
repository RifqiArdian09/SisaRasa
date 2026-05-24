'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Star, 
  MessageCircle, 
  User,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

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
}

export default function MerchantReviewsPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

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
          )
        `)
        .eq('products.store_id', store.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews((revs || []) as unknown as Review[])
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


            </div>
          ))}
        </div>
      )}
    </div>
  )
}
