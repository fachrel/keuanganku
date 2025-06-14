import React, { useState } from 'react';
import { Plus, Tag, Trash2, AlertTriangle, Target, RefreshCw } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';
import { supabase } from '../../lib/supabase';
import { useModal } from '../Layout/ModalProvider';

const CategoryList: React.FC = () => {
  const { categories, addCategory, deleteCategory, loadCategories } = useTransactions();
  const { t } = useTheme();
  const { openModal } = useModal();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredCategories = categories.filter(category => 
    filterType === 'all' || category.type === filterType
  );

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`${t('categories.deleteConfirm')} "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      setDeletingCategory(id);
      await deleteCategory(id);
      setDeletingCategory(null);
    }
  };

  const handleSetBudget = (category: any) => {
    openModal('categoryBudget', {
      category,
      onUpdateBudget: handleUpdateBudget
    });
  };

  const handleUpdateBudget = async (categoryId: string, amount: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ default_budget_amount: amount })
        .eq('id', categoryId);

      if (error) {
        console.error('Error updating category budget:', error);
        return false;
      }

      // Reload categories to get updated data
      loadCategories();
      return true;
    } catch (error) {
      console.error('Error updating category budget:', error);
      return false;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadCategories();
    } catch (error) {
      console.error('Error refreshing categories:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddCategory = () => {
    openModal('addCategory', { onAddCategory: addCategory });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('categories.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('categories.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleAddCategory}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('categories.addCategory')}</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('categories.allCategories')} ({categories.length})
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              filterType === 'income'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('categories.income')} ({incomeCategories.length})
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              filterType === 'expense'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('categories.expense')} ({expenseCategories.length})
          </button>
        </div>
      </div>

      {/* Budget Template Info */}
      {expenseCategories.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">{t('categories.budgetTemplate')}</p>
              <p>{t('categories.budgetTemplateDesc')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate">{category.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.type === 'income'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                        }`}
                      >
                        {category.type === 'income' ? t('categories.income') : t('categories.expense')}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                  disabled={deletingCategory === category.id}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('common.delete')}
                >
                  {deletingCategory === category.id ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Budget Template Section for Expense Categories */}
              {category.type === 'expense' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('categories.defaultBudget')}</span>
                    <button
                      onClick={() => handleSetBudget(category)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      {category.default_budget_amount ? t('categories.editBudget') : t('categories.setBudget')}
                    </button>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.default_budget_amount 
                      ? formatRupiah(category.default_budget_amount)
                      : t('categories.notSet')
                    }
                  </div>
                  {category.default_budget_amount && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('categories.perMonth')}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <Tag className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('categories.noCategories')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filterType === 'all'
              ? t('categories.noCategoriesDesc')
              : `Anda belum membuat kategori ${filterType === 'income' ? t('categories.income').toLowerCase() : t('categories.expense').toLowerCase()}.`}
          </p>
          <button
            onClick={handleAddCategory}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>{t('categories.addFirstCategory')}</span>
          </button>
        </div>
      )}

      {/* Warning message */}
      {categories.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Catatan Penting:</p>
              <p>{t('categories.cannotDelete')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;