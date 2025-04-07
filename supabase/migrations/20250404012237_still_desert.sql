/*
  # Fix workflow data validation

  1. Changes
    - Add proper validation for workflow data
    - Update constraints to handle JSON data correctly
    
  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Drop existing constraint if it exists
ALTER TABLE workflows DROP CONSTRAINT IF EXISTS valid_api_config;
ALTER TABLE workflows DROP CONSTRAINT IF EXISTS valid_variables;

-- Add updated constraints
ALTER TABLE workflows
ADD CONSTRAINT valid_api_config CHECK (
  (api_config IS NULL) OR (
    jsonb_typeof(api_config) = 'object' 
    AND api_config ? 'method' 
    AND api_config ? 'url' 
    AND api_config ? 'content_type'
  )
);

ALTER TABLE workflows
ADD CONSTRAINT valid_variables CHECK (
  (variables IS NULL) OR (jsonb_typeof(variables) = 'array')
);