-- Drop the view and recreate with SECURITY INVOKER (safer)
DROP VIEW IF EXISTS public.public_reviews;

CREATE VIEW public.public_reviews 
WITH (security_invoker = true)
AS
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