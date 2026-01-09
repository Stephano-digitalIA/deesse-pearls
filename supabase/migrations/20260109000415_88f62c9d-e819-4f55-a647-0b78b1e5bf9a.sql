-- Add a SELECT policy for approved reviews (public access to approved reviews only)
-- This allows the public_reviews view to work with SECURITY INVOKER
CREATE POLICY "Public can read approved reviews"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (is_approved = true);