-- Create reviews table for customer reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews
CREATE POLICY "Anyone can read approved reviews"
ON public.reviews
FOR SELECT
USING (is_approved = true);

-- Anyone can submit a review
CREATE POLICY "Anyone can submit reviews"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- Authenticated users can manage reviews (for admin)
CREATE POLICY "Authenticated users can manage reviews"
ON public.reviews
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_reviews_is_approved ON public.reviews(is_approved);

-- Enable realtime for reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;