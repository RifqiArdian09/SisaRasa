import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMulticastPushNotification } from '@/lib/firebase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify the sender is a store owner
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { product_id } = await request.json()
    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
    }

    // Get the product and store info
    const { data: product } = await supabase
      .from('products')
      .select(`
        title,
        discount_price,
        store:store_id (
          id,
          store_name,
          user_id
        )
      `)
      .eq('id', product_id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify the requester is the store owner
    const store = product.store as unknown as { id: string; store_name: string; user_id: string }
    if (store.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all customers who favorited this store
    const { data: favoritedBy } = await supabase
      .from('favorites')
      .select('customer_id')
      .eq('store_id', store.id)

    if (!favoritedBy || favoritedBy.length === 0) {
      return NextResponse.json({ message: 'No followers to notify', notifiedCount: 0 })
    }

    const customerIds = favoritedBy.map((f: { customer_id: string }) => f.customer_id)

    // Get their FCM tokens
    const { data: customers } = await supabase
      .from('users')
      .select('fcm_token, id')
      .in('id', customerIds)

    const fcmTokens: string[] = (customers || [])
      .map((c: { fcm_token: string }) => c.fcm_token)
      .filter(Boolean)

    const title = `🍽️ Menu Baru dari ${store.store_name}!`
    const body = `${product.title} sekarang tersedia dengan diskon spesial mulai Rp ${Number(product.discount_price).toLocaleString('id-ID')}!`

    // Save notifications to database (include product_id for deep-link)
    const notificationInserts = customerIds.map((customerId: string) => ({
      user_id: customerId,
      title,
      body,
      type: 'new_product',
      product_id,
      store_id: store.id,
    }))

    await supabase.from('notifications').insert(notificationInserts)

    // Send push notifications via FCM
    let successCount = 0
    let failureCount = 0

    if (fcmTokens.length > 0) {
      const result = await sendMulticastPushNotification({
        tokens: fcmTokens,
        title,
        body,
        data: {
          type: 'new_product',
          product_id,
          store_id: store.id,
          url: `/foods/${product_id}`,
        },
      })
      successCount = result.successCount
      failureCount = result.failureCount
    }

    return NextResponse.json({
      success: true,
      notifiedCount: customerIds.length,
      pushSuccessCount: successCount,
      pushFailureCount: failureCount,
    })
  } catch (err) {
    console.error('[New Product Notif] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
