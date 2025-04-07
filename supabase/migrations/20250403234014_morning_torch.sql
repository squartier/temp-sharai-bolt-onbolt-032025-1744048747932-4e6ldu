/*
  # Create Workflow Management Tables

  1. New Tables
    - `workflows`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `status` (text, default 'active')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      - `stages` (jsonb)
      - `assignment_rules` (jsonb)
      - `approval_levels` (integer)

  2. Security
    - Enable RLS on `workflows` table
    - Add policies for authenticated users to:
      - Read workflows they have access to
      - Create new workflows
      - Update workflows they own
      - Delete workflows they own
*/

CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  stages jsonb DEFAULT '[]'::jsonb,
  assignment_rules jsonb DEFAULT '{}'::jsonb,
  approval_levels integer DEFAULT 1,
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived'))
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read workflows they have access to"
  ON workflows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create workflows"
  ON workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own workflows"
  ON workflows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own workflows"
  ON workflows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();