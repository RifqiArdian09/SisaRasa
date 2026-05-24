export const siteConfig = {
  name: 'SisaRasa',
  description:
    'Selamatkan Makanan, Hemat Pengeluaran. Temukan makanan berkualitas dari UMKM lokal dengan harga lebih hemat sebelum terbuang.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://sisarasa-beige.vercel.app',
  ogImage: '/images/og-image.png',
  links: {
    instagram: '#`',
    twitter: '#`',
    github: '#`',
  },
};

export type SiteConfig = typeof siteConfig;
