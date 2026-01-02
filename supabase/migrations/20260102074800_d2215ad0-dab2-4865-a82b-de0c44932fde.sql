-- Create table to store product translations
CREATE TABLE public.product_translations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  description_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index on slug for fast lookups
CREATE INDEX idx_product_translations_slug ON public.product_translations(slug);

-- Enable RLS
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Product translations are publicly readable" 
ON public.product_translations 
FOR SELECT 
USING (true);

-- Admins can insert translations
CREATE POLICY "Admins can insert product translations" 
ON public.product_translations 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update translations
CREATE POLICY "Admins can update product translations" 
ON public.product_translations 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete translations
CREATE POLICY "Admins can delete product translations" 
ON public.product_translations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_product_translations_updated_at
  BEFORE UPDATE ON public.product_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Also allow service role to manage translations (for edge functions)
CREATE POLICY "Service role can manage translations" 
ON public.product_translations 
FOR ALL
USING (true)
WITH CHECK (true);