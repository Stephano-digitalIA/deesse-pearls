-- Create table for unauthorized access attempts
CREATE TABLE public.admin_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  ip_address text,
  user_agent text,
  attempt_type text NOT NULL DEFAULT 'login_attempt',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view the logs
CREATE POLICY "Admins can view access logs"
ON public.admin_access_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert (to log their own failed attempt)
CREATE POLICY "Anyone can log access attempts"
ON public.admin_access_logs
FOR INSERT
WITH CHECK (true);

-- Admins can delete logs
CREATE POLICY "Admins can delete access logs"
ON public.admin_access_logs
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_admin_access_logs_created_at ON public.admin_access_logs(created_at DESC);
CREATE INDEX idx_admin_access_logs_email ON public.admin_access_logs(email);