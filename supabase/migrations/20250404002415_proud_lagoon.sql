/*
  # Fix Workflow RLS Policies

  1. Changes
    - Update RLS policies for the workflows table to properly handle the created_by field
    - Ensure policies check for authenticated users and proper ownership
    
  2. Security
    - Modify existing policies to use auth.uid() for user identification
    - Ensure proper access control for CRUD operations
*/

-- First disable RLS to modify policies
ALTER TABLE workflows DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create workflows" ON workflows;
DROP POLICY IF EXISTS "Users can delete own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can read workflows they have access to" ON workflows;
DROP POLICY IF EXISTS "Users can update own workflows" ON workflows;

-- Create new policies with proper auth checks
CREATE POLICY "Enable insert for authenticated users" 
ON workflows FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable read access for workflow owners" 
ON workflows FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

CREATE POLICY "Enable update for workflow owners" 
ON workflows FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable delete for workflow owners" 
ON workflows FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Re-enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;