/*
  # Skema Database untuk Aplikasi Manajemen Keuangan

  1. Tabel Baru
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `color` (text)
      - `type` (text) - 'income' atau 'expense'
      - `user_id` (uuid, foreign key ke auth.users)
      - `created_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `amount` (numeric)
      - `description` (text)
      - `category_id` (uuid, foreign key ke categories)
      - `type` (text) - 'income' atau 'expense'
      - `date` (date)
      - `user_id` (uuid, foreign key ke auth.users)
      - `created_at` (timestamp)
    
    - `budgets`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key ke categories)
      - `amount` (numeric)
      - `period` (text) - 'monthly' atau 'weekly'
      - `user_id` (uuid, foreign key ke auth.users)
      - `created_at` (timestamp)

  2. Keamanan
    - Enable RLS pada semua tabel
    - Tambahkan kebijakan untuk pengguna yang terautentikasi
*/

-- Tabel Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tabel Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  date date NOT NULL DEFAULT CURRENT_DATE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tabel Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  period text NOT NULL CHECK (period IN ('monthly', 'weekly')) DEFAULT 'monthly',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budgets"
  ON budgets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indeks untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);