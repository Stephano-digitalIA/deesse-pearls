-- Create customization_requests table
CREATE TABLE public.customization_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jewelry_type TEXT NOT NULL,
  pearl_type TEXT NOT NULL,
  metal_type TEXT NOT NULL,
  budget TEXT NOT NULL,
  description TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customization_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can submit customization requests" 
ON public.customization_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all customization requests" 
ON public.customization_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update customization requests" 
ON public.customization_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete customization requests" 
ON public.customization_requests 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_customization_requests_updated_at
BEFORE UPDATE ON public.customization_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();