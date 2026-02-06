-- Create table for pending signups (before email confirmation)
CREATE TABLE IF NOT EXISTS public.pending_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  confirmation_token TEXT NOT NULL UNIQUE,
  token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attempts INT DEFAULT 0
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_signups_token ON public.pending_signups(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON public.pending_signups(email);
CREATE INDEX IF NOT EXISTS idx_pending_signups_expires ON public.pending_signups(token_expires_at);

-- Enable RLS
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can access
CREATE POLICY "Service role only" ON public.pending_signups
  FOR ALL
  USING (false);

-- Auto-delete expired tokens (older than 24h)
CREATE OR REPLACE FUNCTION delete_expired_pending_signups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.pending_signups
  WHERE token_expires_at < NOW();
END;
$$;

-- Schedule cleanup (will need to be configured in Supabase pg_cron or called manually)
COMMENT ON FUNCTION delete_expired_pending_signups() IS 'Deletes expired pending signups. Should be run periodically via cron.';
