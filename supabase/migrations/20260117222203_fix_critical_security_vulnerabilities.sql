-- =====================================================
-- SECURITY FIX: Remove public order creation policy
-- =====================================================
-- Issue: "Anyone can create orders" allows unauthenticated users
-- to create orders directly, bypassing Stripe checkout.
-- Fix: Only authenticated users can create orders with their own user_id.
-- Note: Stripe webhook uses service_role which bypasses RLS.

-- Remove the vulnerable public insert policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Allow authenticated users to create orders only for themselves
CREATE POLICY "Authenticated users can create their own orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

-- Allow users to view their own orders (not just admins)
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

-- =====================================================
-- SECURITY FIX: Remove public order_items creation policy
-- =====================================================

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Only allow authenticated users to create order items for their orders
CREATE POLICY "Authenticated users can create order items for their orders"
ON public.order_items FOR INSERT TO authenticated
WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  )
);

-- Allow users to view their own order items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT TO authenticated
USING (
  order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- =====================================================
-- SECURITY FIX: Storage policies for product images
-- =====================================================
-- Only admins should be able to upload/modify product images

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);
