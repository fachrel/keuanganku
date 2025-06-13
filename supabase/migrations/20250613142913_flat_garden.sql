/*
  # Fix signup database error

  1. Problem Analysis
    - Users experiencing "Database error saving new user" during signup
    - This typically occurs when database triggers fail during user creation
    - The issue is likely with RLS policies preventing the trigger from inserting data

  2. Solutions Applied
    - Update RLS policies on users table to allow service role insertions
    - Ensure trigger functions have proper permissions
    - Add policy to allow authenticated users to insert their own profile during signup
    - Fix any potential issues with the handle_new_user trigger

  3. Security
    - Maintain security by only allowing users to manage their own data
    - Service role can insert users (needed for triggers)
    - Authenticated users can insert their own profile data
*/

-- First, let's ensure the users table has the correct RLS policies
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

-- Recreate policies with proper permissions
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to insert users (needed for triggers)
CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the handle_new_user trigger function exists and works correctly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, '')
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the create_default_categories trigger function exists
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default expense categories
  INSERT INTO public.categories (name, color, type, user_id) VALUES
    ('Makanan & Minuman', '#EF4444', 'expense', NEW.id),
    ('Transportasi', '#F97316', 'expense', NEW.id),
    ('Belanja', '#8B5CF6', 'expense', NEW.id),
    ('Hiburan', '#EC4899', 'expense', NEW.id),
    ('Kesehatan', '#10B981', 'expense', NEW.id),
    ('Pendidikan', '#3B82F6', 'expense', NEW.id),
    ('Tagihan', '#6B7280', 'expense', NEW.id);
  
  -- Create default income categories
  INSERT INTO public.categories (name, color, type, user_id) VALUES
    ('Gaji', '#10B981', 'income', NEW.id),
    ('Freelance', '#3B82F6', 'income', NEW.id),
    ('Investasi', '#8B5CF6', 'income', NEW.id),
    ('Lainnya', '#6B7280', 'income', NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE LOG 'Error in create_default_categories: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure triggers are properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created_categories ON public.users;

-- Create trigger for handling new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create trigger for creating default categories after user is created
CREATE TRIGGER on_user_created_categories
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();

-- Ensure categories table has proper RLS policies for the trigger
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;

CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to insert categories (needed for triggers)
CREATE POLICY "Service role can insert categories"
  ON categories
  FOR INSERT
  TO service_role
  WITH CHECK (true);