import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Translation function - basic implementation
const translations: Record<string, string> = {
  // Navigation
  dashboard: 'Dashboard',
  transactions: 'Transactions',
  budgets: 'Budgets',
  savings_goals: 'Savings Goals',
  accounts: 'Accounts',
  reports: 'Reports',
  settings: 'Settings',
  sign_out: 'Sign Out',
  
  // Common actions
  add: 'Add',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  confirm: 'Confirm',
  
  // Transaction related
  add_transaction: 'Add Transaction',
  add_first_transaction: 'Add Your First Transaction',
  manage_transactions_description: 'Track your income and expenses',
  search_transactions: 'Search transactions...',
  no_transactions: 'No transactions found',
  no_transactions_description: 'Start by adding your first transaction to track your finances.',
  confirm_delete_transaction: 'Are you sure you want to delete this transaction?',
  
  // Types
  income: 'Income',
  expense: 'Expense',
  all_types: 'All Types',
  
  // Sorting
  sort_by_date: 'Sort by Date',
  sort_by_amount: 'Sort by Amount',
  
  // Categories
  categories: 'Categories',
  category: 'Category',
  
  // Accounts
  account: 'Account',
  
  // Budget
  budget: 'Budget',
  
  // Common
  amount: 'Amount',
  description: 'Description',
  date: 'Date',
  name: 'Name',
  type: 'Type',
  color: 'Color',
  
  // Messages
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, t }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};