import Link from 'next/link'
import { Home, Search, Store } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-bg font-sans flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-poppins font-extrabold text-primary-orange/20 mb-4">
          404
        </div>
        <h1 className="text-2xl font-poppins font-extrabold text-dark mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-dark/60 text-sm mb-8">
          Halaman yang kamu cari mungkin telah dipindahkan atau tidak tersedia.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary-orange text-white font-poppins font-bold text-sm shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <Link
            href="/foods"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary-teal text-white font-poppins font-bold text-sm shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Search className="w-4 h-4" />
            Jelajahi Makanan
          </Link>
        </div>
      </div>
    </div>
  )
}
