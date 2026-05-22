'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMapPage = pathname === '/map'
  const isAuthPage = pathname === '/login' || pathname === '/register'

  // Auth pages: fullscreen tanpa Navbar dan Footer
  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className={`flex-1 ${isMapPage ? 'pt-16' : ''}`}>{children}</main>
      {!isMapPage && <Footer />}
    </>
  )
}

