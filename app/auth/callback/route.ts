import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

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
        // Jika profile belum dibuat di database publik (misal login OAuth Google pertama kali), buat profile default
        await supabase.from('users').insert({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Pengguna SisaRasa',
          email: data.user.email!,
          role: 'customer',
        })
        return NextResponse.redirect(`${origin}/dashboard`)
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
