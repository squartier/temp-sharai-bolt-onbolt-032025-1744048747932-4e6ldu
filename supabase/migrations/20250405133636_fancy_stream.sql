/*
  # Fix supports_images column and add constraints
  
  1. Changes
    - Add supports_images column if it doesn't exist
    - Set default value to false
    - Add helpful comment
    - Update any null values
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add supports_images column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE workflows 
  ADD COLUMN IF NOT EXISTS supports_images boolean DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Update any null values to false
UPDATE workflows 
SET supports_images = false 
WHERE supports_images IS NULL;

-- Add helpful comment for documentation
COMMENT ON COLUMN workflows.supports_images IS 'Indicates whether the workflow supports image file uploads';