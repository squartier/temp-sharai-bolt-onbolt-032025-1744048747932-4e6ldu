/*
  # Add admin user management policies
  
  1. Changes
    - Add policies to allow admin users to manage other users' profiles
    - Maintain existing policies for regular users
    - Add function to check if user is admin
    
  2. Security
    - Only admin users can modify other users' profiles
    - Regular users can still manage their own profiles
    - Proper RLS enforcement for all operations
*/

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies with admin privileges
CREATE POLICY "Users can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id  -- Users can read their own profile
  OR
  is_admin()       -- Admins can read all profiles
);

CREATE POLICY "Users can insert profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id  -- Users can only insert their own profile
  OR
  is_admin()       -- Admins can insert any profile
);

CREATE POLICY "Users can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id  -- Users can update their own profile
  OR
  is_admin()       -- Admins can update any profile
)
WITH CHECK (
  auth.uid() = id  -- Users can update their own profile
  OR
  is_admin()       -- Admins can update any profile
);

CREATE POLICY "Users can delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (
  is_admin()  -- Only admins can delete profiles
);

-- Make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;