import { useState, useEffect } from 'react';
import { Budget } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useBudgets = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadBudgets();
    }
  }, [user]);

  const loadBudgets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading budgets:', error);
        return;
      }

      setBudgets(data || []);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([
          {
            ...budget,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding budget:', error);
        return;
      }

      setBudgets(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating budget:', error);
        return;
      }

      setBudgets(prev => prev.map(b => b.id === id ? data : b));
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting budget:', error);
        return;
      }

      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  // Helper function to get current period dates
  const getCurrentPeriodDates = (period: 'monthly' | 'weekly') => {
    const now = new Date();
    
    if (period === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: startOfMonth, end: endOfMonth };
    } else {
      // Weekly: Monday to Sunday
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as last day of week
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + mondayOffset);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return { start: startOfWeek, end: endOfWeek };
    }
  };

  // Function to check if we're in a new period and reset if needed
  const checkAndResetBudgets = async () => {
    if (!user) return;

    try {
      // Get all budgets with their last reset dates
      const { data: budgetsData, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (error || !budgetsData) return;

      const now = new Date();
      const budgetsToUpdate: any[] = [];

      budgetsData.forEach(budget => {
        const lastReset = budget.last_reset ? new Date(budget.last_reset) : new Date(budget.created_at);
        const { start: currentPeriodStart } = getCurrentPeriodDates(budget.period);
        
        // Check if we're in a new period
        if (lastReset < currentPeriodStart) {
          budgetsToUpdate.push({
            id: budget.id,
            last_reset: now.toISOString(),
          });
        }
      });

      // Update budgets that need reset
      if (budgetsToUpdate.length > 0) {
        const updatePromises = budgetsToUpdate.map(update =>
          supabase
            .from('budgets')
            .update({ last_reset: update.last_reset })
            .eq('id', update.id)
        );

        await Promise.all(updatePromises);
        
        // Reload budgets to get updated data
        loadBudgets();
      }
    } catch (error) {
      console.error('Error checking/resetting budgets:', error);
    }
  };

  // Function to get spending for current period
  const getCurrentPeriodSpending = async (categoryId: string, period: 'monthly' | 'weekly') => {
    if (!user) return 0;

    const { start, end } = getCurrentPeriodDates(period);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .eq('type', 'expense')
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]);

      if (error) {
        console.error('Error getting period spending:', error);
        return 0;
      }

      return data?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
    } catch (error) {
      console.error('Error getting period spending:', error);
      return 0;
    }
  };

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    loadBudgets,
    checkAndResetBudgets,
    getCurrentPeriodSpending,
    getCurrentPeriodDates,
  };
};