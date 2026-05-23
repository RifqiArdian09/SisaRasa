-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public can view stores profile" ON public.users FOR SELECT USING (role = 'store');
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Store owners can view their customers profile" ON public.users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.stores s ON o.store_id = s.id
    WHERE o.customer_id = users.id AND s.user_id = auth.uid()
  )
);

-- STORES
CREATE POLICY "Stores are viewable by everyone" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Store owners can insert their store" ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Store owners and admins can update stores" ON public.stores FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- CATEGORIES
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- PRODUCTS
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Store owners can manage their products" ON public.products USING (
  EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
);

-- PRODUCT IMAGES
CREATE POLICY "Product images are viewable by everyone" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Store owners can manage their product images" ON public.product_images USING (
  EXISTS (SELECT 1 FROM public.products 
          JOIN public.stores ON products.store_id = stores.id 
          WHERE product_images.product_id = products.id AND stores.user_id = auth.uid())
);

-- ORDERS
CREATE POLICY "Customers can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Store owners can view their store orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stores WHERE stores.id = orders.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Store owners can update order status" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stores WHERE stores.id = orders.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Customers can cancel their pending orders" ON public.orders FOR UPDATE USING (
  auth.uid() = customer_id AND status = 'pending'
);

-- ORDER ITEMS
CREATE POLICY "Customers can view their order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Store owners can view their order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders JOIN public.stores ON orders.store_id = stores.id WHERE orders.id = order_items.order_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Customers can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);

-- FAVORITES
CREATE POLICY "Users can view their favorites" ON public.favorites FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can manage their favorites" ON public.favorites FOR ALL USING (auth.uid() = customer_id);

-- REVIEWS
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update their reviews" ON public.reviews FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Customers can delete their reviews" ON public.reviews FOR DELETE USING (auth.uid() = customer_id);

-- REVIEW REPLIES
CREATE POLICY "Review replies are viewable by everyone" ON public.review_replies FOR SELECT USING (true);
CREATE POLICY "Store owners can manage review replies" ON public.review_replies USING (
  EXISTS (SELECT 1 FROM public.stores WHERE stores.id = review_replies.store_id AND stores.user_id = auth.uid())
);

-- CONVERSATIONS
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (
  auth.uid() = customer_id OR 
  EXISTS (SELECT 1 FROM public.stores WHERE stores.id = conversations.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (
  auth.uid() = customer_id OR 
  EXISTS (SELECT 1 FROM public.stores WHERE stores.id = conversations.store_id AND stores.user_id = auth.uid())
);

-- MESSAGES
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = messages.conversation_id AND (
      c.customer_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.stores s WHERE s.id = c.store_id AND s.user_id = auth.uid())
    )
  )
);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = messages.conversation_id AND (
      c.customer_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.stores s WHERE s.id = c.store_id AND s.user_id = auth.uid())
    )
  )
);
CREATE POLICY "Users can mark messages as read" ON public.messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = messages.conversation_id AND (
      (c.customer_id = auth.uid() AND sender_id != auth.uid()) OR 
      (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = c.store_id AND s.user_id = auth.uid()) AND sender_id != auth.uid())
    )
  )
);

-- NOTIFICATIONS
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);


-- STORAGE BUCKETS RLS
-- Ensure buckets exist (safe to re-run)
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('stores', 'stores', true),
  ('products', 'products', true),
  ('reviews', 'reviews', true),
  ('chats', 'chats', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars bucket
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own avatar." ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own avatar." ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Stores bucket
CREATE POLICY "Store images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'stores');
CREATE POLICY "Users can upload store images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stores' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update store images." ON storage.objects FOR UPDATE USING (bucket_id = 'stores' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete store images." ON storage.objects FOR DELETE USING (bucket_id = 'stores' AND auth.uid() IS NOT NULL);

-- Products bucket
CREATE POLICY "Product images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Users can upload product images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update product images." ON storage.objects FOR UPDATE USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete product images." ON storage.objects FOR DELETE USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);

-- Reviews bucket
CREATE POLICY "Review images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'reviews');
CREATE POLICY "Users can upload review images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reviews' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their review images." ON storage.objects FOR DELETE USING (bucket_id = 'reviews' AND auth.uid() IS NOT NULL);

-- Chats bucket
CREATE POLICY "Chat images are accessible by authenticated users." ON storage.objects FOR SELECT USING (bucket_id = 'chats' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can upload chat images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chats' AND auth.uid() IS NOT NULL);

