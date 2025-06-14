import { useState, useEffect } from 'react';
import { SavingsGoal } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { logError } from '../utils/errorHandler';

export const useSavingsGoals = () => {
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavingsGoals();
    }
  }, [user]);

  const loadSavingsGoals = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logError(error, 'Loading savings goals');
        showError('Gagal memuat tujuan tabungan', 'Silakan refresh halaman');
        return;
      }

      setSavingsGoals(data || []);
    } catch (error) {
      logError(error, 'Loading savings goals');
      showError('Gagal memuat tujuan tabungan', 'Silakan refresh halaman');
    } finally {
      setLoading(false);
    }
  };

  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'current_amount' | 'is_completed'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert([
          {
            ...goal,
            user_id: user.id,
            current_amount: 0,
            is_completed: false,
          },
        ])
        .select()
        .single();

      if (error) {
        logError(error, 'Adding savings goal');
        throw error;
      }

      // Immediate optimistic update
      setSavingsGoals(prev => [data, ...prev]);
      showSuccess('Tujuan tabungan berhasil ditambahkan', `Tujuan ${data.name} telah dibuat`);
    } catch (error) {
      logError(error, 'Adding savings goal');
      throw error;
    }
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logError(error, 'Updating savings goal');
        showError('Gagal mengupdate tujuan tabungan', 'Silakan coba lagi');
        return;
      }

      // Immediate optimistic update
      setSavingsGoals(prev => prev.map(g => g.id === id ? data : g));
      showSuccess('Tujuan tabungan berhasil diupdate', 'Perubahan telah disimpan');
    } catch (error) {
      logError(error, 'Updating savings goal');
      showError('Gagal mengupdate tujuan tabungan', 'Silakan coba lagi');
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);

      if (error) {
        logError(error, 'Deleting savings goal');
        showError('Gagal menghapus tujuan tabungan', 'Silakan coba lagi');
        return;
      }

      // Immediate optimistic update
      setSavingsGoals(prev => prev.filter(g => g.id !== id));
      showSuccess('Tujuan tabungan berhasil dihapus', 'Tujuan telah dihapus');
    } catch (error) {
      logError(error, 'Deleting savings goal');
      showError('Gagal menghapus tujuan tabungan', 'Silakan coba lagi');
    }
  };

  const contributeToGoal = async (goalId: string, amount: number, description: string, accountId?: string) => {
    if (!user) return false;

    try {
      // First, get the current goal data
      const { data: goal, error: goalError } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError || !goal) {
        logError(goalError, 'Fetching goal for contribution');
        showError('Gagal mengambil data tujuan', 'Silakan coba lagi');
        return false;
      }

      // Get or create the "Savings Contribution" category
      let savingsCategory;
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'Kontribusi Tabungan')
        .eq('type', 'expense')
        .single();

      if (existingCategory) {
        savingsCategory = existingCategory;
      } else {
        // Create the savings contribution category
        const { data: newCategory, error: categoryError } = await supabase
          .from('categories')
          .insert([
            {
              name: 'Kontribusi Tabungan',
              color: '#10B981',
              type: 'expense',
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (categoryError) {
          logError(categoryError, 'Creating savings category');
          showError('Gagal membuat kategori tabungan', 'Silakan coba lagi');
          return false;
        }
        savingsCategory = newCategory;
      }

      // Create the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            amount: amount,
            description: description,
            category_id: savingsCategory.id,
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
            user_id: user.id,
            account_id: accountId || null,
          },
        ]);

      if (transactionError) {
        logError(transactionError, 'Creating contribution transaction');
        showError('Gagal membuat transaksi', 'Silakan coba lagi');
        return false;
      }

      // Update the savings goal
      const newCurrentAmount = goal.current_amount + amount;
      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({
          current_amount: newCurrentAmount,
          is_completed: newCurrentAmount >= goal.target_amount,
        })
        .eq('id', goalId);

      if (updateError) {
        logError(updateError, 'Updating savings goal after contribution');
        showError('Gagal mengupdate tujuan tabungan', 'Silakan coba lagi');
        return false;
      }

      // Reload goals to get updated data
      loadSavingsGoals();
      
      showSuccess(
        'Kontribusi berhasil ditambahkan',
        `${description} sebesar ${amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} telah ditambahkan`
      );
      
      return true;
    } catch (error) {
      logError(error, 'Contributing to savings goal');
      showError('Gagal menambahkan kontribusi', 'Silakan coba lagi');
      return false;
    }
  };

  return {
    savingsGoals,
    loading,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    contributeToGoal,
    loadSavingsGoals,
  };
};