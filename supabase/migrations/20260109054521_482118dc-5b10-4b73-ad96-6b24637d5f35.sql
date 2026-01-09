-- Add new categories to product_category type
-- First check if it's a check constraint and update it

-- Drop existing check constraint if any
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- Add new check constraint with additional categories
ALTER TABLE products ADD CONSTRAINT products_category_check 
CHECK (category IN ('pearls', 'bracelets', 'necklaces', 'rings', 'other', 'pendentifs', 'parures'));