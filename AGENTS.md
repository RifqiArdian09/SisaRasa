Buatkan sebuah website PWA modern bernama “SisaRasa”, yaitu platform marketplace penyelamatan makanan UMKM yang mendekati batas konsumsi agar tidak terbuang sia-sia.

Gunakan:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase (Auth, Database, Storage, Realtime)
- Leaflet + React Leaflet
- Firebase Cloud Messaging (FCM)
- PWA Support
- Responsive Mobile First UI

==================================================
KONSEP
==================================================

SisaRasa adalah platform untuk membantu UMKM menjual makanan yang hanya bertahan kurang dari 24 jam agar tidak dibuang.

Customer dapat membeli makanan diskon dengan harga murah.
Toko dapat mengurangi kerugian dan food waste.

==================================================
DESIGN SYSTEM
==================================================

Style:
- modern
- clean
- warm
- eco-friendly
- premium marketplace look
- rounded
- smooth animation
- glassmorphism ringan

Color:
- Primary Orange #FF8A00
- Cream Background #FFF6E9
- Primary Teal #0F766E
- Light Teal #14B8A6
- Dark #1A1A1A

Teal Usage Guidelines:
- primary button secondary
- badge
- icon accent
- map highlight
- active state
- notification color
- success state
- kombinasi orange + teal harus terlihat modern seperti startup food-tech premium

Font:
- Poppins
- Plus Jakarta Sans

UI:
- modern marketplace
- card besar
- foto makanan dominan
- mobile-first
- clean spacing
- soft shadow
- rounded-xl sampai rounded-2xl

==================================================
ROLE
==================================================

1. Guest
2. Customer
3. Store / Mitra
4. Admin

==================================================
FITUR WAJIB
==================================================

==================================================
1. AUTHENTICATION
==================================================

Gunakan Supabase Auth.

Fitur:
- register
- login
- logout
- middleware auth
- role-based access
- protected routes
- session persistence

Role:
- customer
- store
- admin

==================================================
2. LANDING PAGE
==================================================

Hero:
Headline:
“Selamatkan Makanan, Hemat Pengeluaran.”

Subheadline:
“Temukan makanan berkualitas dari UMKM lokal dengan harga lebih hemat sebelum terbuang.”

CTA:
- Cari Makanan
- Jadi Mitra

Tambahkan:
- statistik makanan terselamatkan
- kategori makanan
- makanan terbaru
- toko populer
- section cara kerja
- map toko terdekat
- footer modern

==================================================
3. EXPLORE FOODS
==================================================

Fitur:
- search makanan
- filter kategori
- filter jarak
- sort harga
- sort expired
- realtime countdown expired
- pagination/infinite scroll

Card:
- foto makanan
- nama makanan
- toko
- harga asli dicoret
- harga diskon
- stok
- badge:
  - Last Chance
  - Hampir Habis
  - Fresh Hari Ini

==================================================
4. DETAIL PRODUK
==================================================

Isi:
- gallery foto
- deskripsi
- harga
- expired countdown realtime
- stok
- lokasi toko
- map leaflet
- tombol order
- tombol favorite toko
- review customer
- rating produk

==================================================
5. ORDER SYSTEM
==================================================

Tanpa payment gateway.

Metode:
- COD
- bayar di toko
- transfer manual

Flow:
- customer order
- store menerima order
- status order:
  - pending
  - diproses
  - siap diambil
  - selesai
  - dibatalkan

Customer dapat:
- lihat order aktif
- lihat riwayat order

Store dapat:
- menerima order
- menolak order
- update status

==================================================
6. STORE DASHBOARD
==================================================

Fitur:
- statistik penjualan
- statistik makanan terselamatkan
- statistik order
- upload makanan
- edit makanan
- hapus makanan
- upload multiple image
- set stok
- set expired time
- manage order
- profile toko
- lokasi toko leaflet
- jam operasional

==================================================
7. FAVORITE STORE
==================================================

Customer dapat:
- favorite toko
- unfavorite toko

Halaman:
- daftar toko favorit

==================================================
8. PUSH NOTIFICATION FCM
==================================================

Gunakan Firebase Cloud Messaging.

Notifikasi realtime ke HP/mobile dan browser.

NOTIFIKASI CUSTOMER:
- order diterima
- order selesai
- makanan favorite store baru upload
- makanan hampir habis
- promo toko favorit

NOTIFIKASI STORE:
- order baru masuk
- customer memberikan review
- customer favorite toko

Jika customer memfavoritekan toko:
- simpan subscription notification

Jika toko upload makanan baru:
- kirim push notification otomatis ke semua customer yang memfavoritekan toko

Contoh notif:
“Bakery Mama baru saja upload Roti Coklat Diskon 50%”

==================================================
9. REALTIME CHAT
==================================================

Gunakan Supabase Realtime.

Fitur:
- chat customer ↔ toko
- realtime message
- typing indicator
- unread badge
- kirim gambar
- list conversation
- online status sederhana

==================================================
10. REVIEW & RATING
==================================================

Customer dapat:
- kasih rating
- kasih review
- upload foto review

Store dapat:
- reply review

==================================================
11. ANALYTICS ADVANCED
==================================================

Dashboard analytics untuk store:

Chart:
- penjualan harian
- produk paling laku
- produk paling sering expired
- total makanan terselamatkan
- pendapatan bulanan
- repeat customer

Gunakan:
- Recharts / Tremor

==================================================
12. MAP LEAFLET
==================================================

