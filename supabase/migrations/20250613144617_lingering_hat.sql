/*
  # Fix duplicate default categories

  1. Problem
    - Default categories are being created twice due to triggers on both auth.users and public.users
    - This causes duplicate categories like "Hiburan", "Makanan & Minuman", etc.

  2. Solution
    - Remove the trigger from public.users table
    - Keep only the trigger on auth.users table
    - Add safeguards to prevent duplicate category creation
    - Clean up existing duplicate categories

  3. Changes
    - Drop the duplicate trigger
    - Update the create_default_categories function with duplicate prevention
    - Clean up existing duplicates
*/

-- First, let's clean up existing duplicate categories
-- We'll keep the first occurrence of each category name per user
DELETE FROM categories 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, name, type) id
  FROM categories
  ORDER BY user_id, name, type, created_at ASC
);

-- Drop the problematic trigger that creates duplicates
DROP TRIGGER IF EXISTS on_user_created_categories ON public.users;

-- Update the create_default_categories function to prevent duplicates
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if categories already exist for this user to prevent duplicates
  IF EXISTS (SELECT 1 FROM public.categories WHERE user_id = NEW.id LIMIT 1) THEN
    RETURN NEW;
  END IF;
  
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

-- Update the handle_new_user function to create categories directly
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
  
  -- Create default categories directly here to avoid duplicate triggers
  -- Check if categories already exist for this user to prevent duplicates
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = NEW.id LIMIT 1) THEN
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
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure only the auth.users trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();