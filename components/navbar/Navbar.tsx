'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Leaf, Search, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Jelajahi', href: '/foods' },
  { label: 'Cara Kerja', href: '/#cara-kerja' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Untuk UMKM', href: '/register?role=store' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user ?? null)
      if (data?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()
        setUserRole(profile?.role ?? 'customer')
      }
    }
    fetchUser()
    const { data: listener } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setUserRole(profile?.role ?? 'customer')
      } else {
        setUserRole(null)
      }
    })
    return () => listener?.subscription.unsubscribe()
  }, [supabase])

  const getDashboardUrl = () => {
    if (userRole === 'store') return '/store/dashboard'
    if (userRole === 'admin') return '/admin/dashboard'
    return '/dashboard'
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled ? 'bg-white shadow-sm border-b border-[#2D6A4F]/10' : 'bg-white border-b border-[#2D6A4F]/10'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-[#2D6A4F] tracking-tight">SisaRasa</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#1B1B1B]/60 hover:text-[#2D6A4F] hover:bg-[#2D6A4F]/5 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Link
                  href={getDashboardUrl()}
                  className="px-5 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-bold hover:bg-[#2D6A4F] transition-all shadow-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-5 py-2 rounded-lg border-2 border-[#2D6A4F] text-[#2D6A4F] text-sm font-bold hover:bg-[#2D6A4F]/5 transition-all"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-bold hover:bg-[#2D6A4F] transition-all shadow-sm"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-[#2D6A4F] hover:bg-[#2D6A4F]/5 rounded-lg transition-all"
              aria-label="Buka menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-200 md:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
        <div
          className={`absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl transition-all duration-200 ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-[#2D6A4F]/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#2D6A4F] flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[#2D6A4F] text-base">SisaRasa</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-[#1B1B1B]/40 hover:bg-[#2D6A4F]/5 transition-all"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 rounded-lg text-sm font-semibold text-[#1B1B1B]/60 hover:text-[#2D6A4F] hover:bg-[#2D6A4F]/5 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="p-4 border-t border-[#2D6A4F]/10 space-y-3">
            {user ? (
              <Link
                href={getDashboardUrl()}
                className="block w-full py-3 px-4 rounded-lg bg-[#1B4332] text-white text-sm font-bold text-center"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block w-full py-3 px-4 rounded-lg border-2 border-[#2D6A4F] text-[#2D6A4F] font-bold text-sm text-center"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="block w-full py-3 px-4 rounded-lg bg-[#1B4332] text-white text-sm font-bold text-center shadow-sm"
                >
                  Daftar Sekarang
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
