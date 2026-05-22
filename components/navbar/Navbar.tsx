'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Search, MapPin, Store, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Jelajahi', href: '/foods', icon: Search },
  { label: 'Peta', href: '/map', icon: MapPin },
  { label: 'Jadi Mitra', href: '/register?role=store', icon: Store },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener?.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileOpen(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-dark/5'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="relative w-8 h-8 bg-white rounded-xl shadow-sm overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="SisaRasa"
                  fill
                  sizes="32px"
                  className="object-contain p-1"
                />
              </div>
              <span className={`font-poppins font-extrabold text-lg tracking-tight ${scrolled ? 'text-dark' : 'text-white'}`}>
                SisaRasa
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive(link.href)
                        ? scrolled
                          ? 'bg-primary-orange/10 text-primary-orange'
                          : 'bg-white/15 text-white'
                        : scrolled
                          ? 'text-dark/70 hover:text-dark hover:bg-dark/5'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Auth Buttons Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                    scrolled
                      ? 'bg-primary-teal text-white hover:bg-primary-teal/90'
                      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                  }`}
                >
                  Dashboard
                  <ChevronDown className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                      scrolled
                        ? 'text-dark/70 hover:text-dark hover:bg-dark/5'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="py-2 px-5 rounded-xl bg-primary-orange text-white text-sm font-bold shadow-lg shadow-primary-orange/25 hover:-translate-y-0.5 hover:shadow-primary-orange/35 transition-all"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className={`md:hidden p-2 rounded-xl transition-all ${
                scrolled ? 'text-dark hover:bg-dark/5' : 'text-white hover:bg-white/10'
              }`}
              aria-label="Buka menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-300 md:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl transition-all duration-300 ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-dark/5">
            <div className="flex items-center gap-2">
              <div className="relative w-7 h-7 rounded-lg overflow-hidden">
                <Image src="/images/logo.png" alt="SisaRasa" fill sizes="28px" className="object-contain p-0.5" />
              </div>
              <span className="font-poppins font-extrabold text-dark text-base">SisaRasa</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl text-dark/50 hover:bg-dark/5 transition-all"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive(link.href)
                      ? 'bg-primary-orange/10 text-primary-orange'
                      : 'text-dark/70 hover:bg-dark/5 hover:text-dark'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="p-4 border-t border-dark/5 space-y-3">
            {user ? (
              <Link
                href="/dashboard"
                className="block w-full py-3 px-4 rounded-xl bg-primary-teal text-white text-sm font-bold text-center"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block w-full py-3 px-4 rounded-xl border border-dark/10 text-dark font-semibold text-sm text-center"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="block w-full py-3 px-4 rounded-xl bg-primary-orange text-white text-sm font-bold text-center shadow-lg"
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
