/*
  # Fix allowed file types handling

  1. Changes
    - Drop existing constraint
    - Add new constraint with proper validation
    - Update any null values to empty array
    - Add comment explaining the purpose
    
  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Drop existing constraint if it exists
ALTER TABLE workflows
DROP CONSTRAINT IF EXISTS valid_allowed_file_types_check;

-- Add check constraint with proper validation
ALTER TABLE workflows
ADD CONSTRAINT valid_allowed_file_types_check
CHECK (jsonb_typeof(allowed_file_types) = 'array');

-- Update any null values to empty array
UPDATE workflows 
SET allowed_file_types = '[]'::jsonb
WHERE allowed_file_types IS NULL;

-- Add helpful comment
COMMENT ON COLUMN workflows.allowed_file_types IS 'Array of allowed file extensions (e.g., ["pdf", "docx", "txt"])';