/*
  # Advanced Monthly Budgeting System

  1. Schema Updates
    - Add default_budget_amount to categories table
    - Create monthly_budgets table for month-specific budget planning
    - Add indexes and constraints for performance and data integrity

  2. Security
    - Enable RLS on monthly_budgets table
    - Add policies for authenticated users to manage their own budgets

  3. Features
    - Template-based budget creation from category defaults
    - Month-specific budget tracking with actual vs planned amounts
    - Historical budget data preservation
*/

-- Add default_budget_amount to categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'default_budget_amount'
  ) THEN
    ALTER TABLE categories ADD COLUMN default_budget_amount numeric DEFAULT 0 CHECK (default_budget_amount >= 0);
  END IF;
END $$;

-- Create monthly_budgets table
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2020 AND year <= 2100),
  planned_amount numeric NOT NULL DEFAULT 0 CHECK (planned_amount >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one budget per category per month/year per user
  UNIQUE(user_id, category_id, month, year)
);

-- Enable RLS on monthly_budgets
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monthly_budgets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'monthly_budgets' 
    AND policyname = 'Users can manage their own monthly budgets'
  ) THEN
    CREATE POLICY "Users can manage their own monthly budgets"
      ON monthly_budgets
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_user_id ON monthly_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_category_id ON monthly_budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_month_year ON monthly_budgets(month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_user_month_year ON monthly_budgets(user_id, month, year);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monthly_budget_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_monthly_budget_timestamp ON monthly_budgets;
CREATE TRIGGER update_monthly_budget_timestamp
  BEFORE UPDATE ON monthly_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_budget_updated_at();

-- Function to create monthly budget from templates
CREATE OR REPLACE FUNCTION create_monthly_budget_from_templates(
  p_user_id uuid,
  p_month integer,
  p_year integer
)
RETURNS integer AS $$
DECLARE
  category_record RECORD;
  inserted_count integer := 0;
BEGIN
  -- Insert budget records for all expense categories with default amounts > 0
  FOR category_record IN 
    SELECT id, default_budget_amount
    FROM categories 
    WHERE user_id = p_user_id 
    AND type = 'expense' 
    AND default_budget_amount > 0
  LOOP
    INSERT INTO monthly_budgets (user_id, category_id, month, year, planned_amount)
    VALUES (p_user_id, category_record.id, p_month, p_year, category_record.default_budget_amount)
    ON CONFLICT (user_id, category_id, month, year) DO NOTHING;
    
    GET DIAGNOSTICS inserted_count = inserted_count + ROW_COUNT;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;