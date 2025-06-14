import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Tag, CreditCard } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  icon: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
  const { addTransaction } = useTransactions();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    account_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchAccounts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error fetching accounts:', error);
    } else {
      setAccounts(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addTransaction({
        amount: parseFloat(formData.amount),
        description: formData.description,
        category_id: formData.category_id,
        type: formData.type,
        date: formData.date,
        user_id: user.id,
        account_id: formData.account_id || null
      });

      // Reset form
      setFormData({
        amount: '',
        description: '',
        category_id: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        account_id: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type,
      category_id: '' // Reset category when type changes
    }));
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Transaction Type
            </label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  formData.type === 'expense'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">Expense</div>
                  <div className="text-sm opacity-75">Money out</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  formData.type === 'income'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">Income</div>
                  <div className="text-sm opacity-75">Money in</div>
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter transaction description"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <select
                id="category"
                required
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a category</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account */}
          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account (Optional)
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <select
                id="account"
                value={formData.account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">No account selected</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (${account.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="date"
                id="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-3 rounded-lg text-white font-medium transition-colors ${
                formData.type === 'expense'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Adding...' : `Add ${formData.type === 'expense' ? 'Expense' : 'Income'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}