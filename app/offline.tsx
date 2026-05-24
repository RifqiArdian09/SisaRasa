import Link from 'next/link'
import { Leaf, WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-bg">
      <div className="max-w-md text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary-teal/10 flex items-center justify-center mx-auto">
          <WifiOff className="w-10 h-10 text-primary-teal" />
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-teal flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-primary-teal">SisaRasa</span>
        </div>

        <h1 className="text-2xl font-bold text-dark">Kamu Sedang Offline</h1>
        <p className="text-gray-500">
          Jangan khawatir, kamu tetap bisa menjelajahi halaman yang sudah
          dikunjungi sebelumnya. Koneksikan kembali untuk mendapatkan
          informasi terbaru.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 px-6 rounded-xl bg-primary-teal text-white font-semibold hover:bg-light-teal transition-colors"
          >
            Coba Lagi
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="block w-full py-3 px-6 rounded-xl border-2 border-primary-teal text-primary-teal font-semibold hover:bg-primary-teal/5 transition-colors"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    </div>
  )
}
