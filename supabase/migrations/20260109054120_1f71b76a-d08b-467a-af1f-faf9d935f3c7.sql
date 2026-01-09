-- Update validation trigger to allow legitimate jewelry terms like "drop-shaped"
CREATE OR REPLACE FUNCTION public.validate_translation_content()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Prevent SQL injection patterns - check for actual SQL commands (with spaces/boundaries)
  -- Allow legitimate words like "drop-shaped" by requiring SQL keyword patterns
  IF NEW.name_translations::text ~* '\bDROP\s+TABLE\b|\bDROP\s+DATABASE\b|\bDELETE\s+FROM\b|\bINSERT\s+INTO\b|\bUPDATE\s+\w+\s+SET\b|\bTRUNCATE\s+TABLE\b|\bALTER\s+TABLE\b' THEN
    RAISE EXCEPTION 'Suspicious content detected in translations';
  END IF;
  
  IF NEW.description_translations::text ~* '\bDROP\s+TABLE\b|\bDROP\s+DATABASE\b|\bDELETE\s+FROM\b|\bINSERT\s+INTO\b|\bUPDATE\s+\w+\s+SET\b|\bTRUNCATE\s+TABLE\b|\bALTER\s+TABLE\b' THEN
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
$function$;