# 🚀 ALUR & PANDUAN IMPLEMENTASI FITUR SISARASA

Dokumen ini berisi panduan langkah-demi-langkah (roadmap) terstruktur untuk membangun **SisaRasa**, platform marketplace penyelamatan makanan UMKM. Alur ini dirancang secara logis agar proses pengembangan berjalan lancar tanpa hambatan dependensi (misal: membangun halaman order sebelum auth/produk siap).

---

## 📊 KANBAN & STATUS PENGEMBANGAN

| Phase | Fitur / Komponen | Target Path / Files | Status |
| :--- | :--- | :--- | :---: |
| **PHASE 1** | **Foundation & Auth** | `src/lib/supabase/`, `src/middleware.ts`, `/login`, `/register` | ⏳ Pending |
| | **Layout & Navigation** | `src/components/navbar/`, `src/components/layouts/` | ⏳ Pending |
| **PHASE 2** | **Landing Page** | `src/app/(public)/page.tsx` | ⏳ Pending |
| | **Food Listing (Explore)**| `src/app/(public)/foods/page.tsx` | ⏳ Pending |
| | **Detail Product** | `src/app/(public)/foods/[id]/page.tsx` | ⏳ Pending |
| | **Explore Map** | `src/app/(public)/map/page.tsx` | ⏳ Pending |
| **PHASE 3** | **Store Dashboard** | `src/app/(store)/store/dashboard/` | ⏳ Pending |
| | **Product CRUD** | `src/app/(store)/store/products/` | ⏳ Pending |
| **PHASE 4** | **Cart & Checkout** | `src/app/(customer)/cart/`, `/checkout` | ⏳ Pending |
| | **Order System** | `src/app/(customer)/orders/`, `(store)/store/orders/` | ⏳ Pending |
| **PHASE 5** | **Favorite Store** | `src/app/(customer)/favorites/` | ⏳ Pending |
| | **Realtime Chat** | `src/app/(customer)/chat/` | ⏳ Pending |
| | **Review & Rating** | `src/components/reviews/` | ⏳ Pending |
| **PHASE 6** | **FCM Push Notification** | `src/lib/firebase/`, `public/sw.js` | ⏳ Pending |
| | **Advanced Analytics** | `src/app/(store)/store/analytics/` | ⏳ Pending |
| | **Admin Panel** | `src/app/(admin)/admin/` | ⏳ Pending |
| | **PWA & SEO Polish** | `public/manifest.json`, `src/app/layout.tsx` | ⏳ Pending |

---

## 🛠️ DETAIL SETIAP TAHAP (Langkah-demi-Langkah)

### PHASE 1 — FOUNDATION & GLOBAL LAYOUT (Fondasi Utama)
> [!IMPORTANT]
> Jangan langsung membuat UI yang kompleks sebelum fondasi data dan sistem routing Auth siap. Semua fitur transaksi di fase berikutnya sangat bergantung pada data User Session.

#### 1. Setup Next.js, Supabase, & Auth Helper
*   [ ] Inisialisasi Supabase Client & Server helper di `src/lib/supabase/client.ts` dan `server.ts`.
*   [ ] Buat Next.js Middleware (`src/middleware.ts`) untuk memproteksi rute berdasarkan role:
    *   `/store/*` hanya untuk user dengan `role = 'store'`.
    *   `/admin/*` hanya untuk user dengan `role = 'admin'`.
    *   `/dashboard`, `/cart`, `/checkout`, `/orders` hanya untuk `role = 'customer'`.
*   [ ] Integrasikan Tailwind CSS v4 dan buat variabel tema warna di `src/app/globals.css`.
*   [ ] Sediakan Zustand Global Store untuk Auth (`src/stores/auth-store.ts`).
*   [ ] Implementasikan Halaman Login (`/login`) dan Register (`/register`) dengan penanganan role selection (Customer / Mitra Store).

