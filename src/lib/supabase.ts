import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL dan Anon Key harus diatur di file .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipe database yang dihasilkan dari skema Supabase
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          type: 'income' | 'expense';
          user_id: string;
          created_at: string;
          default_budget_amount?: number;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          type: 'income' | 'expense';
          user_id: string;
          created_at?: string;
          default_budget_amount?: number;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          type?: 'income' | 'expense';
          user_id?: string;
          created_at?: string;
          default_budget_amount?: number;
        };
      };
      accounts: {
        Row: {
          id: string;
          name: string;
          type: string;
          balance: number;
          color: string;
          icon: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string;
          balance?: number;
          color?: string;
          icon?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          balance?: number;
          color?: string;
          icon?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          amount: number;
          description: string;
          category_id: string;
          type: 'income' | 'expense';
          date: string;
          user_id: string;
          created_at: string;
          account_id?: string;
        };
        Insert: {
          id?: string;
          amount: number;
          description: string;
          category_id: string;
          type: 'income' | 'expense';
          date?: string;
          user_id: string;
          created_at?: string;
          account_id?: string;
        };
        Update: {
          id?: string;
          amount?: number;
          description?: string;
          category_id?: string;
          type?: 'income' | 'expense';
          date?: string;
          user_id?: string;
          created_at?: string;
          account_id?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          category_id: string;
          amount: number;
          period: 'monthly' | 'weekly';
          user_id: string;
          created_at: string;
          last_reset?: string;
          spent_amount?: number;
        };
        Insert: {
          id?: string;
          category_id: string;
          amount: number;
          period?: 'monthly' | 'weekly';
          user_id: string;
          created_at?: string;
          last_reset?: string;
          spent_amount?: number;
        };
        Update: {
          id?: string;
          category_id?: string;
          amount?: number;
          period?: 'monthly' | 'weekly';
          user_id?: string;
          created_at?: string;
          last_reset?: string;
          spent_amount?: number;
        };
      };
    };
  };
}