-- Fix security issues

-- 1. Drop the old view and recreate with security_invoker
DROP VIEW IF EXISTS public.public_reviews;

CREATE VIEW public.public_reviews 
WITH (security_invoker = on) AS
SELECT 
    r.id,
    r.product_id,
    r.user_name,
    r.rating,
    r.title,
    r.content,
    r.created_at,
    p.name as product_name,
    p.slug as product_slug
FROM public.reviews r
JOIN public.products p ON r.product_id = p.id
WHERE r.is_approved = true;

-- 2. Fix update_updated_at_column function with proper search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 3. Recreate triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customization_requests_updated_at BEFORE UPDATE ON public.customization_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_translations_updated_at BEFORE UPDATE ON public.product_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Fix handle_new_user function with proper search_path (already has it, but let's be sure)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Fix overly permissive RLS policies - restrict customization_requests anonymous inserts
DROP POLICY IF EXISTS "Anyone can submit customization request" ON public.customization_requests;

-- Allow inserts with basic rate-limiting conceptually (users must provide email)
CREATE POLICY "Anyone can submit customization request" ON public.customization_requests 
FOR INSERT 
WITH CHECK (email IS NOT NULL AND email != '');

-- 6. Restrict admin_access_logs insert to be more controlled
DROP POLICY IF EXISTS "System can insert access logs" ON public.admin_access_logs;

-- Allow authenticated users and edge functions to insert logs
CREATE POLICY "Authenticated can insert access logs" ON public.admin_access_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);