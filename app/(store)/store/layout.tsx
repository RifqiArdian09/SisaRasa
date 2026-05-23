'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, ClipboardList, BarChart3,
  Star, Bell, Settings, LogOut, X, Menu, Search, ChevronRight,
  Store as StoreIcon, MessageSquare, Clock, User
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface StoreLayoutProps {
  children: React.ReactNode
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0)
  const [storeName, setStoreName] = useState('Mitra Toko')
  const [userName, setUserName] = useState('')
  const storeNameInitial = storeName.charAt(0)

  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Fetch store info, user name, and unread notifs
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [storeResult, profileResult, notifResult] = await Promise.all([
        supabase.from('stores').select('store_name').eq('user_id', user.id).single(),
        supabase.from('users').select('name').eq('id', user.id).single(),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
      ])

      if (storeResult.data) setStoreName(storeResult.data.store_name)
      if (profileResult.data) setUserName(profileResult.data.name)
      setUnreadNotifsCount(notifResult.count || 0)
    }
    fetchData()
  }, [supabase])

  const NAV_MENU = [
    { href: '/store/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/store/products', icon: ShoppingBag, label: 'Produk' },
    { href: '/store/orders', icon: ClipboardList, label: 'Pesanan' },
    { href: '/store/chat', icon: MessageSquare, label: 'Pesan', badge: undefined as number | undefined },
    { href: '/store/analytics', icon: BarChart3, label: 'Analitik' },
    { href: '/store/reviews', icon: Star, label: 'Ulasan' },
    { href: '/store/notifications', icon: Bell, label: 'Notifikasi', badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined },
    { href: '/store/settings', icon: Settings, label: 'Pengaturan' },
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

  const pageTitle = pathname?.split('/').filter(Boolean).pop() ?? 'dashboard'
  const titleMap: Record<string, string> = {
    dashboard: 'Dashboard', products: 'Produk', orders: 'Pesanan',
    analytics: 'Analitik', reviews: 'Ulasan', notifications: 'Notifikasi', settings: 'Pengaturan',
  }
  const displayTitle = titleMap[pageTitle] ?? pageTitle

  // title map
  const titleMapFull: Record<string, string> = {
    dashboard: 'Dashboard', products: 'Produk', orders: 'Pesanan',
    analytics: 'Analitik', reviews: 'Ulasan', notifications: 'Notifikasi',
    settings: 'Pengaturan', chat: 'Pesan Masuk',
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#F3F6F8] text-[#080C1A] font-sans">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`flex flex-col w-[280px] shrink-0 h-screen fixed inset-y-0 left-0 z-50 bg-white/80 backdrop-blur-lg border-r border-[#E5E7EB] transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center h-[90px] px-6 gap-3 border-b border-[#E5E7EB] shrink-0">
          <Link href="/store/dashboard" className="flex items-center gap-3">
            <div className="relative size-10 shrink-0">
              <Image src="/images/logo.png" alt="SisaRasa" fill className="object-contain" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">
              Sisa<span className="text-[#FF8A00]">Rasa</span>
            </h1>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto size-10 flex shrink-0 bg-white rounded-xl items-center justify-center ring-1 ring-[#E5E7EB] hover:ring-[#0F766E] transition-all cursor-pointer">
            <X className="size-5 text-[#6A7686]" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col p-5 gap-1 overflow-y-auto flex-1 scrollbar-hide">
          <p className="px-4 text-xs font-bold text-[#6A7686] uppercase tracking-wider mb-2">Menu Mitra</p>
          {NAV_MENU.map(item => {
            const active = pathname === item.href || (item.href !== '/store/dashboard' && pathname?.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center justify-between rounded-2xl p-3.5 transition-all duration-300 ${active ? 'bg-[#0F766E]' : 'bg-transparent hover:bg-[#F8FAFC]'}`}>
                  <div className="flex items-center gap-3">
                    <item.icon className={`size-5 transition-all ${active ? 'text-white' : 'text-[#6A7686]'}`} />
                    <span className={`font-semibold transition-all ${active ? 'text-white' : 'text-[#6A7686]'}`}>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="h-5 px-2 rounded-full bg-[#FF8A00] text-white text-[10px] font-bold flex items-center justify-center">{item.badge}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* User Profile Bottom */}
        <div className="p-5 border-t border-[#E5E7EB] bg-white/50">
          <div className="flex items-center gap-3 p-2 -m-2 rounded-2xl hover:bg-white transition-all cursor-pointer group">
            <div className="size-10 rounded-full bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E] font-bold text-sm shrink-0 uppercase">
              {userName ? userName.charAt(0) : storeNameInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{userName || storeName}</p>
              <p className="text-xs text-[#6A7686] truncate">{storeName}</p>
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
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden size-11 flex items-center justify-center rounded-xl bg-white ring-1 ring-[#E5E7EB] hover:ring-[#0F766E] transition-all duration-300 cursor-pointer shadow-sm">
              <Menu className="size-5 text-[#080C1A]" />
            </button>
            <div className="hidden sm:block">
              <h2 className="font-bold text-xl md:text-2xl">{displayTitle}</h2>
              <p className="text-xs text-[#6A7686]">Kelola toko dan pantau pesanan Anda.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSearchOpen(true)} className="size-11 flex items-center justify-center rounded-xl bg-white ring-1 ring-[#E5E7EB] hover:ring-[#0F766E] transition-all duration-300 cursor-pointer shadow-sm">
              <Search className="size-5 text-[#6A7686]" />
            </button>
            <Link href="/store/notifications" className="size-11 flex items-center justify-center rounded-xl bg-white ring-1 ring-[#E5E7EB] hover:ring-[#0F766E] transition-all duration-300 cursor-pointer shadow-sm relative">
              <Bell className="size-5 text-[#6A7686]" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-2 right-2.5 size-2 rounded-full bg-[#FF8A00] ring-2 ring-white" />
              )}
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-8 pb-24">{children}</div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] px-4" onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3 bg-[#F3F6F8] rounded-2xl px-4 ring-1 ring-transparent focus-within:ring-[#0F766E] transition-all">
                <Search className="size-5 text-[#6A7686] shrink-0" />
                <input ref={searchInputRef} type="text" placeholder="Cari produk, pesanan..." className="flex-1 py-4 bg-transparent outline-none text-[#080C1A] font-medium placeholder:text-[#6A7686]" />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-[10px] font-bold text-[#6A7686] border border-[#E5E7EB] shadow-sm">ESC</kbd>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-xs font-bold text-[#6A7686] uppercase tracking-wider mb-3 px-2">Menu Cepat</p>
              <div className="flex flex-col gap-1">
                {[
                  { href: '/store/products/create', icon: ShoppingBag, label: 'Tambah Produk', desc: 'Upload makanan baru ke etalase', color: '#0F766E' },
                  { href: '/store/orders', icon: ClipboardList, label: 'Pesanan Masuk', desc: 'Lihat dan kelola pesanan aktif', color: '#FF8A00' },
                  { href: '/store/settings', icon: Settings, label: 'Pengaturan Toko', desc: 'Atur profil dan jam operasional', color: '#0EA5E9' },
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
