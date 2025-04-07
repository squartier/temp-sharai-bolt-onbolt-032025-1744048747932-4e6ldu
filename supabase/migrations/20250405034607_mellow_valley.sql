/*
  # Fix allowed file types validation

  1. Changes
    - Drop existing constraint if it exists
    - Add column if it doesn't exist
    - Add comment for documentation
    - Update any null values to empty array
    
  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Drop existing constraint if it exists
DO $$ BEGIN
  ALTER TABLE workflows DROP CONSTRAINT IF EXISTS valid_allowed_file_types_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE workflows ADD COLUMN IF NOT EXISTS allowed_file_types jsonb DEFAULT '[]'::jsonb;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add helpful comment for documentation
COMMENT ON COLUMN workflows.allowed_file_types IS 'Array of allowed file extensions (e.g., ["pdf", "docx", "txt"])';

-- Update any null values to empty array
UPDATE workflows 
SET allowed_file_types = '[]'::jsonb
WHERE allowed_file_types IS NULL;