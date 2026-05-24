'use client'

import { Toaster } from 'sonner'
import FCMProvider from '@/components/notifications/FCMProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FCMProvider>
      {children}
      <Toaster position="top-center" richColors />
    </FCMProvider>
  )
}
