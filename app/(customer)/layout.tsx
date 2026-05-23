'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MessageCircle,
  User,
  Utensils,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Beranda' },
  { href: '/foods', icon: Utensils, label: 'Jelajahi' },
  { href: '/orders', icon: ShoppingBag, label: 'Pesanan' },
  { href: '/favorites', icon: Heart, label: 'Favorit' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/profile', icon: User, label: 'Profil' },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showBottomNav = navItems.some(item => item.href === pathname)

  return (
    <div className="h-[100dvh] bg-gray-100 flex justify-center font-sans text-[#080C1A] overflow-hidden">
      <div className="w-full max-w-md bg-[#F3F6F8] h-full relative shadow-2xl flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto scrollbar-hide pb-4">
          {children}
        </main>

        {/* Bottom Navigation */}
        {showBottomNav && (
          <nav className="shrink-0 z-50 bg-white/80 backdrop-blur-lg border-t border-[#E5E7EB] pb-safe">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all relative ${
                  isActive ? 'text-white' : 'text-[#6A7686]'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-[#0F766E] rounded-xl" />
                )}
                <Icon className={`w-5 h-5 relative ${isActive ? '' : ''}`} />
                <span className="text-[10px] font-bold relative">{label}</span>
              </Link>
            )
          })}
        </div>
        </nav>
        )}
      </div>
    </div>
  )
}
