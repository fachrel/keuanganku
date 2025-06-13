/*
  # Add budget reset tracking

  1. Changes
    - Add `last_reset` column to budgets table to track when budget period was last reset
    - Add `spent_amount` column to track current period spending (optional, for performance)
    - Update existing budgets to have initial reset date

  2. Security
    - Maintain existing RLS policies
*/

-- Add last_reset column to track when budget period was last reset
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'last_reset'
  ) THEN
    ALTER TABLE budgets ADD COLUMN last_reset timestamptz;
  END IF;
END $$;

-- Add spent_amount column to track current period spending (optional for performance)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'spent_amount'
  ) THEN
    ALTER TABLE budgets ADD COLUMN spent_amount numeric DEFAULT 0 CHECK (spent_amount >= 0);
  END IF;
END $$;

-- Set initial last_reset date for existing budgets
UPDATE budgets 
SET last_reset = created_at 
WHERE last_reset IS NULL;

-- Create function to reset budget spending for new periods
CREATE OR REPLACE FUNCTION reset_budget_if_new_period()
RETURNS TRIGGER AS $$
DECLARE
  current_period_start date;
  last_reset_date date;
BEGIN
  -- Calculate current period start based on budget period
  IF NEW.period = 'monthly' THEN
    current_period_start := date_trunc('month', CURRENT_DATE)::date;
  ELSE -- weekly
    -- Get Monday of current week
    current_period_start := (CURRENT_DATE - INTERVAL '1 day' * (EXTRACT(DOW FROM CURRENT_DATE) - 1))::date;
  END IF;
  
  -- Get last reset date
  last_reset_date := COALESCE(NEW.last_reset, NEW.created_at)::date;
  
  -- If we're in a new period, reset the spent amount
  IF last_reset_date < current_period_start THEN
    NEW.spent_amount := 0;
    NEW.last_reset := CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically reset budgets when accessed in new period
DROP TRIGGER IF EXISTS budget_period_reset ON budgets;
CREATE TRIGGER budget_period_reset
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION reset_budget_if_new_period();

-- Create function to update spent amount when transactions change
CREATE OR REPLACE FUNCTION update_budget_spent_amount()
RETURNS TRIGGER AS $$
DECLARE
  budget_record RECORD;
  current_period_start date;
  current_period_end date;
  total_spent numeric;
BEGIN
  -- Handle both INSERT and DELETE operations
  IF TG_OP = 'DELETE' THEN
    -- Use OLD record for DELETE
    IF OLD.type != 'expense' THEN
      RETURN OLD;
    END IF;
    
    -- Find budget for this category
    SELECT * INTO budget_record 
    FROM budgets 
    WHERE category_id = OLD.category_id AND user_id = OLD.user_id;
    
  ELSE
    -- Use NEW record for INSERT/UPDATE
    IF NEW.type != 'expense' THEN
      RETURN NEW;
    END IF;
    
    -- Find budget for this category
    SELECT * INTO budget_record 
    FROM budgets 
    WHERE category_id = NEW.category_id AND user_id = NEW.user_id;
  END IF;
  
  -- If no budget exists for this category, skip
  IF budget_record IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculate current period dates
  IF budget_record.period = 'monthly' THEN
    current_period_start := date_trunc('month', CURRENT_DATE)::date;
    current_period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date;
  ELSE -- weekly
    current_period_start := (CURRENT_DATE - INTERVAL '1 day' * (EXTRACT(DOW FROM CURRENT_DATE) - 1))::date;
    current_period_end := (current_period_start + INTERVAL '6 days')::date;
  END IF;
  
  -- Calculate total spent in current period
  SELECT COALESCE(SUM(amount), 0) INTO total_spent
  FROM transactions
  WHERE category_id = budget_record.category_id
    AND user_id = budget_record.user_id
    AND type = 'expense'
    AND date >= current_period_start
    AND date <= current_period_end;
  
  -- Update budget spent amount
  UPDATE budgets
  SET spent_amount = total_spent,
      last_reset = CASE 
        WHEN COALESCE(last_reset, created_at)::date < current_period_start 
        THEN CURRENT_TIMESTAMP 
        ELSE last_reset 
      END
  WHERE id = budget_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update spent amounts when transactions change
DROP TRIGGER IF EXISTS update_budget_on_transaction_change ON transactions;
CREATE TRIGGER update_budget_on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_spent_amount();