-- Drop the overly permissive service role policy on product_translations
-- Edge functions already use service role key which bypasses RLS, so this policy is redundant
DROP POLICY IF EXISTS "Service role can manage translations" ON public.product_translations;

-- Add a validation trigger to protect translation content integrity
CREATE OR REPLACE FUNCTION public.validate_translation_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent potential SQL injection patterns in JSON content
  IF NEW.name_translations::text ~* 'DROP|DELETE FROM|INSERT INTO|UPDATE .* SET|TRUNCATE|ALTER TABLE' THEN
    RAISE EXCEPTION 'Suspicious content detected in translations';
  END IF;
  
  IF NEW.description_translations::text ~* 'DROP|DELETE FROM|INSERT INTO|UPDATE .* SET|TRUNCATE|ALTER TABLE' THEN
    RAISE EXCEPTION 'Suspicious content detected in translations';
  END IF;
  
  -- Limit JSON size to prevent abuse (10KB per field)
  IF pg_column_size(NEW.name_translations) > 10000 THEN
    RAISE EXCEPTION 'Name translations data too large';
  END IF;
  
  IF pg_column_size(NEW.description_translations) > 50000 THEN
    RAISE EXCEPTION 'Description translations data too large';
  END IF;
  
  -- Ensure slug is valid format
  IF NEW.slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Invalid slug format';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for translation content validation
DROP TRIGGER IF EXISTS validate_translation_content_trigger ON public.product_translations;
CREATE TRIGGER validate_translation_content_trigger
  BEFORE INSERT OR UPDATE ON public.product_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_translation_content();