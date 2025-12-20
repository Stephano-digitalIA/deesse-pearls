-- Fix 1: Add verify_admin_access RPC for server-side admin verification
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Fix 2: Prevent admin self-modification in user_roles table
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles for others"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND user_id != auth.uid()
);

CREATE POLICY "Admins can update roles for others"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND user_id != auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND user_id != auth.uid()
);

CREATE POLICY "Admins can delete roles for others"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND user_id != auth.uid()
);

-- Fix 3: Restrict storage policies to admin only
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

CREATE POLICY "Only admins can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

-- Fix 4: Restrict order creation to require at least valid email
-- Add validation trigger for orders
CREATE OR REPLACE FUNCTION public.validate_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format
  IF NEW.customer_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate totals are not negative
  IF NEW.total < 0 OR NEW.subtotal < 0 THEN
    RAISE EXCEPTION 'Invalid order total';
  END IF;
  
  -- Validate customer name is present
  IF NEW.customer_name IS NULL OR trim(NEW.customer_name) = '' THEN
    RAISE EXCEPTION 'Customer name required';
  END IF;
  
  -- Validate customer name length
  IF length(NEW.customer_name) > 100 THEN
    RAISE EXCEPTION 'Customer name too long';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_order_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order();

-- Fix 5: Add validation constraints and trigger for profiles
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate phone format (if provided)
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^[+0-9\s()-]{0,20}$' THEN
    RAISE EXCEPTION 'Invalid phone format';
  END IF;
  
  -- Validate first name length
  IF NEW.first_name IS NOT NULL AND length(NEW.first_name) > 50 THEN
    RAISE EXCEPTION 'First name too long';
  END IF;
  
  -- Validate last name length
  IF NEW.last_name IS NOT NULL AND length(NEW.last_name) > 50 THEN
    RAISE EXCEPTION 'Last name too long';
  END IF;
  
  -- Validate postal code length
  IF NEW.postal_code IS NOT NULL AND length(NEW.postal_code) > 10 THEN
    RAISE EXCEPTION 'Postal code too long';
  END IF;
  
  -- Validate city length
  IF NEW.city IS NOT NULL AND length(NEW.city) > 100 THEN
    RAISE EXCEPTION 'City name too long';
  END IF;
  
  -- Validate country length
  IF NEW.country IS NOT NULL AND length(NEW.country) > 100 THEN
    RAISE EXCEPTION 'Country name too long';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_profile_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_update();