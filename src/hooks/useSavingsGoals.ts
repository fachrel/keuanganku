import { useState, useEffect } from 'react';
import { SavingsGoal } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useSavingsGoals = () => {
  const { user } = useAuth();
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
        console.error('Error loading savings goals:', error);
        return;
      }

      setSavingsGoals(data || []);
    } catch (error) {
      console.error('Error loading savings goals:', error);
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
        console.error('Error adding savings goal:', error);
        return;
      }

      setSavingsGoals(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding savings goal:', error);
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
        console.error('Error updating savings goal:', error);
        return;
      }

      setSavingsGoals(prev => prev.map(g => g.id === id ? data : g));
    } catch (error) {
      console.error('Error updating savings goal:', error);
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting savings goal:', error);
        return;
      }

      setSavingsGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting savings goal:', error);
    }
  };

  const contributeToGoal = async (goalId: string, amount: number, description: string) => {
    if (!user) return false;

    try {
      // First, get the current goal data
      const { data: goal, error: goalError } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError || !goal) {
        console.error('Error fetching goal:', goalError);
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
          console.error('Error creating savings category:', categoryError);
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
          },
        ]);

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
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
        console.error('Error updating savings goal:', updateError);
        return false;
      }

      // Reload goals to get updated data
      loadSavingsGoals();
      return true;
    } catch (error) {
      console.error('Error contributing to goal:', error);
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