/*
  # Add supports_documents field and fix variables constraint

  1. Changes
    - Add supports_documents boolean column to workflows table
    - Update valid_variables constraint to handle array of objects
    - Add default value for supports_documents

  2. Notes
    - Maintains existing data integrity
    - Ensures backward compatibility
    - Uses plpgsql function for validation with correct loop syntax
*/

-- Create a function to validate the variables array structure
CREATE OR REPLACE FUNCTION check_variables_array(vars jsonb)
RETURNS boolean AS $$
DECLARE
  elem jsonb;
BEGIN
  -- Return true for NULL values
  IF vars IS NULL THEN
    RETURN true;
  END IF;

  -- Check if it's an array
  IF jsonb_typeof(vars) != 'array' THEN
    RETURN false;
  END IF;

  -- Check each element
  FOR elem IN 
    SELECT value FROM jsonb_array_elements(vars)
  LOOP
    IF jsonb_typeof(elem) != 'object' 
       OR NOT (elem ? 'name')
       OR NOT (elem ? 'value')
       OR jsonb_typeof(elem->'name') != 'string'
       OR jsonb_typeof(elem->'value') != 'string' THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add supports_documents column if it doesn't exist
ALTER TABLE workflows 
ADD COLUMN IF NOT EXISTS supports_documents boolean DEFAULT false;

-- Drop existing valid_variables constraint
ALTER TABLE workflows 
DROP CONSTRAINT IF EXISTS valid_variables;

-- Add new valid_variables constraint using the validation function
ALTER TABLE workflows
ADD CONSTRAINT valid_variables 
CHECK (check_variables_array(variables));