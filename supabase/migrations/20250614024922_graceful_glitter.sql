/*
  # Create wishlist system

  1. New Tables
    - `wishlist_items`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `cost` (numeric, required)
      - `urgency` (text, enum: low/medium/high)
      - `image_url` (text, optional)
      - `due_date` (date, optional)
      - `is_archived` (boolean, default false)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `wishlist_items` table
    - Add policy for authenticated users to manage their own wishlist items

  3. Indexes
    - Add indexes for performance optimization
*/

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cost numeric NOT NULL CHECK (cost >= 0),
  urgency text NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  image_url text,
  due_date date,
  is_archived boolean DEFAULT false,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on wishlist_items table
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own wishlist items
CREATE POLICY "Users can manage their own wishlist items"
  ON wishlist_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_urgency ON wishlist_items(urgency);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_is_archived ON wishlist_items(is_archived);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_due_date ON wishlist_items(due_date);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_created_at ON wishlist_items(created_at);

-- Create function to update wishlist item updated_at timestamp
CREATE OR REPLACE FUNCTION update_wishlist_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for wishlist item updated_at
DROP TRIGGER IF EXISTS update_wishlist_item_timestamp ON wishlist_items;
CREATE TRIGGER update_wishlist_item_timestamp
  BEFORE UPDATE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_item_updated_at();

-- Add constraints
ALTER TABLE wishlist_items ADD CONSTRAINT wishlist_items_name_not_empty CHECK (length(trim(name)) > 0);