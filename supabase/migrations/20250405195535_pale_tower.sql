/*
  # Verify and update workflow RLS policies

  1. Changes
    - Drop existing RLS policies on workflows table
    - Add new RLS policies with proper access control
    - Enable RLS on workflows table

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Ensure users can only access their own workflows
*/

-- First enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable delete for workflow owners" ON workflows;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON workflows;
DROP POLICY IF EXISTS "Enable read access for workflow owners" ON workflows;
DROP POLICY IF EXISTS "Enable update for workflow owners" ON workflows;

-- Create new policies
CREATE POLICY "Enable read access for workflow owners"
ON workflows FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 FROM user_workflows 
    WHERE user_workflows.workflow_id = workflows.id 
    AND user_workflows.user_id = auth.uid()
  )
);

CREATE POLICY "Enable insert for authenticated users"
ON workflows FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update for workflow owners"
ON workflows FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable delete for workflow owners"
ON workflows FOR DELETE
TO authenticated
USING (auth.uid() = created_by);