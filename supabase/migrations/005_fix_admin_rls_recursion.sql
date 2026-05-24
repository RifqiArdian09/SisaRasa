-- Fix: Hapus semua RLS admin policy yang self-referencing (recursion)
-- Ganti dengan SECURITY DEFINER function + auth.jwt() hybrid

-- ===== STEP 1: Buat helper function (bypass RLS) =====
-- Fungsi ini pakai SECURITY DEFINER sehingga bisa query public.users tanpa RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Juga fallback dari JWT (untuk user yg daftar via register dan role-nya ada di metadata)
-- JWT approach: langsung dari token tanpa query database
--> auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'

-- Gabungan: Cek JWT dulu (cepat, tanpa DB query), lalu SECURITY DEFINER (akurat)
-- Tapi untuk simplify, kita pakai SECURITY DEFINER aja karena lebih reliable.

-- ===== STEP 2: Hapus policy lama & buat ulang =====

-- USERS
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users (old)" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (public.is_admin());

-- STORES
DROP POLICY IF EXISTS "Store owners and admins can update stores" ON public.stores;
CREATE POLICY "Store owners and admins can update stores" ON public.stores FOR UPDATE USING (
  auth.uid() = user_id OR public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete stores" ON public.stores;
CREATE POLICY "Admins can delete stores" ON public.stores FOR DELETE USING (public.is_admin());

-- CATEGORIES
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories USING (public.is_admin());

-- ORDERS
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.is_admin());

-- ORDER ITEMS
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (public.is_admin());

-- PRODUCTS
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products" ON public.products USING (public.is_admin());

-- PRODUCT IMAGES
DROP POLICY IF EXISTS "Admins can manage all product images" ON public.product_images;
CREATE POLICY "Admins can manage all product images" ON public.product_images USING (public.is_admin());

-- REVIEWS
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews" ON public.reviews USING (public.is_admin());

-- REVIEW REPLIES
DROP POLICY IF EXISTS "Admins can manage all review replies" ON public.review_replies;
CREATE POLICY "Admins can manage all review replies" ON public.review_replies USING (public.is_admin());

-- CONVERSATIONS
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT USING (public.is_admin());

-- MESSAGES
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.is_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (public.is_admin());
