import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fcm_token } = await request.json()
    if (!fcm_token || typeof fcm_token !== 'string') {
      return NextResponse.json({ error: 'fcm_token is required' }, { status: 400 })
    }

    // Upsert the FCM token into the user's profile
    const { error: updateError } = await supabase
      .from('users')
      .update({ fcm_token })
      .eq('id', user.id)

    if (updateError) {
      console.error('[FCM Subscribe] Failed to update token:', updateError)
      return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[FCM Subscribe] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Unsubscribe / clear token */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ fcm_token: null })
      .eq('id', user.id)

    if (updateError) {
      console.error('[FCM Unsubscribe] Failed to clear token:', updateError)
      return NextResponse.json({ error: 'Failed to clear token' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[FCM Unsubscribe] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
