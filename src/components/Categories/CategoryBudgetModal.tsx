import React, { useState } from 'react';
import { X, Target } from 'lucide-react';
import { Category } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';

interface CategoryBudgetModalProps {
  category: Category;
  onClose: () => void;
  onUpdateBudget: (categoryId: string, amount: number) => Promise<boolean>;
}

const CategoryBudgetModal: React.FC<CategoryBudgetModalProps> = ({
  category,
  onClose,
  onUpdateBudget,
}) => {
  const { t } = useTheme();
  const [amount, setAmount] = useState((category.default_budget_amount || 0).toString());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const budgetAmount = parseFloat(amount) || 0;
    
    setLoading(true);
    try {
      const success = await onUpdateBudget(category.id, budgetAmount);
      if (success) {
        onClose();
      } else {
        alert('Gagal mengupdate anggaran default. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Atur Anggaran Default</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: category.color + '20' }}
            >
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: category.color }}
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {category.type === 'income' ? t('categories.income') : t('categories.expense')}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Anggaran Default Bulanan (Rp)
            </label>
            <input
              type="number"
              id="amount"
              step="1000"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="0"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Jumlah ini akan digunakan sebagai template saat membuat anggaran bulanan baru.
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-200">{t('common.preview')} Anggaran</span>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p>Kategori: {category.name}</p>
              <p>Anggaran Bulanan: {formatRupiah(parseFloat(amount) || 0)}</p>
            </div>
          </div>

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
              disabled={loading}
              className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.saving') : 'Simpan Anggaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryBudgetModal;