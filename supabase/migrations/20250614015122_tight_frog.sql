/*
  # Add Accounts System

  1. New Tables
    - `accounts`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text)
      - `balance` (numeric, default 0)
      - `color` (text, default '#3B82F6')
      - `icon` (text, default 'Wallet')
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modify Tables
    - Add `account_id` to `transactions` table

  3. Security
    - Enable RLS on `accounts` table
    - Add policies for authenticated users to manage their own accounts
    - Update transaction policies to include account access

  4. Functions
    - Create function to update account balances
    - Create trigger to automatically update balances on transaction changes
*/

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'other',
  balance numeric DEFAULT 0,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'Wallet',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add account_id to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN account_id uuid REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on accounts table
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for accounts
CREATE POLICY "Users can manage their own accounts"
  ON accounts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);

-- Create function to update account balances
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.account_id IS NOT NULL THEN
      UPDATE accounts 
      SET balance = balance + CASE 
        WHEN NEW.type = 'income' THEN NEW.amount 
        ELSE -NEW.amount 
      END,
      updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Revert old transaction effect
    IF OLD.account_id IS NOT NULL THEN
      UPDATE accounts 
      SET balance = balance - CASE 
        WHEN OLD.type = 'income' THEN OLD.amount 
        ELSE -OLD.amount 
      END,
      updated_at = now()
      WHERE id = OLD.account_id;
    END IF;
    
    -- Apply new transaction effect
    IF NEW.account_id IS NOT NULL THEN
      UPDATE accounts 
      SET balance = balance + CASE 
        WHEN NEW.type = 'income' THEN NEW.amount 
        ELSE -NEW.amount 
      END,
      updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      UPDATE accounts 
      SET balance = balance - CASE 
        WHEN OLD.type = 'income' THEN OLD.amount 
        ELSE -OLD.amount 
      END,
      updated_at = now()
      WHERE id = OLD.account_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update account balances
DROP TRIGGER IF EXISTS update_account_balance_trigger ON transactions;
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

-- Create function to update account updated_at timestamp
CREATE OR REPLACE FUNCTION update_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for account updated_at
DROP TRIGGER IF EXISTS update_account_timestamp ON accounts;
CREATE TRIGGER update_account_timestamp
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_account_updated_at();

-- Add constraints
ALTER TABLE accounts ADD CONSTRAINT accounts_balance_check CHECK (balance >= 0);
ALTER TABLE accounts ADD CONSTRAINT accounts_name_not_empty CHECK (length(trim(name)) > 0);

-- Insert default accounts for existing users (optional)
-- This will create a default "Cash" account for users who don't have any accounts yet
INSERT INTO accounts (name, type, color, icon, user_id)
SELECT 
  'Cash' as name,
  'cash' as type,
  '#10B981' as color,
  'Banknote' as icon,
  u.id as user_id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM accounts a WHERE a.user_id = u.id
)
ON CONFLICT DO NOTHING;