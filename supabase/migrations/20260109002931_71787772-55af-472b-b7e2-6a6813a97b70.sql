-- Remove the public SELECT policy on reviews table
-- Public access should only be through the public_reviews view which hides author_email
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;