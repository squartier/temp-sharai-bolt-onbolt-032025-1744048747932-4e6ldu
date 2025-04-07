/*
  # Fix allowed file types constraint

  1. Changes
    - Drop existing constraint if it exists
    - Add new constraint with proper name
    - Update any null values to empty array
*/

-- Drop existing constraint if it exists
ALTER TABLE workflows
DROP CONSTRAINT IF EXISTS valid_allowed_file_types;

-- Add check constraint with a unique name
ALTER TABLE workflows
ADD CONSTRAINT valid_allowed_file_types_check
CHECK (jsonb_typeof(allowed_file_types) = 'array');

-- Update any null values to empty array
UPDATE workflows 
SET allowed_file_types = '[]'::jsonb
WHERE allowed_file_types IS NULL;