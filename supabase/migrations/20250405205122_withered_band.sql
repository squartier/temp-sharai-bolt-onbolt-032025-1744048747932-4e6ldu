/*
  # Revert RLS bypass and implement proper workflow policies

  1. Changes
    - Re-enable RLS on workflows table
    - Drop temporary unrestricted policies
    - Create new policies that:
      a. Allow admins to manage all workflows
      b. Allow users to view workflows they have access to
      c. Allow workflow owners to manage their workflows

  2. Security
    - Enables RLS on workflows table
    - Implements proper access control based on user roles and permissions
*/

-- Re-enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Drop temporary unrestricted policies
DROP POLICY IF EXISTS "Temporary unrestricted read" ON workflows;
DROP POLICY IF EXISTS "Temporary unrestricted insert" ON workflows;
DROP POLICY IF EXISTS "Temporary unrestricted update" ON workflows;
DROP POLICY IF EXISTS "Temporary unrestricted delete" ON workflows;

-- Create new policies
CREATE POLICY "Admins can manage all workflows"
ON workflows
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view assigned workflows"
ON workflows FOR SELECT
TO authenticated
USING (
  -- User is admin
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  -- User created the workflow
  auth.uid() = created_by
  OR
  -- User has been granted access via user_workflows
  EXISTS (
    SELECT 1 FROM user_workflows
    WHERE user_workflows.workflow_id = workflows.id
    AND user_workflows.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own workflows"
ON workflows
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);