-- Allow customers to view their own order items (items from orders they placed)
CREATE POLICY "Users can view own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT id 
    FROM public.orders 
    WHERE user_id = auth.uid()
  )
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);