import Link from 'next/link'
import { Leaf } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#2D6A4F]/10">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-[#2D6A4F] tracking-tight">SisaRasa</span>
            </div>
            <p className="text-sm text-[#1B1B1B]/50 leading-relaxed max-w-xs">
              Platform food rescue yang menghubungkan UMKM dan pembeli untuk mengurangi food waste dan berbagi kebaikan.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-[#1B1B1B] mb-5">Navigasi</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-sm text-[#1B1B1B]/50 hover:text-[#2D6A4F] transition-colors">Beranda</Link></li>
              <li><Link href="/foods" className="text-sm text-[#1B1B1B]/50 hover:text-[#2D6A4F] transition-colors">Jelajahi Makanan</Link></li>
              <li><Link href="/register?role=store" className="text-sm text-[#1B1B1B]/50 hover:text-[#2D6A4F] transition-colors">Untuk UMKM</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm text-[#1B1B1B] mb-5">Bantuan</h3>
            <ul className="space-y-3">
              <li><Link href="/#faq" className="text-sm text-[#1B1B1B]/50 hover:text-[#2D6A4F] transition-colors">FAQ</Link></li>
              <li><Link href="#" className="text-sm text-[#1B1B1B]/50 hover:text-[#2D6A4F] transition-colors">Pusat Bantuan</Link></li>
              <li><Link href="#" className="text-sm text-[#1B1B1B]/50 hover:text-[#2D6A4F] transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="#" className="text-sm text-[#1B1B1B]/50 hover:text-[#2D6A4F] transition-colors">Syarat &amp; Ketentuan</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm text-[#1B1B1B] mb-5">Ikuti Kami</h3>
            <div className="flex gap-3">
              {['IG', 'FB', 'TT', 'YT'].map((s) => (
                <Link
                  key={s}
                  href="#"
                  className="w-10 h-10 rounded-xl bg-[#F8F5F0] flex items-center justify-center text-[#2D6A4F] text-xs font-bold hover:bg-[#2D6A4F] hover:text-white transition-all"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#2D6A4F]/10 text-center">
          <p className="text-xs text-[#1B1B1B]/40">
            &copy; {new Date().getFullYear()} SisaRasa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
