'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isStoreDetail = pathname.startsWith('/stores/')
  const isLanding = pathname === '/'

  // Auth pages & store detail: fullscreen tanpa Navbar dan Footer
  if (isAuthPage || isStoreDetail) {
    return <>{children}</>
  }

  // Landing page has its own navbar + footer embedded
  if (isLanding) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}

