import { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { logError } from '../utils/errorHandler';

export const useTransactions = () => {
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
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
        logError(error, 'Loading transactions');
        showError('Gagal memuat transaksi', 'Silakan refresh halaman');
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      logError(error, 'Loading transactions');
      showError('Gagal memuat transaksi', 'Silakan refresh halaman');
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
        logError(error, 'Loading categories');
        showError('Gagal memuat kategori', 'Silakan refresh halaman');
        return;
      }

      setCategories(data || []);
    } catch (error) {
      logError(error, 'Loading categories');
      showError('Gagal memuat kategori', 'Silakan refresh halaman');
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
        logError(error, 'Adding transaction');
        throw error;
      }

      // Optimistic update
      setTransactions(prev => [data, ...prev]);
      
      // Reload to ensure consistency
      setTimeout(() => {
        loadTransactions();
      }, 500);

    } catch (error) {
      logError(error, 'Adding transaction');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        logError(error, 'Deleting transaction');
        showError('Gagal menghapus transaksi', 'Silakan coba lagi');
        return;
      }

      // Optimistic update
      setTransactions(prev => prev.filter(t => t.id !== id));
      showSuccess('Transaksi berhasil dihapus', 'Data telah dihapus');
      
      // Reload to ensure consistency
      setTimeout(() => {
        loadTransactions();
      }, 500);

    } catch (error) {
      logError(error, 'Deleting transaction');
      showError('Gagal menghapus transaksi', 'Silakan coba lagi');
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
        logError(error, 'Adding category');
        showError('Gagal menambahkan kategori', 'Silakan coba lagi');
        return;
      }

      setCategories(prev => [...prev, data]);
      showSuccess('Kategori berhasil ditambahkan', `Kategori ${data.name} telah dibuat`);
    } catch (error) {
      logError(error, 'Adding category');
      showError('Gagal menambahkan kategori', 'Silakan coba lagi');
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
        logError(checkError, 'Checking category usage');
        showError('Gagal memeriksa penggunaan kategori', 'Silakan coba lagi');
        return false;
      }

      if (transactionsUsingCategory && transactionsUsingCategory.length > 0) {
        showError('Tidak dapat menghapus kategori', 'Kategori masih digunakan dalam transaksi');
        return false;
      }

      // Also check if there are any budgets using this category
      const { data: budgetsUsingCategory, error: budgetCheckError } = await supabase
        .from('budgets')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (budgetCheckError) {
        logError(budgetCheckError, 'Checking budget usage');
        showError('Gagal memeriksa penggunaan anggaran', 'Silakan coba lagi');
        return false;
      }

      if (budgetsUsingCategory && budgetsUsingCategory.length > 0) {
        showError('Tidak dapat menghapus kategori', 'Kategori masih digunakan dalam anggaran');
        return false;
      }

      // If no dependencies, proceed with deletion
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        logError(error, 'Deleting category');
        showError('Gagal menghapus kategori', 'Silakan coba lagi');
        return false;
      }

      setCategories(prev => prev.filter(c => c.id !== id));
      showSuccess('Kategori berhasil dihapus', 'Kategori telah dihapus');
      return true;
    } catch (error) {
      logError(error, 'Deleting category');
      showError('Gagal menghapus kategori', 'Silakan coba lagi');
      return false;
    }
  };

  /**
   * Fetches transactions for a specific recurring rule.
   * @param ruleId The UUID of the recurring transaction rule.
   */
  const getTransactionsByRuleId = async (ruleId: string) => {
    if (!user) {
      console.error("User not found");
      return [];
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('recurring_transaction_id', ruleId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
    return data || [];
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
    getTransactionsByRuleId,
  };
};