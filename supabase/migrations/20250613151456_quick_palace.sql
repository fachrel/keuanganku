/*
  # Create savings goals table

  1. New Tables
    - `savings_goals`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `target_amount` (numeric, required, > 0)
      - `current_amount` (numeric, default 0, >= 0)
      - `target_date` (date, required)
      - `color` (text, default '#10B981')
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz, default now())
      - `is_completed` (boolean, default false)

  2. Security
    - Enable RLS on `savings_goals` table
    - Add policy for authenticated users to manage their own goals

  3. Performance
    - Add indexes for user_id and target_date

  4. Business Logic
    - Add trigger to automatically update completion status
    - Add constraints for data validation
*/

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  target_date date NOT NULL,
  color text DEFAULT '#10B981',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  is_completed boolean DEFAULT false
);

-- Add constraints with conditional creation
DO $$
BEGIN
  -- Add target_amount check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'savings_goals_target_amount_check'
  ) THEN
    ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_target_amount_check 
    CHECK (target_amount > 0);
  END IF;

  -- Add current_amount check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'savings_goals_current_amount_positive_check'
  ) THEN
    ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_current_amount_positive_check 
    CHECK (current_amount >= 0);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'savings_goals' 
    AND policyname = 'Users can manage their own savings goals'
  ) THEN
    CREATE POLICY "Users can manage their own savings goals"
      ON savings_goals
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON savings_goals(target_date);

-- Function to update goal completion status
CREATE OR REPLACE FUNCTION update_savings_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update completion status based on current vs target amount
  NEW.is_completed := (NEW.current_amount >= NEW.target_amount);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update completion status
DROP TRIGGER IF EXISTS update_goal_completion ON savings_goals;
CREATE TRIGGER update_goal_completion
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_savings_goal_completion();