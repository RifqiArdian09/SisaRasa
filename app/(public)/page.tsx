'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Search,
  Store,
  UtensilsCrossed,
  Cake,
  Cookie,
  Coffee,
  Apple,
  Beef,
  ArrowRight,
  ChevronDown,
  Star,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Heart,
  TrendingUp,
  Users,
  Leaf,
  CheckCircle,
} from 'lucide-react'



const stats = [
  { icon: Leaf, value: '12.450+', label: 'Makanan Terselamatkan' },
  { icon: Store, value: '850+', label: 'UMKM Tergabung' },
  { icon: Users, value: '25.000+', label: 'Pelanggan Aktif' },
  { icon: TrendingUp, value: '48.000+', label: 'Porsi Diselamatkan' },
]

const categories = [
  { icon: UtensilsCrossed, label: 'Makanan Berat', color: 'bg-orange-100 text-orange-600' },
  { icon: Cake, label: 'Roti & Kue', color: 'bg-amber-100 text-amber-600' },
  { icon: Cookie, label: 'Camilan', color: 'bg-yellow-100 text-yellow-600' },
  { icon: Coffee, label: 'Minuman', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Beef, label: 'Lauk & Olahan', color: 'bg-red-100 text-red-600' },
  { icon: Apple, label: 'Buah & Sayur', color: 'bg-green-100 text-green-600' },
]

const latestFoods = [
  {
    name: 'Nasi Goreng Spesial',
    store: 'Warung Bu Ani',
    original: 25000,
    discount: 12000,
    stock: 5,
    badge: 'Last Chance' as const,
    image: '/images/bg.png',
  },
  {
    name: 'Roti Coklat Lumer',
    store: 'Bakery Mama',
    original: 18000,
    discount: 9000,
    stock: 2,
    badge: 'Hampir Habis' as const,
    image: '/images/bg.png',
  },
  {
    name: 'Es Campur Segar',
    store: 'Kedai Sejahtera',
    original: 15000,
    discount: 7000,
    stock: 10,
    badge: 'Fresh Hari Ini' as const,
    image: '/images/bg.png',
  },
  {
    name: 'Ayam Bakar Madu',
    store: 'RM Padang Sederhana',
    original: 35000,
    discount: 18000,
    stock: 3,
    badge: 'Last Chance' as const,
    image: '/images/bg.png',
  },
  {
    name: 'Kue Lumpur Surga',
    store: 'Kue Tradisional Nenek',
    original: 12000,
    discount: 6000,
    stock: 8,
    badge: 'Fresh Hari Ini' as const,
    image: '/images/bg.png',
  },
]

const popularStores = [
  { name: 'Warung Bu Ani', category: 'Makanan Berat', rating: 4.8, orders: 320, image: '/images/bg.png' },
  { name: 'Bakery Mama', category: 'Roti & Kue', rating: 4.9, orders: 510, image: '/images/bg.png' },
  { name: 'Kedai Sejahtera', category: 'Minuman', rating: 4.7, orders: 280, image: '/images/bg.png' },
  { name: 'RM Padang Sederhana', category: 'Makanan Berat', rating: 4.6, orders: 190, image: '/images/bg.png' },
]

const testimonials = [
  {
    name: 'Siti Rahma',
    role: 'Mahasiswi',
    avatar: '/images/logo.png',
    rating: 5,
    text: 'Aku sering beli nasi goreng dari Warung Bu Ani lewat SisaRasa. Harganya murah banget, makanan masih fresh! Sangat membantu anak kos seperti saya.',
  },
  {
    name: 'Bambang Supriyadi',
    role: 'Karyawan Swasta',
    avatar: '/images/logo.png',
    rating: 5,
    text: 'Baru tahu ada aplikasi kaya gini. Lumayan bisa hemat 50% buat bekal kantor. Semoga makin banyak UMKM yang gabung!',
  },
  {
    name: 'Dewi Lestari',
    role: 'Ibu Rumah Tangga',
    avatar: '/images/logo.png',
    rating: 4,
    text: 'Seneng banget ada SisaRasa. Jadi bisa beli roti dan kue dengan harga diskon. Kualitasnya tetap bagus karena masih fresh.',
  },
]

const faqs = [
  {
    q: 'Apa itu SisaRasa?',
    a: 'SisaRasa adalah platform marketplace yang membantu UMKM menjual makanan berkualitas yang mendekati batas konsumsi dengan harga diskon, sehingga makanan tidak terbuang sia-sia dan pembeli bisa hemat.',
  },
  {
    q: 'Apakah makanan di SisaRasa aman dikonsumsi?',
    a: 'Tentu! Makanan yang dijual masih dalam batas aman konsumsi. UMKM mitra kami menjual makanan yang masih layak dan berkualitas, hanya mendekati batas waktu jual biasa.',
  },
  {
    q: 'Bagaimana cara memesan?',
    a: 'Cukup cari makanan favorit kamu, pesan melalui platform, pilih metode pembayaran (COD / Bayar di Toko / Transfer), lalu ambil makanan di toko sesuai waktu yang ditentukan.',
  },
  {
    q: 'Apakah saya bisa menjadi mitra?',
    a: 'Tentu! Jika Anda memiliki UMKM makanan, daftar sebagai mitra toko. Kami akan verifikasi dan Anda bisa langsung upload makanan untuk diselamatkan.',
  },
  {
    q: 'Bagaimana sistem pembayarannya?',
    a: 'Saat ini kami menyediakan 3 metode: COD (Bayar di Tempat), Bayar Langsung di Toko, dan Transfer Manual ke rekening toko.',
  },
]

