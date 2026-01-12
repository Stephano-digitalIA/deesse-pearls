-- Create a table to store the admin URL secret
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin settings
CREATE POLICY "Admins can read admin settings"
ON public.admin_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update admin settings
CREATE POLICY "Admins can update admin settings"
ON public.admin_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Insert the default admin URL secret (can be changed by admin later)
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('admin_url_secret', 'gestion2025x');

-- Create function to verify admin URL secret (available to anyone for URL validation)
CREATE OR REPLACE FUNCTION public.verify_admin_url_secret(secret_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_settings
    WHERE setting_key = 'admin_url_secret'
    AND setting_value = secret_key
  );
$$;