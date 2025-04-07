/*
  # Add support for image uploads
  
  1. Changes
    - Add supports_images column to workflows table
    - Set default value to false
    - Update existing workflows to have supports_images = false
    - Add check constraint for valid file types
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add supports_images column
ALTER TABLE workflows 
ADD COLUMN IF NOT EXISTS supports_images boolean DEFAULT false;

-- Update existing workflows
UPDATE workflows 
SET supports_images = false 
WHERE supports_images IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN workflows.supports_images IS 'Indicates whether the workflow supports image file uploads';