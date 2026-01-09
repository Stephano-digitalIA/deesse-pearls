-- Remove the insecure public INSERT and UPDATE policies
DROP POLICY IF EXISTS "Anyone can create block records" ON public.admin_access_blocks;
DROP POLICY IF EXISTS "Anyone can update block records" ON public.admin_access_blocks;

-- Create a SECURITY DEFINER function to record failed attempts securely
-- This function handles all the blocking logic server-side
CREATE OR REPLACE FUNCTION public.record_failed_admin_attempt(check_email text, max_attempts integer DEFAULT 3, block_duration_minutes integer DEFAULT 15)
RETURNS TABLE (
  is_blocked boolean,
  remaining_minutes integer,
  attempt_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_record record;
  v_new_attempt_count integer;
  v_should_block boolean;
  v_blocked_until timestamp with time zone;
  v_remaining_minutes integer := 0;
BEGIN
  -- Normalize email
  check_email := lower(check_email);
  
  -- Get existing record
  SELECT * INTO v_existing_record
  FROM public.admin_access_blocks
  WHERE email = check_email
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate new attempt count
  v_new_attempt_count := COALESCE(v_existing_record.attempt_count, 0) + 1;
  v_should_block := v_new_attempt_count >= max_attempts;
  
  IF v_should_block THEN
    v_blocked_until := now() + (block_duration_minutes || ' minutes')::interval;
    v_remaining_minutes := block_duration_minutes;
  ELSE
    v_blocked_until := NULL;
  END IF;
  
  -- Upsert the record
  IF v_existing_record.id IS NOT NULL THEN
    UPDATE public.admin_access_blocks
    SET 
      attempt_count = v_new_attempt_count,
      blocked_until = v_blocked_until,
      updated_at = now()
    WHERE id = v_existing_record.id;
  ELSE
    INSERT INTO public.admin_access_blocks (email, attempt_count, blocked_until)
    VALUES (check_email, v_new_attempt_count, v_blocked_until);
  END IF;
  
  RETURN QUERY SELECT v_should_block, v_remaining_minutes, v_new_attempt_count;
END;
$$;

-- Create a SECURITY DEFINER function to clear blocks (for successful admin login)
CREATE OR REPLACE FUNCTION public.clear_admin_block(check_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_access_blocks
  WHERE email = lower(check_email);
END;
$$;

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.record_failed_admin_attempt(text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_admin_block(text) TO authenticated;