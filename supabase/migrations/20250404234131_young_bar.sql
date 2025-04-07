/*
  # Enhance profiles table for user management

  1. Changes
    - Add company_name column for storing user's company
    - Add role column with enum type for user roles
    - Add last_login column to track user activity
    - Add status column to manage user state
    - Update handle_new_user function to set default values

  2. Security
    - Maintain existing RLS policies
    - Add check constraint for valid roles
*/

-- Create role type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user', 'manager');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user'::user_role,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;

-- Update the handle_new_user function to set default values
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    company_name,
    role,
    last_login,
    status,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    'Default Company', -- Default company name
    'user',           -- Default role
    now(),           -- Initial last_login
    TRUE,            -- Default status (active)
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;