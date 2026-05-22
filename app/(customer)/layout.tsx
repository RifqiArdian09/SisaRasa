'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MessageCircle,
  User,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Beranda' },
  { href: '/orders', icon: ShoppingBag, label: 'Pesanan' },
  { href: '/favorites', icon: Heart, label: 'Favorit' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/profile', icon: User, label: 'Profil' },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-cream-bg font-sans flex flex-col">
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-dark/5 shadow-xl md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-primary-orange' : 'text-dark/40 hover:text-dark/70'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-[10px] font-bold ${isActive ? 'text-primary-orange' : 'text-dark/40'}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-primary-orange" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
