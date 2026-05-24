'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Leaf, 
  ChevronDown, 
  ArrowRight, 
  Store, 
  ShoppingBag, 
  Bike, 
  Trash2, 
  Wallet, 
  Globe, 
  Sparkles, 
  ShieldCheck,
  Smartphone,
  Menu,
  X,
  Home,
  Info,
  LayoutList,
  HelpCircle
} from 'lucide-react'

const InstagramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
)

const TwitterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
)

const YoutubeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
)

function ScrollReveal({ 
  children, 
  className = '', 
  delay = 0,
  duration = 800,
  direction = 'up' 
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    )
    const currentRef = ref.current
    if (currentRef) observer.observe(currentRef)
    return () => { if (currentRef) observer.unobserve(currentRef) }
  }, [])

  const getDirectionStyles = () => {
    if (isVisible) return 'opacity-100 translate-x-0 translate-y-0 scale-100'
    switch (direction) {
      case 'up': return 'opacity-0 translate-y-8'
      case 'down': return 'opacity-0 -translate-y-8'
      case 'left': return 'opacity-0 translate-x-8'
      case 'right': return 'opacity-0 -translate-x-8'
      case 'fade': return 'opacity-0'
      default: return 'opacity-0 translate-y-8'
    }
  }

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${getDirectionStyles()} ${className}`}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

const problems = [
  { icon: Trash2, title: 'Banyak makanan dari UMKM yang terbuang karena tidak habis terjual.', iconBg: 'bg-emerald-100 text-[#2E7D32]' },
  { icon: Wallet, title: 'Kerugian besar bagi UMKM setiap harinya.', iconBg: 'bg-amber-100 text-amber-600' },
  { icon: Globe, title: 'Food waste berkontribusi pada kerusakan lingkungan.', iconBg: 'bg-rose-100 text-rose-600' },
]

const steps = [
  { icon: Store, num: '1', title: 'UMKM Upload Makanan', desc: 'UMKM upload makanan yang hampir habis masa jual.', iconBg: 'bg-amber-100 text-amber-600' },
  { icon: Smartphone, num: '2', title: 'Tampil di Aplikasi', desc: 'Makanan tampil di aplikasi untuk dilihat pembeli.', iconBg: 'bg-indigo-100 text-indigo-600' },
  { icon: ShoppingBag, num: '3', title: 'Pembeli Memesan', desc: 'Pembeli memesan makanan dengan harga lebih murah.', iconBg: 'bg-rose-100 text-rose-600' },
  { icon: Bike, num: '4', title: 'Ambil / Delivery', desc: 'Ambil di tempat atau pilih delivery jika tersedia.', iconBg: 'bg-emerald-100 text-[#2E7D32]' },
]

const benefits = [
  { icon: Wallet, label: 'Hemat Biaya', desc: 'Dapatkan makanan berkualitas dengan harga lebih terjangkau.', color: 'bg-amber-100 text-amber-600' },
  { icon: Leaf, label: 'Kurangi Food Waste', desc: 'Bantu mengurangi sampah makanan dan selamatkan bumi.', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Store, label: 'Dukung UMKM', desc: 'Bantu UMKM meningkatkan pendapatan dan mengurangi kerugian.', color: 'bg-indigo-100 text-indigo-600' },
  { icon: ShieldCheck, label: 'Makanan Tetap Layak', desc: 'Semua makanan masih layak konsumsi dan terjaga kualitasnya.', color: 'bg-emerald-100 text-[#2E7D32]' },
]

const faqs = [
  { q: 'Apakah makanan di SisaRasa masih aman dikonsumsi?', a: 'Tentu. Makanan yang dijual masih layak konsumsi dan berkualitas baik. UMKM mitra kami hanya menjual makanan berlebih yang masih dalam batas aman konsumsi, hanya mendekati batas waktu jual harian.' },
  { q: 'Siapa saja yang bisa jual makanan di SisaRasa?', a: 'Semua UMKM kuliner mulai dari toko roti, katering, warung makan, hingga kafe bisa bergabung. Cukup daftar sebagai mitra, lengkapi berkas, dan kamu bisa langsung mengunggah produk makananmu.' },
  { q: 'Apakah ada sistem delivery?', a: 'Ya, kami menyediakan metode ambil di toko (self-pickup) serta opsi pengantaran mandiri oleh kurir toko jika mitra UMKM tersebut menyediakannya.' },
  { q: 'Apakah makanan di SisaRasa lebih murah?', a: 'Iya! Makanan dijual dengan diskon besar (30% hingga 70%) dari harga asli karena mendekati batas jam konsumsi harian. Murah, lezat, dan ramah lingkungan!' },
  { q: 'Apakah SisaRasa gratis digunakan?', a: 'Pendaftaran dan penggunaan aplikasi bagi pembeli 100% gratis! Kami hanya mengenakan biaya bagi hasil yang sangat ringan untuk setiap transaksi berhasil bagi mitra UMKM.' },
  { q: 'Bagaimana cara pembayaran di SisaRasa?', a: 'Kami mendukung pembayaran tunai saat pengambilan (COD), bayar langsung di toko (Pay at Store), serta transfer manual/e-wallet untuk memudahkan transaksi kamu.' },
]

const navItems = [
  { label: 'Beranda', icon: Home, href: '/' },
  { label: 'Tentang', icon: Info, href: '#tentang' },
  { label: 'Cara Kerja', icon: LayoutList, href: '#cara-kerja' },
  { label: 'FAQ', icon: HelpCircle, href: '#faq' },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false)
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  return (
    <div className="bg-white text-[#1A1A1A] font-sans antialiased overflow-x-hidden">

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 flex items-center justify-center transition-transform group-hover:scale-105">
                <Image src="/images/logo.png" alt="SisaRasa Logo" width={36} height={36} className="object-contain" />
              </div>
              <span className="font-bold text-2xl text-[#2E7D32] font-poppins tracking-tight">SisaRasa</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.href)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[#1A1A1A]/70 hover:text-[#2E7D32] hover:bg-[#2E7D32]/5 transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                )
              })}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-6 py-2.5 rounded-full border border-slate-200 text-[#1A1A1A]/90 text-sm font-bold hover:bg-slate-50 transition-all">
                Masuk
              </Link>
              <Link href="/register" className="px-6 py-2.5 rounded-full bg-[#2E7D32] hover:bg-[#236026] text-white text-sm font-bold shadow-sm hover:shadow transition-all">
                Daftar
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -mr-2 text-[#2E7D32] hover:bg-[#2E7D32]/5 rounded-lg transition-colors"
              aria-label="Buka menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* ===== MOBILE DRAWER ===== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[290px] max-w-[80vw] bg-white shadow-2xl animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
              <span className="font-bold text-lg text-[#2E7D32] font-poppins">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[#1A1A1A]/60 hover:text-[#2E7D32] hover:bg-slate-100 rounded-lg transition-all"
                aria-label="Tutup menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 px-3 py-6 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.href)}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-[#1A1A1A]/80 hover:text-[#2E7D32] hover:bg-[#2E7D32]/5 transition-all text-left"
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </button>
                )
              })}
            </div>

            <div className="px-5 py-6 border-t border-slate-100 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-full border border-slate-200 text-center text-sm font-bold text-[#1A1A1A]/90 hover:bg-slate-50 transition-all"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-full bg-[#2E7D32] hover:bg-[#236026] text-center text-sm font-bold text-white shadow-sm transition-all"
              >
                Daftar
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden lg:min-h-[720px] xl:min-h-[800px] flex items-center">
        
        {/* Desktop BG - anchored right */}
        <div className="hidden lg:block absolute inset-0 z-0">
          <Image
            src="/images/hero.png"
            alt=""
            fill
            priority
            className="object-cover"
            style={{ objectPosition: '98% 30%' }}
          />
        </div>

        {/* Mobile BG - full width crop */}
        <div className="lg:hidden absolute inset-0 z-0">
          <Image
            src="/images/hero.png"
            alt=""
            fill
            priority
            className="object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white/60" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <div className="lg:col-span-7 flex flex-col justify-center">
              <ScrollReveal direction="left" delay={0}>
                <div className="inline-flex items-center gap-2 bg-[#2E7D32]/10 rounded-full px-4.5 py-2 mb-6 w-max backdrop-blur-sm">
                  <Leaf className="w-4 h-4 text-[#2E7D32]" />
                  <span className="text-[#2E7D32] text-xs font-bold font-poppins">#SelamatkanMakanan</span>
                </div>
              </ScrollReveal>
              
              <ScrollReveal direction="left" delay={100}>
                <h1 className="text-4xl sm:text-5xl lg:text-[56px] lg:leading-[1.15] font-extrabold tracking-tight text-[#1A1A1A] font-poppins mb-6">
                  Selamatkan Makanan,<br />
                  Nikmati Harga<br />
                  <span className="text-[#2E7D32]">Lebih Hemat.</span>
                </h1>
              </ScrollReveal>
              
              <ScrollReveal direction="left" delay={200}>
                <p className="text-base sm:text-lg text-[#1A1A1A]/70 max-w-xl mb-8 font-sans leading-relaxed">
                  SisaRasa menghubungkan UMKM makanan dengan pembeli untuk mengurangi food waste dan menciptakan manfaat bersama.
                </p>
              </ScrollReveal>
              
              <ScrollReveal direction="left" delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#2E7D32] text-white font-bold text-sm shadow-md hover:bg-[#236026] hover:-translate-y-0.5 transition-all duration-200">
                    Mulai Sekarang
                  </Link>
                  <Link href="/foods" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-slate-200 bg-white text-[#1A1A1A]/80 font-bold text-sm hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200">
                    Lihat Makanan
                    <ArrowRight size={16} className="text-[#2E7D32]" />
                  </Link>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={400}>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {['/images/avatar-mahasiswa.png', '/images/avatar-pekerja.png', '/images/avatar-eco-consionus.png'].map((src, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-100">
                        <Image src={src} alt="" width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#1A1A1A]/60 max-w-xs font-semibold leading-normal">
                    Bergabung bersama ribuan pengguna yang sudah membantu mengurangi food waste!
                  </p>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* ===== MASALAH FOOD WASTE ===== */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#FFF6E9]/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <ScrollReveal direction="up" delay={0}>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A1A] font-poppins tracking-tight mb-3">
                Masalah Food Waste di Indonesia
              </h2>
              <div className="h-1 w-12 bg-[#2E7D32] mx-auto rounded-full" />
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {problems.map((p, index) => {
              const Icon = p.icon
              return (
                <ScrollReveal key={index} delay={index * 150} className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${p.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <p className="text-sm font-bold text-[#1A1A1A] leading-snug">{p.title}</p>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== SOLUSI ===== */}
      <section id="tentang" className="py-16 sm:py-20 lg:py-24 bg-[#EBF7F5]">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            <div className="lg:col-span-6 flex flex-col justify-center">
              <ScrollReveal direction="left" delay={0}>
                <div className="inline-flex items-center gap-2 bg-[#2E7D32]/10 rounded-full px-4 py-1.5 mb-5 w-max">
                  <Leaf className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span className="text-[#2E7D32] text-xs font-bold font-poppins">SisaRasa adalah Solusinya</span>
                </div>
              </ScrollReveal>
              
              <ScrollReveal direction="left" delay={100}>
                <h2 className="text-3xl sm:text-4xl lg:text-4xl font-extrabold text-[#1A1A1A] font-poppins tracking-tight leading-[1.2] mb-6">
                  Platform yang Menghubungkan UMKM dan Pembeli
                </h2>
              </ScrollReveal>
              
              <ScrollReveal direction="left" delay={200}>
                <p className="text-[#1A1A1A]/70 text-base sm:text-lg leading-relaxed mb-8">
                  Kami membantu UMKM menjual makanan layak konsumsi yang hampir tidak terjual dengan harga lebih murah. Kamu hemat, mereka terbantu, bumi pun selamat.
                </p>
              </ScrollReveal>
              
              <ScrollReveal direction="left" delay={300}>
                <Link href="/register" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#2E7D32] hover:bg-[#236026] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all duration-200 w-max">
                  Pelajari Lebih Lanjut
                </Link>
              </ScrollReveal>
            </div>
            
            <div className="lg:col-span-6 relative flex justify-center items-center lg:justify-end">
              <ScrollReveal direction="right" delay={200} className="relative w-full h-[400px] sm:h-[500px] lg:h-[550px] max-w-[550px] xl:max-w-[600px] lg:-mr-8 xl:-mr-12 lg:scale-110 xl:scale-115 transform hover:scale-118 transition-all duration-700">
                <Image src="/images/mockuphp-danpaperbag.png" alt="Mockup Aplikasi SisaRasa" fill priority className="object-contain" />
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* ===== CARA KERJA ===== */}
      <section id="cara-kerja" className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          
          <ScrollReveal direction="up" delay={0} className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] font-poppins tracking-tight mb-3">
              Cara Kerja SisaRasa
            </h2>
            <div className="h-1 w-16 bg-[#2E7D32] mx-auto rounded-full mb-4" />
            <p className="text-[#1A1A1A]/70 text-sm sm:text-base">
              Empat langkah mudah untuk menyelamatkan makanan dan menghemat pengeluaran.
            </p>
          </ScrollReveal>

          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-[#2E7D32]/15 z-0" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 lg:gap-8 relative z-10">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <ScrollReveal key={step.num} delay={index * 150} className="flex flex-col items-center text-center group">
                    <div className="relative mb-5">
                      <div className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-[#2E7D32] text-white text-xs font-bold flex items-center justify-center z-10">
                        {step.num}
                      </div>
                      <div className={`w-16 h-16 rounded-2xl ${step.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                        <Icon className="w-8 h-8" />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-[#1A1A1A] font-poppins">{step.title}</h3>
                    <p className="text-sm text-[#1A1A1A]/60 leading-relaxed max-w-[220px]">{step.desc}</p>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ===== KEUNTUNGAN ===== */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#FFF6E9]/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <ScrollReveal direction="up" delay={0}>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] font-poppins tracking-tight mb-3">
                Keuntungan untuk Semua
              </h2>
              <div className="h-1 w-12 bg-[#2E7D32] mx-auto rounded-full" />
            </div>
          </ScrollReveal>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {benefits.map((b, index) => {
              const Icon = b.icon
              return (
                <ScrollReveal key={b.label} delay={index * 100} className="flex gap-4 p-5 rounded-xl bg-white/60 backdrop-blur-sm">
                  <div className={`w-10 h-10 rounded-xl ${b.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1A1A1A] mb-1 font-poppins">{b.label}</h3>
                    <p className="text-xs text-[#1A1A1A]/65 leading-relaxed">{b.desc}</p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <ScrollReveal direction="up" delay={0}>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] font-poppins tracking-tight mb-3">
                Pertanyaan yang Sering Diajukan
              </h2>
              <div className="h-1 w-12 bg-[#2E7D32] mx-auto rounded-full" />
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 max-w-5xl mx-auto">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <ScrollReveal key={i} delay={i * 60}>
                  <div className="border-b border-slate-100">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="flex items-center justify-between w-full text-left gap-4 group py-5"
                    >
                      <span className="font-bold text-sm sm:text-base text-[#1A1A1A] group-hover:text-[#2E7D32] transition-colors pr-2 leading-snug">
                        {faq.q}
                      </span>
                      <ChevronDown size={18} className={`shrink-0 text-[#2E7D32] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <p className="text-sm text-[#1A1A1A]/70 leading-relaxed font-sans">{faq.a}</p>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        
        <div className="absolute inset-0 z-0">
          <Image src="/images/cta.png" alt="" fill className="object-cover object-center" />
        </div>
        
        <div className="absolute inset-0 z-[1] bg-black/20" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-xl mx-auto flex flex-col items-center text-center">
            <ScrollReveal direction="up" delay={0}>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] lg:leading-[1.2] font-extrabold text-white font-poppins mb-6 drop-shadow-lg">
                Mulai Selamatkan Makanan Hari Ini!
              </h2>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={100}>
              <p className="text-white/80 text-sm sm:text-base max-w-md mb-10 leading-relaxed font-sans drop-shadow">
                Bersama kita bisa mengurangi food waste dan menciptakan dampak positif.
              </p>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={200}>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#2E7D32] hover:bg-[#236026] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  Daftar Sekarang
                </Link>
                <Link href="/foods" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm text-white font-bold text-sm hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-200">
                  Lihat Makanan
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="untuk-umkm" className="bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
          <div className="grid gap-12 lg:grid-cols-12">
            
            <div className="lg:col-span-4 flex flex-col justify-start">
              <Link href="/" className="flex items-center gap-3 mb-5 w-max">
                <Image src="/images/logo.png" alt="SisaRasa Logo" width={32} height={32} className="object-contain" />
                <span className="font-bold text-xl text-[#2E7D32] font-poppins tracking-tight">SisaRasa</span>
              </Link>
              <p className="text-sm text-[#1A1A1A]/60 leading-relaxed max-w-sm mb-6">
                Platform food rescue yang menghubungkan UMKM makanan dengan pembeli untuk mengurangi food waste dan berbagi kebaikan.
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-sm text-[#1A1A1A] mb-5 font-poppins">Navigasi</h3>
                <ul className="space-y-3.5">
                  {['Beranda', 'Tentang', 'Cara Kerja'].map((l) => (
                    <li key={l}>
                      <Link href={l === 'Beranda' ? '/' : `#${l.toLowerCase().replace(/\s/g, '-')}`} className="text-sm text-[#1A1A1A]/60 hover:text-[#2E7D32] transition-colors">{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1A1A1A] mb-5 font-poppins">Bantuan</h3>
                <ul className="space-y-3.5">
                  {['FAQ', 'Pusat Bantuan', 'Kebijakan Privasi', 'Syarat & Ketentuan'].map((l) => (
                    <li key={l}>
                      <Link href="#faq" className="text-sm text-[#1A1A1A]/60 hover:text-[#2E7D32] transition-colors">{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col justify-start">
              <h3 className="font-bold text-sm text-[#1A1A1A] mb-5 font-poppins">Ikuti Kami</h3>
              <div className="flex gap-3 mb-6">
                {[
                  { Icon: InstagramIcon, href: '#' },
                  { Icon: FacebookIcon, href: '#' },
                  { Icon: TwitterIcon, href: '#' },
                  { Icon: YoutubeIcon, href: '#' }
                ].map((s, i) => {
                  const IconComponent = s.Icon
                  return (
                    <a key={i} href={s.href} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-[#1A1A1A]/60 hover:border-[#2E7D32] hover:text-[#2E7D32] hover:bg-[#2E7D32]/5 transition-all" aria-label="Social Media">
                      <IconComponent />
                    </a>
                  )
                })}
              </div>
            </div>

          </div>

          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-[#1A1A1A]/45 font-medium">
              &copy; {new Date().getFullYear()} SisaRasa. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>

    </div>
  )
}
