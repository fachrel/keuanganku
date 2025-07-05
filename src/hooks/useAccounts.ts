import { useState, useEffect } from 'react';
import { Account } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { logError } from '../utils/errorHandler';

export const useAccounts = () => {
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
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
        logError(error, 'Loading accounts');
        showError('Gagal memuat akun', 'Silakan refresh halaman');
        return;
      }

      setAccounts(data || []);
    } catch (error) {
      logError(error, 'Loading accounts');
      showError('Gagal memuat akun', 'Silakan refresh halaman');
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (account: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

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
        logError(error, 'Adding account');
        throw error;
      }

      // Immediate optimistic update
      setAccounts(prev => [...prev, data]);
      
      // Reload to ensure consistency
      setTimeout(() => {
        loadAccounts();
      }, 500);

      return data;
    } catch (error) {
      logError(error, 'Adding account');
      throw error;
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({ ...updates, balance: updates.balance })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logError(error, 'Updating account');
        throw error;
      }

      // Immediate optimistic update
      setAccounts(prev => prev.map(a => a.id === id ? data : a));
      
      // Reload to ensure consistency
      setTimeout(() => {
        loadAccounts();
      }, 500);

      return data;
    } catch (error) {
      logError(error, 'Updating account');
      throw error;
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
        logError(checkError, 'Checking account usage');
        showError('Gagal memeriksa penggunaan akun', 'Silakan coba lagi');
        return false;
      }

      if (transactionsUsingAccount && transactionsUsingAccount.length > 0) {
        showError('Tidak dapat menghapus akun', 'Akun masih digunakan dalam transaksi');
        return false;
      }

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) {
        logError(error, 'Deleting account');
        showError('Gagal menghapus akun', 'Silakan coba lagi');
        return false;
      }

      // Immediate optimistic update
      setAccounts(prev => prev.filter(a => a.id !== id));
      
      // Reload to ensure consistency
      setTimeout(() => {
        loadAccounts();
      }, 500);

      return true;
    } catch (error) {
      logError(error, 'Deleting account');
      showError('Gagal menghapus akun', 'Silakan coba lagi');
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