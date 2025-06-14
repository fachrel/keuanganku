import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Tag, CreditCard, AlertTriangle } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/currency';

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
  const { addTransaction, loadTransactions } = useTransactions();
  const { user } = useAuth();
  const { error: showError, success: showSuccess, warning: showWarning } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      showError('Gagal memuat kategori', 'Silakan refresh halaman');
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
      showError('Gagal memuat akun', 'Silakan refresh halaman');
    } else {
      setAccounts(data || []);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount) {
      newErrors.amount = 'Jumlah diperlukan';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Jumlah harus lebih besar dari 0';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi diperlukan';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Kategori harus dipilih';
    }

    if (!formData.date) {
      newErrors.date = 'Tanggal diperlukan';
    }

    // Check account balance for expenses
    if (formData.type === 'expense' && formData.account_id) {
      const selectedAccount = accounts.find(a => a.id === formData.account_id);
      const amount = parseFloat(formData.amount);
      if (selectedAccount && amount > selectedAccount.balance) {
        newErrors.account_id = `Saldo tidak mencukupi. Saldo tersedia: ${formatRupiah(selectedAccount.balance)}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateForm()) {
      showError('Data tidak valid', 'Periksa kembali form Anda');
      return;
    }

    // Additional balance check for expenses
    if (formData.type === 'expense' && formData.account_id) {
      const selectedAccount = accounts.find(a => a.id === formData.account_id);
      const amount = parseFloat(formData.amount);
      if (selectedAccount && amount > selectedAccount.balance) {
        showWarning(
          'Saldo tidak mencukupi',
          `Saldo akun ${selectedAccount.name}: ${formatRupiah(selectedAccount.balance)}. Diperlukan: ${formatRupiah(amount)}`
        );
        return;
      }
    }

    setLoading(true);
    try {
      await addTransaction({
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
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
      setErrors({});
      
      // Refresh transaction list
      await loadTransactions();
      
      showSuccess('Transaksi berhasil ditambahkan', 'Data telah disimpan');
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      showError('Gagal menambahkan transaksi', 'Silakan coba lagi');
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
    // Clear category error when type changes
    if (errors.category_id) {
      setErrors(prev => ({ ...prev, category_id: '' }));
    }
  };

  const handleAmountChange = (value: string) => {
    // Allow empty string and valid numbers with decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, amount: value }));
      // Clear amount error when user starts typing
      if (errors.amount) {
        setErrors(prev => ({ ...prev, amount: '' }));
      }
      // Clear account error when amount changes (for balance validation)
      if (errors.account_id && errors.account_id.includes('Saldo tidak mencukupi')) {
        setErrors(prev => ({ ...prev, account_id: '' }));
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type);
  const selectedAccount = accounts.find(a => a.id === formData.account_id);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-container"
      onClick={handleBackdropClick}
    >
      <div className="modal-content max-w-md w-full">
        <div className="modal-header">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tambah Transaksi</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="modal-body">
          <form className="space-y-6">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Jenis Transaksi
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
                    <div className="text-lg font-semibold">Pengeluaran</div>
                    <div className="text-sm opacity-75">Uang keluar</div>
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
                    <div className="text-lg font-semibold">Pemasukan</div>
                    <div className="text-sm opacity-75">Uang masuk</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Jumlah
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  id="amount"
                  required
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.amount ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="100000"
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deskripsi
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                    if (errors.description) {
                      setErrors(prev => ({ ...prev, description: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.description ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Masukkan deskripsi transaksi"
                />
              </div>
              {errors.description && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <select
                  id="category"
                  required
                  value={formData.category_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, category_id: e.target.value }));
                    if (errors.category_id) {
                      setErrors(prev => ({ ...prev, category_id: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.category_id ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Pilih kategori</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.category_id && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.category_id}</p>
              )}
            </div>

            {/* Account */}
            <div>
              <label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Akun (Opsional)
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <select
                  id="account"
                  value={formData.account_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, account_id: e.target.value }));
                    if (errors.account_id) {
                      setErrors(prev => ({ ...prev, account_id: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.account_id ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Tidak ada akun dipilih</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatRupiah(account.balance)})
                    </option>
                  ))}
                </select>
              </div>
              {errors.account_id && (
                <div className="flex items-start space-x-2 mt-1">
                  <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 dark:text-red-400 text-sm">{errors.account_id}</p>
                </div>
              )}
              {selectedAccount && formData.type === 'expense' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Saldo tersedia: {formatRupiah(selectedAccount.balance)}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tanggal
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="date"
                  id="date"
                  required
                  value={formData.date}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, date: e.target.value }));
                    if (errors.date) {
                      setErrors(prev => ({ ...prev, date: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.date ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
              {errors.date && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.date}</p>
              )}
            </div>
          </form>
        </div>

        {/* Submit Button */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              formData.type === 'expense'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Menambahkan...' : `Tambah ${formData.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}`}
          </button>
        </div>
      </div>
    </div>
  );
}