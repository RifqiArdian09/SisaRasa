-- Add admin RLS policies so admin users can read/manage all data
-- Uses auth.jwt() to avoid self-referencing subqueries that cause RLS recursion

-- USERS: admins can view and update all users
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- STORES: admins can delete stores
CREATE POLICY "Admins can delete stores" ON public.stores FOR DELETE USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- ORDERS: admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- ORDER ITEMS: admins can view all order items
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- PRODUCTS: admins can manage all products
CREATE POLICY "Admins can manage all products" ON public.products USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- PRODUCT IMAGES: admins can manage all product images
CREATE POLICY "Admins can manage all product images" ON public.product_images USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- REVIEWS: admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" ON public.reviews USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- REVIEW REPLIES: admins can manage all review replies
CREATE POLICY "Admins can manage all review replies" ON public.review_replies USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- CONVERSATIONS: admins can view all conversations
CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- MESSAGES: admins can view all messages
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- NOTIFICATIONS: admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);
