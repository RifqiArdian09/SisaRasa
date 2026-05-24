# SisaRasa - Project Status

## Goal
Build a modern PWA food-saving marketplace platform connecting UMKM (micro-businesses) with customers to reduce food waste.

## Stack
- **Framework**: Next.js 16.2.6 (App Router) + TypeScript + Tailwind CSS v4
- **Database/Auth**: Supabase (Auth, Database, Storage, Realtime)
- **State**: Zustand with persist (cart)
- **Maps**: Leaflet + React Leaflet
- **Push**: Firebase v12.13.0 (FCM)
- **Charts**: Recharts
- **Toast**: Sonner
- **PWA**: @ducanh2912/next-pwa v10.2.9

## Progress

### COMPLETED
- **Full project structure** (all route groups, components, lib, types, etc.)
- **Supabase Schema**: 11 tables with proper RLS on all (users, stores, categories, products, product_images, orders, order_items, favorites, reviews, review_replies, conversations, messages, notifications)
- **RLS Policies**: Complete for all tables including admin SECURITY DEFINER helper
- **Realtime enabled** on: messages, conversations, orders, notifications
- **Auth**: Login/Register with email + Google OAuth, role-based routing, session persistence, middleware protection, auth callback with auto-profile creation
- **Landing Page**: Hero, stats, categories, featured foods, popular stores, how-it-works, map section, FAQ, footer
- **Foods**: Explore page with search, filter, sort, realtime countdown, food cards with badges
- **Product Detail**: Gallery, description, pricing, countdown, stock, map, order/review sections
- **Cart**: Zustand persist with per-store grouping, stock validation
- **Checkout**: COD/transfer/pay-in-store options
- **Orders**: Customer order list + history, store order management with status updates
- **Favorites**: Customer favorites list page, favorite/unfavorite toggle on store detail page
- **Chat**: Realtime + polling messaging, conversation list with unread badges, image support
- **Store Dashboard**: CRUD products (multi-image upload, stock, expiry), settings (profile, location with Leaflet map picker, hours), orders management, reviews management, analytics with Recharts
- **Admin Dashboard**: Full management (users, stores, products, orders, reviews, reports, settings), store verification flow
- **Analytics**: Daily sales, top products, wasted products, food saved, monthly revenue, repeat customers
- **Types**: Full TypeScript type definitions (auth, product, store, order, review, notification)
- **Config**: Site config, env config, navigation config

### NOW COMPLETED (This Session)
1. **lib/firebase/client.ts** - Firebase app init + FCM messaging (getToken, onMessage, onForegroundMessage)
2. **lib/firebase/admin.ts** - Firebase Admin SDK for server-side FCM send (single + multicast)
3. **app/api/fcm/subscribe/route.ts** - Register/unregister FCM token (POST/DELETE)
4. **app/api/notifications/send/route.ts** - Send push notifications to users/customers/admin
5. **app/api/notifications/favorite-store/route.ts** - Notify store owner when favorited
6. **app/api/notifications/new-product/route.ts** - Notify followers when store uploads new product
7. **app/api/upload/route.ts** - Supabase Storage upload (avatar, store, product, review, chat images)
8. **components/notifications/NotificationBell.tsx** - Realtime notification bell with dropdown
9. **components/notifications/FCMProvider.tsx** - FCM token registration + foreground message listener
10. **app/providers.tsx** - Updated to include FCMProvider
11. **components/navbar/Navbar.tsx** - Updated with NotificationBell for logged-in users
12. **PWA**: manifest.json, sw.js (offline cache + push), firebase-messaging-sw.js, PWA icons (8 sizes)
13. **next.config.ts** - Updated with withPWA plugin
14. **app/layout.tsx** - Updated with PWA meta tags, viewport, apple-touch-icon
15. **middleware.ts** - Updated matcher to exclude public PWA files
16. **app/offline.tsx** - Offline fallback page
17. **.env.local** - Firebase Admin SDK credentials added
18. **config/env.ts, site.ts, navigation.ts** - Config files

### REMAINING / NEXT STEPS
1. Connect favorites toggle to call `/api/notifications/favorite-store` and `/api/notifications/new-product`
2. Add cron job (Vercel Cron or Supabase pg_cron) to auto-deactivate expired products
3. Create seed data for demo/testing
4. Final production testing and deployment

## Key Architecture Notes
- All API routes use `@/lib/supabase/server` for authenticated requests
- FCM Provider auto-registers token on auth state change
- Notifications are dual-delivery: DB insert (for in-app) + FCM push (for device/browser)
- PWA service worker caches static assets and handles push notifications
- Firebase messaging SW handles background push message display
- All Supabase RLS policies are in `supabase/rls.sql`
- Schema is in `supabase/schema.sql`

## Design Tokens
- Primary: Orange #FF8A00
- Background: Cream #FFF6E9
- Teal: #0F766E (primary buttons, badges, accents)
- Light Teal: #14B8A6
- Dark: #1A1A1A
- Fonts: Plus Jakarta Sans + Poppins
- Rounded: xl-2xl, glassmorphism, soft shadows
