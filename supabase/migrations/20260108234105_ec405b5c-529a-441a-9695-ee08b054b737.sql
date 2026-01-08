-- Create a secure view for public review access (without email)
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT 
  id,
  product_id,
  rating,
  author_name,
  comment,
  created_at,
  is_approved
FROM public.reviews
WHERE is_approved = true;

-- Grant SELECT on the view to public
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- Drop the old permissive policy that exposed emails
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;

-- Create a new policy: only admins can SELECT from the reviews table directly
-- Public users should use the public_reviews view instead
CREATE POLICY "Only admins can read reviews table directly"
ON public.reviews
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));