#### 2. Layout Global & Navigasi Mobile-First
*   [ ] **Public Layout**: Sediakan Navbar & Footer di `src/app/(public)/layout.tsx`.
*   [ ] **Dashboard Layout**: Sediakan Sidebar, Topbar, dan Bottom Navigation khusus mobile untuk area Customer (`src/app/(customer)/layout.tsx`), Store (`src/app/(store)/layout.tsx`), dan Admin (`src/app/(admin)/layout.tsx`).
*   [ ] Sediakan UI Global Toast & Modal di `src/components/ui/` (`button.tsx`, `input.tsx`, `modal.tsx`, `badge.tsx`, `skeleton.tsx`).

---

### PHASE 2 — PUBLIC FEATURES (Eksplorasi Publik)
> [!NOTE]
> Tahap ini bertujuan agar aplikasi memiliki halaman muka yang informatif dan interaktif untuk menarik pengunjung umum/calon pembeli.

#### 3. Landing Page Premium
*   [ ] **Hero Section**: Headline persuasif, Subheadline, tombol CTA (*Cari Makanan* & *Jadi Mitra*).
*   [ ] **Statistics & Kategori**: Menampilkan data statistik makanan terselamatkan, kategori makanan (Makanan Berat, Roti & Kue, Camilan, dll.).
*   [ ] **Latest & Popular**: Section makanan terbaru yang di-upload mitra dan daftar toko populer terdekat.
*   [ ] **Cara Kerja & Map Preview**: Panduan visual cara menyelamatkan makanan dan pratinjau peta interaktif lokasi toko terdekat.

#### 4. Listing Foods (Explore Page)
*   [ ] Halaman `/foods` untuk eksplorasi makanan diskon secara komprehensif.
*   [ ] Implementasikan filter interaktif: *Kategori*, *Jarak/Radius (Leaflet)*, dan *Urutan (Harga Termurah, Expired Terdekat)*.
*   [ ] Buat komponen **FoodCard** premium:
    *   Foto makanan dominan.
    *   Nama toko & nama produk.
    *   Harga asli (dicoret) & Harga diskon.
    *   Stok tersisa.
    *   Badge dinamis: `Last Chance` (jika waktu hampir habis), `Hampir Habis` (stok < 3), `Fresh Hari Ini`.
    *   **CountdownExpired**: Pewaktu mundur realtime sisa layak konsumsi produk.

#### 5. Detail Produk & Lokasi
*   [ ] Halaman `/foods/[id]`: Galeri foto produk, Deskripsi lengkap, informasi detail expired.
*   [ ] Peta lokasi toko menggunakan Leaflet Map (`src/components/map/`).
*   [ ] Tombol Order (tambah ke keranjang) dan tombol Favorit Toko.
*   [ ] Section Review dan Rating dari customer lain yang sudah membeli produk tersebut.

#### 6. Explore Map (Fullscreen Map Page)
*   [ ] Halaman `/map`: Map fullscreen interaktif menggunakan Leaflet.
*   [ ] Menampilkan marker toko-toko terdekat yang memiliki produk aktif.
*   [ ] Popup interaktif yang menampilkan rangkuman makanan diskon di toko tersebut saat marker diklik.

---

### PHASE 3 — STORE & MITRA SYSTEM (Manajemen Produk)
> [!TIP]
> Sebelum sistem order dapat berjalan, mitra toko harus memiliki kemampuan untuk mempublikasikan makanan yang ingin diselamatkan.

#### 7. Store Dashboard & Profil Toko
*   [ ] Ringkasan statistik penjualan, jumlah makanan yang berhasil diselamatkan, dan total order aktif.
*   [ ] Pengaturan Profil Toko (`/store/settings`): Jam operasional (buka & tutup), alamat fisik, titik koordinat peta (Leaflet Geolocation picker).

#### 8. CRUD Product & Multi-Image Upload
*   [ ] Halaman manajemen produk toko (`/store/products`).
*   [ ] Form Tambah & Edit Produk: input nama, kategori, harga asli, harga diskon, stok, dan *Expired Time* (waktu batas konsumsi).
*   [ ] Integrasikan upload gambar ke Supabase Storage (`products` bucket) dengan dukungan seret-lepas (drag-and-drop) multi-image.

---

### PHASE 4 — TRANSACTION & ORDER SYSTEM (Alur Belanja)

