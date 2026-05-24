'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Store, Package, ShoppingBag, Star,
  BarChart2, Settings, LogOut, X, Menu,
  Search, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Toaster, toast } from 'react-hot-toast'

// Menu configurations moved inside component to access dynamic state

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [adminName, setAdminName] = useState('Admin')
  const [pendingStoresCount, setPendingStoresCount] = useState(0)

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Fetch dynamic badge counts and admin profile
  useEffect(() => {
    const fetchCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      const { count: storesCount } = await supabase.from('stores').select('*', { count: 'exact', head: true }).eq('is_verified', false)

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single()
        if (profile) setAdminName(profile.name)
      }
    }

    fetchCounts()

    // Realtime: listen for new stores registering
    const storesChannel = supabase
      .channel('admin-stores')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stores' },
        (payload) => {
          setPendingStoresCount(prev => prev + 1)
          toast(
            (t) => (
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Store className="size-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">Toko Baru Mendaftar!</p>
                  <p className="text-xs text-[#6A7686] truncate">{payload.new?.store_name || 'Toko baru'} menunggu verifikasi</p>
                </div>
              </div>
            ),
            { duration: 5000 }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(storesChannel)
    }
  }, [supabase])

  const MAIN_MENU = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/stores', icon: Store, label: 'Stores', badge: pendingStoresCount > 0 ? pendingStoresCount : undefined },
    { href: '/admin/products', icon: Package, label: 'Products' },
    { href: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { href: '/admin/reviews', icon: Star, label: 'Reviews' },
  ]

  const SYSTEM_MENU = [
    { href: '/admin/reports', icon: BarChart2, label: 'Reports' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSidebarOpen(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [searchOpen])

  // Get page title
  const pageTitle = pathname?.split('/').filter(Boolean).pop() ?? 'dashboard'
  const titleMap: Record<string, string> = {
    dashboard: 'Overview', users: 'Users', stores: 'Stores',
    products: 'Products', orders: 'Orders', reviews: 'Reviews',
    reports: 'Reports', settings: 'Settings',
  }
  const displayTitle = titleMap[pageTitle] ?? pageTitle

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-cream-bg text-dark font-sans">
      <Toaster position="top-right" />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`flex flex-col w-[280px] shrink-0 h-screen fixed inset-y-0 left-0 z-50
          bg-white/80 backdrop-blur-lg border-r border-[#E5E7EB]
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center h-[90px] px-6 gap-3 border-b border-[#E5E7EB] shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="relative size-10 shrink-0">
              <Image src="/images/logo.png" alt="SisaRasa" fill className="object-contain" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">
              Sisa<span className="text-[#FF8A00]">Rasa</span>
            </h1>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto size-10 flex shrink-0 bg-white rounded-xl items-center justify-center ring-1 ring-[#E5E7EB] hover:ring-[#0F766E] transition-all cursor-pointer"
          >
            <X className="size-5 text-[#6A7686]" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col p-5 gap-6 overflow-y-auto flex-1 scrollbar-hide">
          {/* Main Menu */}
          <div className="flex flex-col gap-1">
            <p className="px-4 text-xs font-bold text-[#6A7686] uppercase tracking-wider mb-2">Main Menu</p>
            {MAIN_MENU.map(item => {
              const active = pathname?.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center justify-between rounded-2xl p-3.5 transition-all duration-300 ${
                    active ? 'bg-[#0F766E]' : 'bg-transparent hover:bg-[#F8FAFC]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <item.icon className={`size-5 transition-all ${active ? 'text-white' : 'text-[#6A7686]'}`} />
                      <span className={`font-semibold transition-all ${active ? 'text-white' : 'text-[#6A7686]'}`}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge && (
                      <span className="h-5 px-2 rounded-full bg-[#FF8A00] text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* System Menu */}
          <div className="flex flex-col gap-1">
            <p className="px-4 text-xs font-bold text-[#6A7686] uppercase tracking-wider mb-2">System</p>
            {SYSTEM_MENU.map(item => {
              const active = pathname?.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 rounded-2xl p-3.5 transition-all duration-300 ${
                    active ? 'bg-[#0F766E]' : 'bg-transparent hover:bg-[#F8FAFC]'
                  }`}>
                    <item.icon className={`size-5 transition-all ${active ? 'text-white' : 'text-[#6A7686]'}`} />
                    <span className={`font-semibold transition-all ${active ? 'text-white' : 'text-[#6A7686]'}`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* User Profile Bottom */}
        <div className="p-5 border-t border-[#E5E7EB] bg-white/50">
          <div className="flex items-center gap-3 p-2 -m-2 rounded-2xl hover:bg-white transition-all cursor-pointer group">
            <div className="size-10 rounded-full bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E] font-bold text-sm shrink-0 uppercase">
              {adminName.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{adminName}</p>
              <p className="text-xs text-[#6A7686] truncate">SisaRasa Admin</p>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-all"
              title="Logout"
            >
              <LogOut className="size-4 text-[#6A7686] hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-[280px] flex flex-col min-h-screen overflow-hidden">

        {/* Top Header */}
        <header className="flex items-center justify-between w-full h-[90px] shrink-0 bg-white/80 backdrop-blur-lg border-b border-[#E5E7EB] px-5 md:px-8 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden size-11 flex items-center justify-center rounded-xl bg-white ring-1 ring-[#E5E7EB] hover:ring-[#0F766E] transition-all duration-300 cursor-pointer shadow-sm"
            >
              <Menu className="size-5 text-dark" />
            </button>
            <div className="hidden sm:block">
              <h2 className="font-bold text-xl md:text-2xl">{displayTitle}</h2>
              <p className="text-xs text-[#6A7686]">Welcome back, here&apos;s what&apos;s happening today.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="size-11 flex items-center justify-center rounded-xl bg-white ring-1 ring-[#E5E7EB] hover:ring-[#0F766E] transition-all duration-300 cursor-pointer shadow-sm"
            >
              <Search className="size-5 text-[#6A7686]" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4" onClick={() => setShowLogoutModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="mx-auto size-14 rounded-2xl bg-red-100 flex items-center justify-center mb-3">
              <LogOut className="size-7 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Yakin ingin keluar?</h3>
            <p className="text-[#6A7686] text-sm mb-6">Anda akan logout dari sesi ini dan perlu login kembali.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-3 rounded-full ring-1 ring-[#E5E7EB] font-bold text-sm hover:bg-[#F3F6F8] transition-all">Batal</button>
              <button onClick={handleLogout} className="flex-1 px-4 py-3 rounded-full bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] px-4"
          onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
        >
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3 bg-[#F3F6F8] rounded-2xl px-4 ring-1 ring-transparent focus-within:ring-[#0F766E] transition-all">
                <Search className="size-5 text-[#6A7686] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search stores, users, or orders..."
                  className="flex-1 py-4 bg-transparent outline-none text-dark font-medium placeholder:text-[#6A7686]"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-[10px] font-bold text-[#6A7686] border border-[#E5E7EB] shadow-sm">
                  ESC
                </kbd>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-xs font-bold text-[#6A7686] uppercase tracking-wider mb-3 px-2">Quick Links</p>
              <div className="flex flex-col gap-1">
                {[
                  { href: '/admin/stores', icon: Store, label: 'Manage Stores', desc: 'View and verify registered stores', color: '#0F766E' },
                  { href: '/admin/orders', icon: ShoppingBag, label: 'Recent Orders', desc: 'Track ongoing transactions', color: '#FF8A00' },
                  { href: '/admin/users', icon: Users, label: 'Manage Users', desc: 'View and manage all users', color: '#0EA5E9' },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setSearchOpen(false)}>
                    <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#F3F6F8] transition-all cursor-pointer group">
                      <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: item.color + '1A' }}>
                        <item.icon className="size-5" style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.label}</p>
                        <p className="text-xs text-[#6A7686] truncate">{item.desc}</p>
                      </div>
                      <ChevronRight className="size-4 text-[#6A7686]" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
