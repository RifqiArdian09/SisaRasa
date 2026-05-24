export const siteConfig = {
  name: 'SisaRasa',
  description:
    'Selamatkan Makanan, Hemat Pengeluaran. Temukan makanan berkualitas dari UMKM lokal dengan harga lebih hemat sebelum terbuang.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://sisarasa.vercel.app',
  ogImage: '/images/og-image.png',
  links: {
    instagram: 'https://instagram.com/sisarasa',
    twitter: 'https://twitter.com/sisarasa',
    github: 'https://github.com/sisarasa',
  },
};

export type SiteConfig = typeof siteConfig;
