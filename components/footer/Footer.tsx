import Link from 'next/link'
import Image from 'next/image'
import {
  Globe,
  MessageCircle,
  Send,
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
  Heart,
} from 'lucide-react'

const footerLinks = {
  Navigasi: [
    { label: 'Beranda', href: '/' },
    { label: 'Jelajahi Makanan', href: '/foods' },
    { label: 'Jadi Mitra', href: '/register?role=store' },
  ],
  Informasi: [
    { label: 'Tentang Kami', href: '#' },
    { label: 'Cara Kerja', href: '#cara-kerja' },
    { label: 'Kebijakan Privasi', href: '#' },
    { label: 'Syarat & Ketentuan', href: '#' },
  ],
  Bantuan: [
    { label: 'FAQ', href: '#faq' },
    { label: 'Hubungi Kami', href: '#' },
    { label: 'Laporkan Masalah', href: '#' },
  ],
}

const socialLinks = [
  { icon: Globe, href: '#', label: 'Website' },
  { icon: MessageCircle, href: '#', label: 'Chat' },
  { icon: Send, href: '#', label: 'Telegram' },
  { icon: Mail, href: '#', label: 'Email' },
]

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 bg-white rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/images/logo.png"
                  alt="SisaRasa"
                  fill
                  sizes="40px"
                  className="object-contain p-1.5"
                />
              </div>
              <span className="text-xl font-poppins font-extrabold tracking-tight">
                SisaRasa
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs">
              Platform marketplace penyelamatan makanan UMKM. Bersama kita kurangi food waste dan hemat pengeluaran.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white/70 hover:text-white"
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-poppins font-bold text-sm text-white/90 mb-4 uppercase tracking-wider">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-white/10 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 text-sm text-white/50">
            <MapPin className="w-4 h-4 text-light-teal shrink-0" />
            <span>UMKM Lokal di seluruh Indonesia</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-white/50">
            <Phone className="w-4 h-4 text-light-teal shrink-0" />
            <span>+62 123 4567 890</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-white/50">
            <Mail className="w-4 h-4 text-light-teal shrink-0" />
            <span>hello@sisarasa.id</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} SisaRasa. All rights reserved.
          </p>
          <p className="text-xs text-white/40 flex items-center gap-1">
            Dibuat dengan <Heart className="w-3 h-3 text-red-400 fill-red-400" /> untuk UMKM Indonesia
          </p>
        </div>
      </div>
    </footer>
  )
}
