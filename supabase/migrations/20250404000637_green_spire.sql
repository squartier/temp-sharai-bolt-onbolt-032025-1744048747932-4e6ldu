/*
  # Add API configuration and document upload support to workflows

  1. Changes
    - Add `worker_id` column for storing the worker identifier
    - Add `api_auth_token` column for storing the Bearer token
    - Add `supports_documents` column to enable/disable document uploads
    - Add `api_config` JSONB column to store API configuration details
    - Add `variables` JSONB column to store workflow variables

  2. Security
    - Maintain existing RLS policies
    - Add validation check for api_config structure
*/

-- Add new columns to workflows table
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS worker_id text,
ADD COLUMN IF NOT EXISTS api_auth_token text,
ADD COLUMN IF NOT EXISTS supports_documents boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS api_config jsonb DEFAULT jsonb_build_object(
  'method', 'post',
  'url', 'https://api.mindstudio.ai/developer/v2/workers/run',
  'content_type', 'application/json'
),
ADD COLUMN IF NOT EXISTS variables jsonb DEFAULT '[]'::jsonb;

-- Add check constraint for api_config structure
ALTER TABLE workflows
ADD CONSTRAINT valid_api_config CHECK (
  jsonb_typeof(api_config) = 'object' AND
  api_config ? 'method' AND
  api_config ? 'url' AND
  api_config ? 'content_type'
);

-- Add check constraint for variables structure
ALTER TABLE workflows
ADD CONSTRAINT valid_variables CHECK (
  jsonb_typeof(variables) = 'array'
);

-- Update the trigger to handle the new columns
CREATE OR REPLACE FUNCTION update_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;