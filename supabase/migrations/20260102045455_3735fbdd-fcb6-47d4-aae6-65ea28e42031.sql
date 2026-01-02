-- Create table for tracking blocked users/emails
CREATE TABLE public.admin_access_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  blocked_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.admin_access_blocks ENABLE ROW LEVEL SECURITY;

-- Anyone can read (to check if they're blocked)
CREATE POLICY "Anyone can check block status"
ON public.admin_access_blocks
FOR SELECT
USING (true);

-- Anyone can insert/update their own block record
CREATE POLICY "Anyone can create block records"
ON public.admin_access_blocks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update block records"
ON public.admin_access_blocks
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Only admins can delete blocks
CREATE POLICY "Admins can delete blocks"
ON public.admin_access_blocks
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_admin_access_blocks_email ON public.admin_access_blocks(email);
CREATE INDEX idx_admin_access_blocks_blocked_until ON public.admin_access_blocks(blocked_until);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_access_blocks_updated_at
BEFORE UPDATE ON public.admin_access_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();