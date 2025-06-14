import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Budget, Category } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRupiah } from '../../utils/currency';
import { AppError, errorCodes } from '../../utils/errorHandler';

interface AddBudgetModalProps {
  categories: Category[];
  onClose: () => void;
  onAddBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'category'>) => Promise<void>;
}

const AddBudgetModal: React.FC<AddBudgetModalProps> = ({
  categories,
  onClose,
  onAddBudget,
}) => {
  const { t } = useTheme();
  const { error: showError, success: showSuccess } = useToast();
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'weekly',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category_id) {
      newErrors.category_id = t('budget.selectCategory');
    }

    if (!formData.amount) {
      newErrors.amount = 'Jumlah anggaran diperlukan';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount)) {
        newErrors.amount = 'Jumlah harus berupa angka';
      } else if (amount <= 0) {
        newErrors.amount = 'Jumlah harus lebih besar dari 0';
      } else if (amount > 999999999999) {
        newErrors.amount = 'Jumlah terlalu besar';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Data tidak valid', 'Periksa kembali form Anda');
      return;
    }

    setLoading(true);
    try {
      await onAddBudget({
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        period: formData.period,
      });

      showSuccess('Anggaran berhasil ditambahkan', 'Anggaran baru telah dibuat');
      onClose();
    } catch (error) {
      console.error('Error adding budget:', error);
      showError('Gagal menambahkan anggaran', 'Silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    // Allow empty string and valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData({ ...formData, amount: value });
      // Clear amount error when user starts typing
      if (errors.amount) {
        setErrors(prev => ({ ...prev, amount: '' }));
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const selectedCategory = categories.find(c => c.id === formData.category_id);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('budget.addBudget')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.category')}
            </label>
            <select
              id="category"
              required
              value={formData.category_id}
              onChange={(e) => {
                setFormData({ ...formData, category_id: e.target.value });
                if (errors.category_id) {
                  setErrors(prev => ({ ...prev, category_id: '' }));
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.category_id ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">{t('budget.selectCategory')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.category_id}</p>
            )}
            {categories.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('budget.needCategories')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('budget.budgetAmount')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                Rp
              </span>
              <input
                type="text"
                id="amount"
                required
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                  errors.amount ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="100000"
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.amount}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Masukkan jumlah dalam Rupiah (contoh: 100000 untuk Rp 100.000)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('budget.period')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, period: 'monthly' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.period === 'monthly'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('budget.monthly')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, period: 'weekly' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.period === 'weekly'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('budget.weekly')}
              </button>
            </div>
          </div>

          {selectedCategory && formData.amount && (
            <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: selectedCategory.color + '20' }}
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: selectedCategory.color }}
                />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{selectedCategory.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatRupiah(parseFloat(formData.amount))} {formData.period === 'monthly' ? t('budget.monthly').toLowerCase() : t('budget.weekly').toLowerCase()}
                </p>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={categories.length === 0 || loading}
              className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.creating') : t('budget.addBudget')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBudgetModal;