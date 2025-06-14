export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
  user_id: string;
  created_at: string;
  default_budget_amount?: number;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  icon: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category_id: string;
  type: 'income' | 'expense';
  date: string;
  user_id: string;
  created_at: string;
  account_id?: string;
  category: Category;
  account?: Account;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  period: 'monthly' | 'weekly';
  user_id: string;
  created_at: string;
  last_reset?: string;
  spent_amount?: number;
  category: Category;
}

export interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  color: string;
  user_id: string;
  created_at: string;
  is_completed: boolean;
}

export interface MonthlyBudget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  planned_amount: number;
  created_at: string;
  updated_at: string;
  categories: Category;
}

export interface MonthlyBudgetWithDetails extends MonthlyBudget {
  category: Category;
  actual_spent: number;
  remaining: number;
  progress_percentage: number;
  status: 'good' | 'warning' | 'danger';
}

export interface WishlistItem {
  id: string;
  name: string;
  description?: string;
  cost: number;
  urgency: 'low' | 'medium' | 'high';
  image_url?: string;
  due_date?: string;
  is_archived: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}