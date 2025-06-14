import { useState, useEffect } from 'react';
import { Account } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error loading accounts:', error);
        return;
      }

      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (account: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([
          {
            ...account,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding account:', error);
        return;
      }

      setAccounts(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating account:', error);
        return;
      }

      setAccounts(prev => prev.map(a => a.id === id ? data : a));
      return data;
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      // Check if there are any transactions using this account
      const { data: transactionsUsingAccount, error: checkError } = await supabase
        .from('transactions')
        .select('id')
        .eq('account_id', id)
        .limit(1);

      if (checkError) {
        console.error('Error checking account usage:', checkError);
        return false;
      }

      if (transactionsUsingAccount && transactionsUsingAccount.length > 0) {
        alert('Cannot delete account that is still used in transactions. Please remove related transactions first.');
        return false;
      }

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting account:', error);
        return false;
      }

      setAccounts(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  };

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    loadAccounts,
    getTotalBalance,
  };
};