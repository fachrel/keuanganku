import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RecurringTransaction } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Define the type for the data being added or updated
// We omit fields that are auto-generated or should not be set directly by the user form
type RecurringTransactionInput = Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'last_created_date' | 'accounts' | 'categories'>;

export const useRecurringTransactions = () => {
  const { user } = useAuth();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches all recurring transactions for the logged-in user.
   * It also joins with the accounts and categories tables to get their names for display purposes.
   */
  const loadRecurringTransactions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          accounts (id, name),
          categories (id, name, color)
        `)
        .eq('user_id', user.id)
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      
      // The Supabase join returns nested objects. We can keep them as is.
      setRecurringTransactions(data || []);

    } catch (err: any) {
      console.error("Error loading recurring transactions:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  /**
   * Automatically load transactions when the user session is available.
   */
  useEffect(() => {
    if (user) {
      loadRecurringTransactions();
    }
  }, [user, loadRecurringTransactions]);

  /**
   * Adds a new recurring transaction rule to the database.
   * @param transactionData - The data for the new recurring transaction.
   */
  const addRecurringTransaction = async (transactionData: RecurringTransactionInput) => {
    if (!user) throw new Error("User must be logged in to add a recurring transaction.");

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({ ...transactionData, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;

      // Optimistically add the new transaction to the local state to update the UI instantly
      if (data) {
        // We reload to get the joined data correctly
        await loadRecurringTransactions();
      }
      return data;
    } catch (err: any) {
      console.error("Error adding recurring transaction:", err);
      setError(err);
      throw err; // Re-throw the error to be caught by the UI
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a recurring transaction rule by its ID.
   * @param id - The UUID of the recurring transaction to delete.
   */
  const deleteRecurringTransaction = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state by filtering out the deleted transaction
      setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));

    } catch (err: any) {
      console.error("Error deleting recurring transaction:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // You might need an update function later, here's a template for it.
  /**
   * Updates an existing recurring transaction rule.
   * @param id - The UUID of the recurring transaction to update.
   * @param updates - An object containing the fields to update.
   */
  const updateRecurringTransaction = async (id: string, updates: Partial<RecurringTransactionInput>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // Reload the list to show the updated data
      await loadRecurringTransactions();
      return data;

    } catch(err: any) {
      console.error("Error updating recurring transaction:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    recurringTransactions, 
    loading, 
    error,
    loadRecurringTransactions,
    addRecurringTransaction, 
    deleteRecurringTransaction,
    updateRecurringTransaction
  };
};
