import { useState, useEffect } from 'react';
import { MonthlyBudget, MonthlyBudgetWithDetails, Category, Transaction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useMonthlyBudgets = () => {
  const { user } = useAuth();
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudgetWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user) {
      loadMonthlyBudgets(currentMonth, currentYear);
    }
  }, [user, currentMonth, currentYear]);

  const loadMonthlyBudgets = async (month: number, year: number) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get monthly budgets with category details
      const { data: budgets, error: budgetError } = await supabase
        .from('monthly_budgets')
        .select(`
          *,
          categories (*)
        `)
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .order('categories(name)');

      if (budgetError) {
        console.error('Error loading monthly budgets:', budgetError);
        return;
      }

      // Get transactions for the same month/year to calculate actual spending
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate);

      if (transactionError) {
        console.error('Error loading transactions:', transactionError);
        return;
      }

      // Calculate spending by category
      const spendingByCategory = new Map<string, number>();
      transactions?.forEach(transaction => {
        const current = spendingByCategory.get(transaction.category_id) || 0;
        spendingByCategory.set(transaction.category_id, current + transaction.amount);
      });

      // Combine budget data with actual spending
      const budgetsWithDetails: MonthlyBudgetWithDetails[] = (budgets || []).map(budget => {
        const actualSpent = spendingByCategory.get(budget.category_id) || 0;
        const remaining = budget.planned_amount - actualSpent;
        const progressPercentage = budget.planned_amount > 0 ? (actualSpent / budget.planned_amount) * 100 : 0;
        
        let status: 'good' | 'warning' | 'danger' = 'good';
        if (progressPercentage > 100) status = 'danger';
        else if (progressPercentage > 85) status = 'warning';

        return {
          ...budget,
          category: budget.categories,
          actual_spent: actualSpent,
          remaining,
          progress_percentage: Math.min(progressPercentage, 100),
          status,
        };
      });

      setMonthlyBudgets(budgetsWithDetails);
    } catch (error) {
      console.error('Error loading monthly budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBudgetExists = async (month: number, year: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('monthly_budgets')
        .select('id')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .limit(1);

      if (error) {
        console.error('Error checking budget existence:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking budget existence:', error);
      return false;
    }
  };

  const createBudgetFromTemplate = async (month: number, year: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('create_monthly_budget_from_templates', {
        p_user_id: user.id,
        p_month: month,
        p_year: year,
      });

      if (error) {
        console.error('Error creating budget from template:', error);
        return false;
      }

      // Reload budgets after creation
      await loadMonthlyBudgets(month, year);
      return true;
    } catch (error) {
      console.error('Error creating budget from template:', error);
      return false;
    }
  };

  const updateBudgetAmount = async (budgetId: string, newAmount: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('monthly_budgets')
        .update({ planned_amount: newAmount })
        .eq('id', budgetId);

      if (error) {
        console.error('Error updating budget amount:', error);
        return false;
      }

      // Reload budgets after update
      await loadMonthlyBudgets(currentMonth, currentYear);
      return true;
    } catch (error) {
      console.error('Error updating budget amount:', error);
      return false;
    }
  };

  const deleteBudgetItem = async (budgetId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('monthly_budgets')
        .delete()
        .eq('id', budgetId);

      if (error) {
        console.error('Error deleting budget item:', error);
        return false;
      }

      // Reload budgets after deletion
      await loadMonthlyBudgets(currentMonth, currentYear);
      return true;
    } catch (error) {
      console.error('Error deleting budget item:', error);
      return false;
    }
  };

  const navigateToMonth = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  const getMonthName = (month: number): string => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return monthNames[month - 1];
  };

  return {
    monthlyBudgets,
    loading,
    currentMonth,
    currentYear,
    loadMonthlyBudgets,
    checkBudgetExists,
    createBudgetFromTemplate,
    updateBudgetAmount,
    deleteBudgetItem,
    navigateToMonth,
    getMonthName,
  };
};