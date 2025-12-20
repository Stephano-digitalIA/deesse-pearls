-- =====================
-- ORDERS TABLE POLICIES
-- =====================

-- Keep: "Anyone can create orders" (customers need to place orders)
-- Remove overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;

-- Create admin-only policies for orders
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- ORDER_ITEMS TABLE POLICIES
-- =====================

DROP POLICY IF EXISTS "Authenticated users can view order items" ON public.order_items;

CREATE POLICY "Admins can view order items"
ON public.order_items FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- ORDER_HISTORY TABLE POLICIES
-- =====================

DROP POLICY IF EXISTS "Authenticated users can view order history" ON public.order_history;
DROP POLICY IF EXISTS "Authenticated users can create order history" ON public.order_history;

CREATE POLICY "Admins can view order history"
ON public.order_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create order history"
ON public.order_history FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- REVIEWS TABLE POLICIES
-- =====================

-- Keep: "Anyone can read approved reviews" (public display)
-- Keep: "Anyone can submit reviews" (customer submissions)
-- Remove overly permissive management policy
DROP POLICY IF EXISTS "Authenticated users can manage reviews" ON public.reviews;

-- Create admin-only management policies
CREATE POLICY "Admins can view all reviews"
ON public.reviews FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reviews"
ON public.reviews FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));