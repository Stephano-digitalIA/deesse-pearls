-- Create a function to validate and sanitize review content
CREATE OR REPLACE FUNCTION public.validate_review_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Strip HTML tags from comment
  NEW.comment := regexp_replace(NEW.comment, '<[^>]*>', '', 'g');
  
  -- Check for script-like or dangerous content
  IF NEW.comment ~* '<script|javascript:|onerror=|onclick=|onload=|onmouseover=|eval\(' THEN
    RAISE EXCEPTION 'Invalid content in comment';
  END IF;
  
  -- Validate author_name - strip HTML tags
  NEW.author_name := regexp_replace(NEW.author_name, '<[^>]*>', '', 'g');
  
  -- Validate author_email format
  IF NEW.author_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate rating range
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  
  -- Validate lengths
  IF length(NEW.author_name) < 2 OR length(NEW.author_name) > 50 THEN
    RAISE EXCEPTION 'Author name must be between 2 and 50 characters';
  END IF;
  
  IF length(NEW.comment) < 10 OR length(NEW.comment) > 1000 THEN
    RAISE EXCEPTION 'Comment must be between 10 and 1000 characters';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for review content validation
DROP TRIGGER IF EXISTS validate_review_trigger ON public.reviews;
CREATE TRIGGER validate_review_trigger
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review_content();

-- Harden the has_role function to prevent arbitrary user role lookups by non-admins
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Users can only check their own role, unless they're an admin
  -- For admin checks (used in RLS policies), we need to allow the lookup
  -- But for non-admin users checking other users' roles, we should deny
  IF _user_id != auth.uid() THEN
    -- Allow if the caller is an admin (recursive check via direct query to avoid infinite loop)
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
      -- Non-admin trying to check another user's role - return false for security
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;