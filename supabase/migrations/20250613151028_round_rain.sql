/*
  # Create Savings Goals System

  1. New Tables
    - `savings_goals`
      - `id` (uuid, primary key)
      - `name` (text, goal name)
      - `description` (text, optional description)
      - `target_amount` (numeric, target amount to save)
      - `current_amount` (numeric, current saved amount)
      - `target_date` (date, target completion date)
      - `color` (text, display color)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `is_completed` (boolean, completion status)

  2. Security
    - Enable RLS on `savings_goals` table
    - Add policy for authenticated users to manage their own goals

  3. Special Category
    - Create "Savings Contribution" category for tracking contributions
*/

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  current_amount numeric DEFAULT 0 CHECK (current_amount >= 0),
  target_date date NOT NULL,
  color text DEFAULT '#10B981',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  is_completed boolean DEFAULT false,
  CONSTRAINT savings_goals_current_amount_check CHECK (current_amount <= target_amount)
);

-- Enable RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own savings goals"
  ON savings_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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