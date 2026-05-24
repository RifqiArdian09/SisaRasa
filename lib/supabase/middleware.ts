import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // PENTING: Jangan tulis logika apapun di antara createServerClient dan getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rute yang wajib login
  const protectedPrefixes = [
    '/dashboard',
    '/cart',
    '/checkout',
    '/orders',
    '/favorites',
    '/chat',
    '/profile',
    '/store',
    '/admin',
    '/foods',
  ]

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  )

  // Redirect ke login jika belum autentikasi dan mencoba akses rute protected
  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Sudah login tapi akses /login atau /register → redirect ke dashboard sesuai role
  if (user && (pathname === '/login' || pathname === '/register')) {
    // Ambil role dari tabel users
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const redirectUrl = request.nextUrl.clone()
    if (profile?.role === 'store') {
      redirectUrl.pathname = '/store/dashboard'
    } else if (profile?.role === 'admin') {
      redirectUrl.pathname = '/admin/dashboard'
    } else {
      redirectUrl.pathname = '/dashboard'
    }
    return NextResponse.redirect(redirectUrl)
  }

  // Sudah login tapi akses /dashboard → redirect sesuai role (server-side fallback)
  if (user && pathname === '/dashboard') {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || user.user_metadata?.role
    if (role === 'store') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/store/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
    if (role === 'admin') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
