-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can check block status" ON public.admin_access_blocks;

-- Create a new SELECT policy for admins only
CREATE POLICY "Admins can view access blocks"
ON public.admin_access_blocks
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a security definer function to check block status without exposing emails
CREATE OR REPLACE FUNCTION public.check_email_block_status(check_email text)
RETURNS TABLE (
  is_blocked boolean,
  blocked_until timestamp with time zone,
  attempt_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (blocked_until IS NOT NULL AND blocked_until > now()) as is_blocked,
    blocked_until,
    attempt_count
  FROM public.admin_access_blocks
  WHERE email = check_email
  ORDER BY created_at DESC
  LIMIT 1;
$$;