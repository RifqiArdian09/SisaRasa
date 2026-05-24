-- Migration: Add product_id and store_id columns to notifications table
-- Run this in your Supabase SQL editor or as a migration

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS store_id   UUID REFERENCES public.stores(id)   ON DELETE SET NULL;

-- Index for faster lookups when routing notification clicks
CREATE INDEX IF NOT EXISTS idx_notifications_product_id ON public.notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_store_id   ON public.notifications(store_id);