#### 9. Cart & Checkout (Zustand Store)
*   [ ] Buat Zustand Store untuk Cart (`src/stores/cart-store.ts`).
*   [ ] Halaman Keranjang Belanja (`/cart`): modifikasi kuantitas, hapus item, validasi jika makanan berasal dari toko yang berbeda (keranjang belanja hanya boleh berisi item dari 1 toko dalam sekali checkout).
*   [ ] Halaman `/checkout`: Ringkasan pesanan, pemilihan metode pembayaran manual (COD, Bayar di Toko, Transfer Manual).

#### 10. Order System & Status Tracking
*   [ ] Flow Pesanan Customer:
    *   Status awal: `pending`.
    *   Halaman riwayat pesanan customer (`/orders`) dengan visual step-tracker status pesanan.
*   [ ] Flow Manajemen Pesanan Toko (`/store/orders`):
    *   Notifikasi instan jika ada pesanan masuk.
    *   Aksi Toko: Terima Pesanan (`diproses`), Siap Diambil (`siap_diambil`), Selesaikan Pesanan (`selesai`), atau Batalkan (`dibatalkan`).

---

### PHASE 5 — SOCIAL & REALTIME COMMUNICATIONS (Interaksi)

#### 11. Favorite Store
*   [ ] Fungsionalitas menyukai toko (Favorite/Unfavorite).
*   [ ] Halaman `/favorites` di sisi customer untuk melihat daftar toko langganan.
*   [ ] Logika database untuk mendaftarkan subscription notifikasi saat customer memfavoritkan toko.

#### 12. Realtime Chat (Supabase Realtime)
*   [ ] Halaman daftar obrolan (`/chat`) dan ruang obrolan detail (`/chat/[id]`).
*   [ ] Chat Realtime dua arah antara Customer ↔ Mitra Toko.
*   [ ] Fitur tambahan: *Typing Indicator*, *Unread Message Badge*, *Online Status*, dan opsi kirim gambar (Supabase Storage `chats` bucket).

#### 13. Review & Rating (Ulasan Pembeli)
*   [ ] Berikan akses review hanya untuk customer yang status ordernya sudah `selesai`.
*   [ ] Form ulasan: input rating bintang (1-5), komentar ulasan, dan upload foto ulasan.
*   [ ] Fitur balas ulasan (Reply Review) dari sisi mitra toko di halaman `/store/reviews`.

---

### PHASE 6 — ADVANCED & POLISHING (Sentuhan Akhir)

#### 14. Firebase Cloud Messaging (FCM) Push Notification
*   [ ] Setup Service Worker Firebase (`public/firebase-messaging-sw.js`).
*   [ ] Integrasikan request permission notifikasi dan penyimpanan FCM Token ke database (`users.fcm_token`).
*   [ ] Implementasi pengiriman notifikasi otomatis via FCM Admin:
    *   **Untuk Customer**: Jika toko favoritnya meng-upload produk baru, order diperbarui statusnya, atau produk favorit hampir habis.
    *   **Untuk Store**: Jika ada pesanan masuk baru, atau mendapat review baru.

#### 15. Advanced Analytics Dashboard (Mitra)
*   [ ] Implementasikan grafik penjualan harian & bulanan menggunakan `Recharts`.
*   [ ] Visualisasi data: Produk paling laku, total makanan terselamatkan (dalam kg / porsi), grafik repeat customer, dan produk yang paling sering expired (tidak terjual).

#### 16. Admin Panel (Moderasi & Kontrol)
*   [ ] Halaman dashboard statistik admin: Total user, total store terdaftar, total transaksi.
*   [ ] Fitur manajemen & verifikasi toko (UMKM baru harus diverifikasi admin agar bisa berjualan).
*   [ ] Fitur moderasi produk makanan, moderasi review yang melanggar ketentuan, dan penanganan laporan user.

#### 17. PWA Polish & SEO Optimization
*   [ ] Konfigurasi `public/manifest.json` lengkap dengan ikon PWA (maskable & rounded), splash screen, dan warna tema modern (Orange & Teal).
*   [ ] Konfigurasi Service Worker offline caching dasar agar aplikasi dapat dibuka saat tidak ada koneksi internet.
*   [ ] Optimasi SEO: Title dinamis, deskripsi meta, semantic HTML tags, dan penambahan `sitemap.xml` / `robots.txt` agar mudah terindeks mesin pencari.