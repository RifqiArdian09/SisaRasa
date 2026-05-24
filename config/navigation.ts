export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  requiresAuth?: boolean;
  roles?: Array<'customer' | 'store' | 'admin'>;
}

export const publicNav: NavItem[] = [
  { label: 'Beranda', href: '/' },
  { label: 'Jelajahi', href: '/foods' },
  { label: 'Cara Kerja', href: '/#cara-kerja' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Untuk UMKM', href: '/register?role=store' },
];

export const customerNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ['customer'] },
  { label: 'Pesanan Saya', href: '/orders', roles: ['customer'] },
  { label: 'Toko Favorit', href: '/favorites', roles: ['customer'] },
  { label: 'Chat', href: '/chat', roles: ['customer'] },
  { label: 'Profil', href: '/profile', roles: ['customer'] },
];

export const storeNav: NavItem[] = [
  { label: 'Dashboard', href: '/store/dashboard', roles: ['store'] },
  { label: 'Produk', href: '/store/products', roles: ['store'] },
  { label: 'Pesanan', href: '/store/orders', roles: ['store'] },
  { label: 'Chat', href: '/store/chat', roles: ['store'] },
  { label: 'Analytics', href: '/store/analytics', roles: ['store'] },
  { label: 'Ulasan', href: '/store/reviews', roles: ['store'] },
  { label: 'Pengaturan', href: '/store/settings', roles: ['store'] },
];

export const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', roles: ['admin'] },
  { label: 'Users', href: '/admin/users', roles: ['admin'] },
  { label: 'Toko', href: '/admin/stores', roles: ['admin'] },
  { label: 'Produk', href: '/admin/products', roles: ['admin'] },
  { label: 'Pesanan', href: '/admin/orders', roles: ['admin'] },
  { label: 'Ulasan', href: '/admin/reviews', roles: ['admin'] },
  { label: 'Laporan', href: '/admin/reports', roles: ['admin'] },
  { label: 'Pengaturan', href: '/admin/settings', roles: ['admin'] },
];
