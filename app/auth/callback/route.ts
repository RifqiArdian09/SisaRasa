import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const signupRole = searchParams.get('role') // dari Google signup di halaman register

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ambil profile untuk mengarahkan ke dashboard yang sesuai
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        // Profile belum dibuat — tentukan role dari signupRole atau default
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
        const defaultRole = signupRole || (adminEmail && data.user.email === adminEmail ? 'admin' : 'customer')

        // Buat profile user
        await supabase.from('users').insert({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Pengguna SisaRasa',
          email: data.user.email!,
          role: defaultRole,
        })

        // Jika role store, buat entry stores juga
        if (defaultRole === 'store') {
          await supabase.from('stores').upsert({
            user_id: data.user.id,
            store_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Toko Saya',
            address: 'Alamat belum diatur',
            is_verified: false,
          }, { onConflict: 'user_id' })
        }

        if (defaultRole === 'store') {
          return NextResponse.redirect(`${origin}/store/dashboard`)
        } else if (defaultRole === 'admin') {
          return NextResponse.redirect(`${origin}/admin/dashboard`)
        } else {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
      } else {
        if (profile.role === 'store') {
          return NextResponse.redirect(`${origin}/store/dashboard`)
        } else if (profile.role === 'admin') {
          return NextResponse.redirect(`${origin}/admin/dashboard`)
        } else {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
      }
    }
  }

  // Return user to the requested page or homepage
  return NextResponse.redirect(`${origin}${next}`)
}
