import { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadTransactions();
      loadCategories();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(id, name, color, type),
          account:accounts(id, name, type)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'category' | 'account'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            ...transaction,
            user_id: user.id,
          },
        ])
        .select(`
          *,
          category:categories(id, name, color, type),
          account:accounts(id, name, type)
        `)
        .single();

      if (error) {
        console.error('Error adding transaction:', error);
        return;
      }

      setTransactions(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        return;
      }

      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            ...category,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding category:', error);
        return;
      }

      setCategories(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // First check if there are any transactions using this category
      const { data: transactionsUsingCategory, error: checkError } = await supabase
        .from('transactions')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (checkError) {
        console.error('Error checking category usage:', checkError);
        return false;
      }

      if (transactionsUsingCategory && transactionsUsingCategory.length > 0) {
        alert('Tidak dapat menghapus kategori yang masih digunakan dalam transaksi. Hapus transaksi terkait terlebih dahulu.');
        return false;
      }

      // Also check if there are any budgets using this category
      const { data: budgetsUsingCategory, error: budgetCheckError } = await supabase
        .from('budgets')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (budgetCheckError) {
        console.error('Error checking budget usage:', budgetCheckError);
        return false;
      }

      if (budgetsUsingCategory && budgetsUsingCategory.length > 0) {
        alert('Tidak dapat menghapus kategori yang masih digunakan dalam anggaran. Hapus anggaran terkait terlebih dahulu.');
        return false;
      }

      // If no dependencies, proceed with deletion
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        return false;
      }

      setCategories(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  };

  return {
    transactions,
    categories,
    loading,
    addTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory,
    loadTransactions,
    loadCategories,
  };
};