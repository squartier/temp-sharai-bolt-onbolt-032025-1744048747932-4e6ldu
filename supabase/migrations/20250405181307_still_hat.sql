/*
  # Add User-Workflow Permissions

  1. New Tables
    - `user_workflows`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `workflow_id` (uuid, references workflows)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references profiles)

  2. Security
    - Enable RLS
    - Add policies for:
      - Admins can manage all permissions
      - Users can view their own permissions
*/

-- Create user_workflows table
CREATE TABLE IF NOT EXISTS user_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(user_id, workflow_id)
);

-- Enable RLS
ALTER TABLE user_workflows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all permissions"
ON user_workflows
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own permissions"
ON user_workflows
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create index for better query performance
CREATE INDEX idx_user_workflows_user_id ON user_workflows(user_id);
CREATE INDEX idx_user_workflows_workflow_id ON user_workflows(workflow_id);