Gunakan Leaflet.

Fitur:
- marker toko
- popup makanan
- lokasi customer
- radius nearby foods
- fullscreen explore map

==================================================
13. PWA
==================================================

WAJIB:
- installable
- responsive
- manifest.json
- service worker
- offline basic cache
- splash screen
- mobile app feel

==================================================
14. ADMIN PANEL
==================================================

Fitur:
- dashboard statistik
- manage user
- manage toko
- verifikasi toko
- moderasi produk
- moderasi review
- laporan user

==================================================
DATABASE TABLES
==================================================

users
- id
- role
- name
- email
- phone
- avatar_url
- fcm_token

stores
- id
- user_id
- store_name
- description
- address
- latitude
- longitude
- banner_url
- logo_url
- is_verified
- open_time
- close_time

categories
- id
- name
- slug

products
- id
- store_id
- category_id
- title
- description
- original_price
- discount_price
- stock
- expired_at
- thumbnail_url
- is_active

product_images
- id
- product_id
- image_url

orders
- id
- customer_id
- store_id
- total_price
- payment_method
- status

order_items
- id
- order_id
- product_id
- quantity
- price

favorites
- id
- customer_id
- store_id

reviews
- id
- customer_id
- product_id
- rating
- comment
- image_url

review_replies
- id
- review_id
- store_id
- reply

conversations
- id
- customer_id
- store_id

messages
- id
- conversation_id
- sender_id
- message
- image_url
- is_read

notifications
- id
- user_id
- title
- body
- type
- is_read

==================================================
IMPORTANT
==================================================

- production-ready
- scalable architecture
- reusable components
- clean folder structure
- TypeScript strict mode
- server components
- optimistic UI
- loading skeleton
- toast notifications
- dark/light mode
- accessibility
- SEO friendly
- realtime Supabase
- upload image via Supabase Storage
- secure RLS Supabase
- modern UI animation
- responsive navbar mobile
- mobile app feel seperti aplikasi native

sisarasa/
│
├── public/
│   ├── icons/
│   ├── images/
│   ├── manifest.json
│   ├── sw.js
│   └── favicon.ico
│
├── src/
│   │
│   ├── app/
│   │   │
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── foods/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── map/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (customer)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── cart/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── favorites/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (store)/
│   │   │   ├── store/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── create/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── edit/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── orders/
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── reviews/
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── notifications/
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx
│   │   │       │
│   │   │       ├── users/
│   │   │       │   └── page.tsx
│   │   │       │
│   │   │       ├── stores/
│   │   │       │   └── page.tsx
│   │   │       │
│   │   │       ├── products/
│   │   │       │   └── page.tsx
│   │   │       │
│   │   │       ├── reports/
│   │   │       │   └── page.tsx
│   │   │       │
│   │   │       └── reviews/
│   │   │           └── page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── notifications/
│   │   │   ├── fcm/
│   │   │   ├── upload/
│   │   │   └── cron/
│   │   │
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   └── providers.tsx
│   │
│   ├── components/
│   │   │
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dropdown.tsx
│   │   │   └── skeleton.tsx
│   │   │
│   │   ├── navbar/
│   │   ├── footer/
│   │   ├── cards/
│   │   ├── foods/
│   │   ├── store/
│   │   ├── map/
│   │   ├── chat/
│   │   ├── notifications/
│   │   ├── analytics/
│   │   ├── forms/
│   │   └── layouts/
│   │
│   ├── features/
│   │   │
│   │   ├── auth/
│   │   ├── foods/
│   │   ├── orders/
│   │   ├── stores/
│   │   ├── favorites/
│   │   ├── chat/
│   │   ├── reviews/
│   │   ├── notifications/
│   │   ├── analytics/
│   │   └── maps/
│   │
│   ├── lib/
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── middleware.ts
│   │   │   └── admin.ts
│   │   │
│   │   ├── firebase/
│   │   │   ├── firebase.ts
│   │   │   ├── messaging.ts
│   │   │   └── service-worker.ts
│   │   │
│   │   ├── leaflet/
│   │   │   ├── map.ts
│   │   │   └── markers.ts
│   │   │
│   │   ├── validations/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── hooks/
│   │   ├── helpers/
│   │   ├── services/
│   │   └── actions/
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── store.ts
│   │   ├── review.ts
│   │   └── notification.ts
│   │
│   ├── stores/
│   │   ├── auth-store.ts
│   │   ├── cart-store.ts
│   │   ├── chat-store.ts
│   │   └── notification-store.ts
│   │
│   ├── middleware.ts
│   └── config/
│       ├── site.ts
│       ├── env.ts
│       └── navigation.ts
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   ├── schema.sql
│   └── rls.sql
│
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
==================================================
FIREBASE CONFIGURATION
==================================================

```html
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyB5Dwei_QwnIUn3bTfZf06yRWKoRhDpUjM",
    authDomain: "sisarasa-65427.firebaseapp.com",
    projectId: "sisarasa-65427",
    storageBucket: "sisarasa-65427.firebasestorage.app",
    messagingSenderId: "250510547682",
    appId: "1:250510547682:web:05688c1f2c52e5f4621cbb",
    measurementId: "G-ELV0G3201R"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
```

**VAPID / Web Push Key Pair:**
`BLcsrZf7AV7Shk9w8DB2JEuY-MedUg18JSyXBfED9jZRZMeHk5FYve9ITrOfLY_7-Jk0LerobciW6NuVwtf-cFk`
