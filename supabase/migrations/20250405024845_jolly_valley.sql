/*
  # Add allowed file types to workflows table
  
  1. Changes
    - Add allowed_file_types column to workflows table to store supported file extensions
    - Column is JSONB array to store multiple file extensions
    - Only relevant when supports_documents is true
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add allowed_file_types column
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS allowed_file_types jsonb DEFAULT '[]'::jsonb;

-- Add check constraint to ensure allowed_file_types is an array
ALTER TABLE workflows
ADD CONSTRAINT valid_allowed_file_types
CHECK (jsonb_typeof(allowed_file_types) = 'array');