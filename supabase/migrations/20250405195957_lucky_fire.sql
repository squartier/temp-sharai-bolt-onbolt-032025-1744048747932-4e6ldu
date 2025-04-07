/*
  # Temporarily bypass RLS policies for testing

  This migration temporarily disables RLS policies on the workflows table
  to help diagnose data access issues. This should ONLY be used for testing
  and must be reverted after testing is complete.

  1. Changes
    - Temporarily disable RLS on workflows table
    - Create unrestricted policies for testing
*/

-- Temporarily disable RLS
ALTER TABLE workflows DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for workflow owners" ON workflows;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON workflows;
DROP POLICY IF EXISTS "Enable read access for workflow owners" ON workflows;
DROP POLICY IF EXISTS "Enable update for workflow owners" ON workflows;

-- Create unrestricted policies for testing
CREATE POLICY "Temporary unrestricted read"
ON workflows FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Temporary unrestricted insert"
ON workflows FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Temporary unrestricted update"
ON workflows FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Temporary unrestricted delete"
ON workflows FOR DELETE
TO authenticated
USING (true);