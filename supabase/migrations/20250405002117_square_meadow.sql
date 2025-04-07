/*
  # Fix default company name in handle_new_user function
  
  1. Changes
    - Remove default company name from handle_new_user function
    - Allow company_name to be NULL initially
    
  2. Security
    - Maintain existing RLS policies
*/

-- Update the handle_new_user function to not set a default company name
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
    NULL,        -- Allow company_name to be NULL initially
    'user',      -- Default role
    now(),       -- Initial last_login
    TRUE,        -- Default status (active)
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;