import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/firebase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { store_id, action } = await request.json()
    if (!store_id) {
      return NextResponse.json({ error: 'store_id is required' }, { status: 400 })
    }

    // Get store owner info
    const { data: store } = await supabase
      .from('stores')
      .select('store_name, user_id')
      .eq('id', store_id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Get customer name
    const { data: customer } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()

    // Get store owner's FCM token
    const { data: storeOwner } = await supabase
      .from('users')
      .select('fcm_token')
      .eq('id', store.user_id)
      .single()

    const title = action === 'favorite'
      ? '💛 Pelanggan Baru Favorite Toko Anda!'
      : '💔 Pelanggan Unfavorite Toko Anda'

    const body = action === 'favorite'
      ? `${customer?.name || 'Seseorang'} baru saja memfavoritkan toko "${store.store_name}".`
      : `${customer?.name || 'Seseorang'} unfavorite toko "${store.store_name}".`

    // Save notification to database for the store owner
    await supabase.from('notifications').insert({
      user_id: store.user_id,
      title,
      body,
      type: 'favorite_store',
    })

    // Send push notification if store owner has FCM token
    if (storeOwner?.fcm_token) {
      await sendPushNotification({
        token: storeOwner.fcm_token,
        title,
        body,
        data: { type: 'favorite_store', store_id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Favorite Store Notif] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