function Badge({ children, variant }: { children: React.ReactNode; variant?: 'danger' | 'warning' | 'success' }) {
  const colors = {
    danger: 'bg-red-500 text-white',
    warning: 'bg-amber-500 text-white',
    success: 'bg-emerald-500 text-white',
  }
  return (
    <span className={`absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg ${colors[variant || 'success']}`}>
      {children}
    </span>
  )
}

function FoodCard({ item }: { item: typeof latestFoods[number] }) {
  const badgeVariant = item.badge === 'Last Chance' ? 'danger' : item.badge === 'Hampir Habis' ? 'warning' : 'success'
  return (
    <div className="group min-w-[260px] sm:min-w-[280px] bg-white rounded-2xl shadow-sm border border-dark/5 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all">
      <div className="relative h-40 overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="280px"
          className="object-cover group-hover:scale-105 transition-all duration-500"
        />
        <Badge variant={badgeVariant}>{item.badge}</Badge>
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-bold text-dark">
          Sisa {item.stock}
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-dark/50 font-medium mb-0.5">{item.store}</p>
        <h3 className="font-poppins font-bold text-dark text-sm mb-2 line-clamp-1">{item.name}</h3>
        <div className="flex items-center gap-2">
          <span className="font-poppins font-extrabold text-primary-orange text-base">
            Rp{item.discount.toLocaleString()}
          </span>
          <span className="text-xs text-dark/40 line-through">
            Rp{item.original.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="font-sans">
      {/* ════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/bg.png"
            alt="SisaRasa Hero"
            fill
            sizes="100vw"
            priority
            className="object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <Leaf className="w-4 h-4 text-light-teal" />
              <span className="text-white/90 text-xs font-semibold tracking-wide">
                #FoodSaver Movement
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-poppins font-extrabold text-white leading-tight mb-5 tracking-tight">
              Selamatkan Makanan,
              <br />
              <span className="text-primary-orange">Hemat Pengeluaran.</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/80 max-w-xl mb-8 leading-relaxed">
              Temukan makanan berkualitas dari UMKM lokal dengan harga lebih hemat sebelum terbuang.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Link
                href="/foods"
                className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-2xl bg-primary-orange text-white font-poppins font-bold text-sm shadow-xl shadow-primary-orange/30 hover:-translate-y-0.5 hover:shadow-primary-orange/40 transition-all"
              >
                <Search className="w-5 h-5" />
                Cari Makanan
              </Link>
              <Link
                href="/register?role=store"
                className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-2xl bg-white/10 backdrop-blur-sm text-white font-poppins font-bold text-sm border border-white/25 hover:bg-white/20 transition-all"
              >
                <Store className="w-5 h-5" />
                Jadi Mitra
              </Link>
            </div>
          </div>

          {/* Floating Stats */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 hover:bg-white/15 transition-all"
                >
                  <Icon className="w-5 h-5 text-light-teal mb-2" />
                  <p className="text-2xl font-poppins font-extrabold text-white">{stat.value}</p>
                  <p className="text-xs text-white/70 mt-0.5">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/50" />
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* STATISTICS SECTION */}
      {/* ════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold text-dark mb-3">
              Dampak Kami
            </h2>
            <p className="text-dark/60 max-w-lg mx-auto">
              Bersama UMKM lokal, kami telah menyelamatkan ribuan porsi makanan dari terbuang sia-sia.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="text-center p-8 rounded-2xl bg-cream-bg border border-dark/5 hover:-translate-y-1 hover:shadow-sm transition-all"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-teal/10 text-primary-teal mb-4">
                    <Icon className="w-7 h-7" />
                  </div>
                  <p className="text-3xl font-poppins font-extrabold text-dark mb-1">{stat.value}</p>
                  <p className="text-sm text-dark/60">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* CATEGORIES SECTION */}
      {/* ════════════════════════════════════════════ */}
      <section className="py-20 bg-cream-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold text-dark mb-3">
              Kategori Makanan
            </h2>
            <p className="text-dark/60 max-w-lg mx-auto">
              Temukan berbagai makanan diskon dari kategori favorit kamu.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.label}
                  href={`/foods?category=${cat.label.toLowerCase()}`}
                  className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-dark/5 hover:-translate-y-1 hover:shadow-md transition-all"
                >
                  <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${cat.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-bold text-dark text-center">{cat.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* LATEST FOODS SECTION */}
      {/* ════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold text-dark mb-2">
                Makanan Terbaru
              </h2>
              <p className="text-dark/60 max-w-md">
                Buruan sebelum habis! Makanan diskon terbaru dari UMKM terdekat.
              </p>
            </div>
            <Link
              href="/foods"
              className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-primary-teal hover:text-light-teal transition-colors"
            >
              Lihat Semua
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 snap-x snap-mandatory">
            {latestFoods.map((item) => (
              <div key={item.name} className="snap-start">
                <FoodCard item={item} />
              </div>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/foods"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-teal"
            >
              Lihat Semua Makanan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* HOW IT WORKS SECTION */}
      {/* ════════════════════════════════════════════ */}
      <section id="cara-kerja" className="py-20 bg-cream-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold text-dark mb-3">
              Cara Kerja
            </h2>
            <p className="text-dark/60 max-w-lg mx-auto">
              Hanya 3 langkah mudah untuk menyelamatkan makanan dan hemat pengeluaran.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Search, step: '01', title: 'Cari Makanan', desc: 'Jelajahi berbagai makanan diskon dari UMKM favorit di sekitar kamu.' },
              { icon: ShoppingBag, step: '02', title: 'Pesan & Bayar', desc: 'Pilih makanan, pesan, dan bayar dengan metode yang kamu suka (COD / Transfer).' },
              { icon: CheckCircle, step: '03', title: 'Ambil & Nikmati', desc: 'Ambil makanan di toko dan nikmati! Kamu turut menyelamatkan makanan dari terbuang.' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="relative text-center p-8 rounded-2xl bg-white border border-dark/5 hover:-translate-y-1 hover:shadow-md transition-all">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-teal text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    Langkah {item.step}
                  </div>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-orange/10 text-primary-orange mt-4 mb-5">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-poppins font-bold text-dark text-lg mb-2">{item.title}</h3>
                  <p className="text-dark/60 text-sm leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* POPULAR STORES SECTION */}
      {/* ════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold text-dark mb-2">
              Toko Populer
            </h2>
            <p className="text-dark/60 max-w-lg mx-auto">
              UMKM terbaik dengan makanan diskon berkualitas.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularStores.map((store) => (
              <Link
                key={store.name}
                href="/stores/1"
                className="group rounded-2xl bg-cream-bg border border-dark/5 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <div className="relative h-32 overflow-hidden">
                  <Image
                    src={store.image}
                    alt={store.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-bold text-dark">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {store.rating}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-poppins font-bold text-dark text-sm mb-0.5">{store.name}</h3>
                  <p className="text-xs text-dark/50 mb-2">{store.category}</p>
                  <p className="text-xs text-dark/40 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />
                    {store.orders} pesanan
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* TESTIMONIALS SECTION */}
      {/* ════════════════════════════════════════════ */}
      <section className="py-20 bg-cream-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold text-dark mb-3">
              Apa Kata Mereka
            </h2>
            <p className="text-dark/60 max-w-lg mx-auto">
              Ribuan orang telah merasakan manfaat SisaRasa. Ini cerita mereka.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl bg-white border border-dark/5 hover:-translate-y-1 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-dark/10'}`}
                    />
                  ))}
                </div>
                <p className="text-dark/70 text-sm leading-relaxed mb-5 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary-teal/10">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      fill
                      sizes="40px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-dark text-sm">{t.name}</p>
                    <p className="text-xs text-dark/50">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* FAQ SECTION */}
      {/* ════════════════════════════════════════════ */}
      <section id="faq" className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold text-dark mb-3">
              Pertanyaan Umum
            </h2>
            <p className="text-dark/60 max-w-lg mx-auto">
              Hal-hal yang sering ditanyakan tentang SisaRasa.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={i}
                  className={`rounded-2xl border transition-all ${
                    isOpen ? 'border-primary-teal/30 bg-primary-teal/[0.02]' : 'border-dark/5 bg-cream-bg'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex items-center justify-between w-full text-left p-5"
                  >
                    <span className="font-poppins font-bold text-dark text-sm pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-dark/40 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-primary-teal' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-96 pb-5 px-5' : 'max-h-0'
                    }`}
                  >
                    <p className="text-dark/60 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>



      {/* ════════════════════════════════════════════ */}
      {/* CTA BANNER */}
      {/* ════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-primary-orange to-primary-teal relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold text-white mb-4">
            Siap Selamatkan Makanan?
          </h2>
          <p className="text-white/85 text-lg max-w-xl mx-auto mb-8">
            Bergabunglah bersama ribuan orang yang telah menyelamatkan makanan dan hemat pengeluaran setiap hari.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/foods"
              className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-2xl bg-white text-primary-orange font-poppins font-bold text-sm shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Search className="w-5 h-5" />
              Cari Makanan Sekarang
            </Link>
            <Link
              href="/register?role=store"
              className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-2xl bg-white/10 backdrop-blur-sm text-white font-poppins font-bold text-sm border border-white/30 hover:bg-white/20 transition-all"
            >
              <Heart className="w-5 h-5" />
              Gabung Jadi Mitra
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
