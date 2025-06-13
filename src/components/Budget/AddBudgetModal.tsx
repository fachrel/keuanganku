import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Budget, Category } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';

interface AddBudgetModalProps {
  categories: Category[];
  onClose: () => void;
  onAddBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => void;
}

const AddBudgetModal: React.FC<AddBudgetModalProps> = ({
  categories,
  onClose,
  onAddBudget,
}) => {
  const { t } = useTheme();
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'weekly',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.amount) {
      return;
    }

    onAddBudget({
      category_id: formData.category_id,
      amount: parseFloat(formData.amount),
      period: formData.period,
    });

    onClose();
  };

  const selectedCategory = categories.find(c => c.id === formData.category_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('budget.selectCategory')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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
            <input
              type="number"
              id="amount"
              step="1000"
              min="0"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="0"
            />
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

          {selectedCategory && (
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
                  {formData.amount ? formatRupiah(parseFloat(formData.amount)) : 'Rp 0'} {formData.period === 'monthly' ? t('budget.monthly').toLowerCase() : t('budget.weekly').toLowerCase()}
                </p>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={categories.length === 0}
              className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('budget.addBudget')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBudgetModal;