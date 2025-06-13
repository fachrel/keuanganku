/*
  # Fix user signup trigger function

  1. Updates
    - Fix the `handle_new_user` trigger function to properly handle user insertion
    - Ensure the function correctly maps auth.users data to public.users table
    - Handle potential null values and data type mismatches

  2. Security
    - Maintains existing RLS policies
    - Ensures proper error handling in the trigger function
*/

-- Drop and recreate the handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, ''),
    NEW.created_at
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();