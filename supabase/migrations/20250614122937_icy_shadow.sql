/*
  # Add support for transfer transactions

  1. Schema Updates
    - Modify transactions table to support 'transfer' type
    - Create function to get or create transfer category
    - Update budget calculation to exclude transfer transactions
    
  2. Account Balance Updates
    - Modify account balance trigger to handle transfer transactions correctly
*/

-- Modify the type check constraint to include 'transfer' type
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('income', 'expense', 'transfer'));

-- Create a function to get or create a transfer category
CREATE OR REPLACE FUNCTION get_or_create_transfer_category(p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_category_id uuid;
BEGIN
  -- First try to find an existing transfer category
  SELECT id INTO v_category_id
  FROM categories
  WHERE user_id = p_user_id AND name = 'Transfer' AND type = 'expense'
  LIMIT 1;
  
  -- If no category exists, create one
  IF v_category_id IS NULL THEN
    INSERT INTO categories (name, color, type, user_id)
    VALUES ('Transfer', '#6B7280', 'expense', p_user_id)
    RETURNING id INTO v_category_id;
  END IF;
  
  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql;

-- Update the budget spent amount function to exclude transfer transactions
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
    IF OLD.type != 'expense' OR OLD.type = 'transfer' THEN
      RETURN OLD;
    END IF;
    
    -- Find budget for this category
    SELECT * INTO budget_record 
    FROM budgets 
    WHERE category_id = OLD.category_id AND user_id = OLD.user_id;
    
  ELSE
    -- Use NEW record for INSERT/UPDATE
    IF NEW.type != 'expense' OR NEW.type = 'transfer' THEN
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
  
  -- Calculate total spent in current period (excluding transfers)
  SELECT COALESCE(SUM(amount), 0) INTO total_spent
  FROM transactions
  WHERE category_id = budget_record.category_id
    AND user_id = budget_record.user_id
    AND type = 'expense'
    AND type != 'transfer'
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

-- Update the account balance trigger to handle transfer transactions
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.account_id IS NOT NULL THEN
      -- For transfer type, subtract from source account and add to destination account
      IF NEW.type = 'transfer' THEN
        -- If description contains "Transfer ke", it's the source account (subtract)
        IF NEW.description LIKE 'Transfer ke%' THEN
          UPDATE accounts 
          SET balance = balance - NEW.amount,
              updated_at = now()
          WHERE id = NEW.account_id;
        -- If description contains "Transfer dari", it's the destination account (add)
        ELSIF NEW.description LIKE 'Transfer dari%' THEN
          UPDATE accounts 
          SET balance = balance + NEW.amount,
              updated_at = now()
          WHERE id = NEW.account_id;
        END IF;
      -- For regular income/expense
      ELSE
        UPDATE accounts 
        SET balance = balance + CASE 
          WHEN NEW.type = 'income' THEN NEW.amount 
          ELSE -NEW.amount 
        END,
        updated_at = now()
        WHERE id = NEW.account_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Revert old transaction effect
    IF OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'transfer' THEN
        -- If description contains "Transfer ke", it's the source account (add back)
        IF OLD.description LIKE 'Transfer ke%' THEN
          UPDATE accounts 
          SET balance = balance + OLD.amount,
              updated_at = now()
          WHERE id = OLD.account_id;
        -- If description contains "Transfer dari", it's the destination account (subtract)
        ELSIF OLD.description LIKE 'Transfer dari%' THEN
          UPDATE accounts 
          SET balance = balance - OLD.amount,
              updated_at = now()
          WHERE id = OLD.account_id;
        END IF;
      ELSE
        UPDATE accounts 
        SET balance = balance - CASE 
          WHEN OLD.type = 'income' THEN OLD.amount 
          ELSE -OLD.amount 
        END,
        updated_at = now()
        WHERE id = OLD.account_id;
      END IF;
    END IF;
    
    -- Apply new transaction effect
    IF NEW.account_id IS NOT NULL THEN
      IF NEW.type = 'transfer' THEN
        -- If description contains "Transfer ke", it's the source account (subtract)
        IF NEW.description LIKE 'Transfer ke%' THEN
          UPDATE accounts 
          SET balance = balance - NEW.amount,
              updated_at = now()
          WHERE id = NEW.account_id;
        -- If description contains "Transfer dari", it's the destination account (add)
        ELSIF NEW.description LIKE 'Transfer dari%' THEN
          UPDATE accounts 
          SET balance = balance + NEW.amount,
              updated_at = now()
          WHERE id = NEW.account_id;
        END IF;
      ELSE
        UPDATE accounts 
        SET balance = balance + CASE 
          WHEN NEW.type = 'income' THEN NEW.amount 
          ELSE -NEW.amount 
        END,
        updated_at = now()
        WHERE id = NEW.account_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'transfer' THEN
        -- If description contains "Transfer ke", it's the source account (add back)
        IF OLD.description LIKE 'Transfer ke%' THEN
          UPDATE accounts 
          SET balance = balance + OLD.amount,
              updated_at = now()
          WHERE id = OLD.account_id;
        -- If description contains "Transfer dari", it's the destination account (subtract)
        ELSIF OLD.description LIKE 'Transfer dari%' THEN
          UPDATE accounts 
          SET balance = balance - OLD.amount,
              updated_at = now()
          WHERE id = OLD.account_id;
        END IF;
      ELSE
        UPDATE accounts 
        SET balance = balance - CASE 
          WHEN OLD.type = 'income' THEN OLD.amount 
          ELSE -OLD.amount 
        END,
        updated_at = now()
        WHERE id = OLD.account_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;