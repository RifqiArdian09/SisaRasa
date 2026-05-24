import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMulticastPushNotification } from '@/lib/firebase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only store owners and admins can send broadcast notifications
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'store' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, body, data, target_user_ids } = await request.json()
    if (!title || !body) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }

    let fcmTokens: string[] = []

    if (target_user_ids && Array.isArray(target_user_ids) && target_user_ids.length > 0) {
      // Send to specific users
      const { data: users } = await supabase
        .from('users')
        .select('fcm_token, id')
        .in('id', target_user_ids)
        .not('fcm_token', 'is', null)

      fcmTokens = (users || []).map((u: { fcm_token: string }) => u.fcm_token).filter(Boolean)
    } else if (profile.role === 'store') {
      // Store sending to all their customers (favorited their store)
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (store) {
        const { data: favoritedBy } = await supabase
          .from('favorites')
          .select('customer_id')
          .eq('store_id', store.id)

        if (favoritedBy && favoritedBy.length > 0) {
          const customerIds = favoritedBy.map((f: { customer_id: string }) => f.customer_id)
          const { data: users } = await supabase
            .from('users')
            .select('fcm_token')
            .in('id', customerIds)
            .not('fcm_token', 'is', null)

          fcmTokens = (users || []).map((u: { fcm_token: string }) => u.fcm_token).filter(Boolean)
        }
      }
    } else {
      // Admin sending to all users with FCM tokens
      const { data: users } = await supabase
        .from('users')
        .select('fcm_token')
        .not('fcm_token', 'is', null)

      fcmTokens = (users || []).map((u: { fcm_token: string }) => u.fcm_token).filter(Boolean)
    }

    if (fcmTokens.length === 0) {
      return NextResponse.json({ message: 'No recipients with FCM tokens found', sentCount: 0 })
    }

    // Also save notifications to the database
    const notificationInserts = (target_user_ids as string[] || []).map((userId: string) => ({
      user_id: userId,
      title,
      body,
      type: data?.type || 'general',
    }))

    if (notificationInserts.length > 0) {
      await supabase.from('notifications').insert(notificationInserts)
    }

    // Send push via FCM
    const result = await sendMulticastPushNotification({
      tokens: fcmTokens,
      title,
      body,
      data,
    })

    return NextResponse.json({
      success: true,
      successCount: result.successCount,
      failureCount: result.failureCount,
    })
  } catch (err) {
    console.error('[Notification Send] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
