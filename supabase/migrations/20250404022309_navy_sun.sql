/*
  # Add workflow logs table
  
  1. New Tables
    - `workflow_logs`
      - `id` (uuid, primary key)
      - `workflow_id` (uuid, foreign key to workflows)
      - `timestamp` (timestamptz)
      - `level` (text: 'info', 'error', 'warning')
      - `message` (text)
      - `details` (jsonb, for additional error context)
      - `created_by` (uuid, foreign key to users)

  2. Security
    - Enable RLS on workflow_logs table
    - Add policies for workflow owners to manage their logs
*/

-- Create enum for log levels
CREATE TYPE log_level AS ENUM ('info', 'error', 'warning');

-- Create workflow_logs table
CREATE TABLE workflow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  level log_level NOT NULL,
  message text NOT NULL,
  details jsonb DEFAULT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their workflow logs"
  ON workflow_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_logs.workflow_id
      AND workflows.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs for their workflows"
  ON workflow_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_logs.workflow_id
      AND workflows.created_by = auth.uid()
    )
  );

-- Create index for faster log queries
CREATE INDEX workflow_logs_workflow_id_timestamp_idx ON workflow_logs (workflow_id, timestamp DESC);