import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const signupRole = searchParams.get('role')

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      let destination: string

      if (!profile) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
        const defaultRole = signupRole || (adminEmail && data.user.email === adminEmail ? 'admin' : 'customer')

        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Pengguna SisaRasa',
          email: data.user.email!,
          role: defaultRole,
        })

        if (!insertError && defaultRole === 'store') {
          await supabase.from('stores').upsert({
            user_id: data.user.id,
            store_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Toko Saya',
            address: 'Alamat belum diatur',
            is_verified: false,
          }, { onConflict: 'user_id' })
        }

        if (defaultRole === 'store') {
          destination = `${origin}/store/dashboard`
        } else if (defaultRole === 'admin') {
          destination = `${origin}/admin/dashboard`
        } else {
          destination = `${origin}/dashboard`
        }
      } else {
        if (profile.role === 'store') {
          destination = `${origin}/store/dashboard`
        } else if (profile.role === 'admin') {
          destination = `${origin}/admin/dashboard`
        } else {
          destination = `${origin}/dashboard`
        }
      }

      const response = NextResponse.redirect(destination)
      request.cookies.getAll().forEach(({ name, value, ...rest }) => {
        response.cookies.set(name, value, rest)
      })
      return response
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
