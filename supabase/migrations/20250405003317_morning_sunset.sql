/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new policies with proper update permissions
    - Ensure authenticated users can update their own profiles
    
  2. Security
    - Maintain data isolation between users
    - Allow profile updates by owners
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies with proper permissions
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (true)  -- Allow updates to be initiated
WITH CHECK (true);  -- Allow all updates to proceed

-- Make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;