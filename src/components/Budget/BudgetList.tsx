import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Target, TrendingUp, AlertTriangle, RefreshCw, Calendar, ChevronRight } from 'lucide-react';
import { useBudgets } from '../../hooks/useBudgets';
import { useTransactions } from '../../hooks/useTransactions';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';
import { useModal } from '../Layout/ModalProvider';

const BudgetList: React.FC = () => {
  const { budgets, addBudget, deleteBudget, checkAndResetBudgets, getCurrentPeriodDates, loadBudgets } = useBudgets();
  const { transactions, categories } = useTransactions();
  const { t } = useTheme();
  const { openModal } = useModal();
  const [isResetting, setIsResetting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null);

  // Check for budget resets on component mount and periodically
  useEffect(() => {
    checkAndResetBudgets();
    
    // Check every hour for period changes
    const interval = setInterval(checkAndResetBudgets, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndResetBudgets]);

  const budgetProgress = useMemo(() => {
    return budgets.map(budget => {
      const category = categories.find(c => c.id === budget.category_id);
      const { start, end } = getCurrentPeriodDates(budget.period);
      
      const spent = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.category_id === budget.category_id && 
                 t.type === 'expense' &&
                 t.type !== 'transfer' &&
                 transactionDate >= start &&
                 transactionDate <= end;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const remaining = budget.amount - spent;
      
      return {
        ...budget,
        category,
        spent,
        remaining,
        percentage: Math.min(percentage, 100),
        isOverBudget: spent > budget.amount,
        status: percentage > 90 ? 'danger' : percentage > 75 ? 'warning' : 'good',
        periodStart: start,
        periodEnd: end,
      };
    });
  }, [budgets, categories, transactions, getCurrentPeriodDates]);

  const handleDeleteBudget = (id: string) => {
    if (window.confirm(t('budget.deleteConfirm'))) {
      deleteBudget(id);
    }
  };

  const handleManualReset = async () => {
    setIsResetting(true);
    await checkAndResetBudgets();
    setIsResetting(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadBudgets();
    } catch (error) {
      console.error('Error refreshing budgets:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddBudget = () => {
    openModal('addBudget', {
      categories: categories.filter(c => c.type === 'expense'),
      onAddBudget: addBudget
    });
  };

  const toggleExpandBudget = (budgetId: string) => {
    setExpandedBudget(prev => prev === budgetId ? null : budgetId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'danger': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
    }
  };

  const getProgressColor = (status: string, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-500';
    switch (status) {
      case 'danger': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const formatPeriodDates = (start: Date, end: Date, period: 'monthly' | 'weekly') => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short',
      year: period === 'monthly' ? 'numeric' : undefined
    };
    
    if (period === 'monthly') {
      return start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } else {
      return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', options)}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('budget.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('budget.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleManualReset}
            disabled={isResetting}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            title={t('budget.checkReset')}
          >
            <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Periode</span>
            <span className="sm:hidden">Reset</span>
          </button>
          <button
            onClick={handleAddBudget}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('budget.addBudget')}</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Budget Overview */}
      {budgetProgress.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('budget.totalBudgets')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{budgets.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('budget.onTrack')}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {budgetProgress.filter(b => b.status === 'good').length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('budget.overBudget')}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {budgetProgress.filter(b => b.isOverBudget).length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Reset Info */}
      {budgetProgress.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">{t('budget.autoReset')}</p>
              <p>{t('budget.autoResetDesc')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Budget List */}
      {budgetProgress.length > 0 ? (
        <div className="space-y-4">
          {budgetProgress.map((budget) => (
            <div 
              key={budget.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Budget Header - Always visible */}
              <div 
                className="p-4 sm:p-6 cursor-pointer"
                onClick={() => toggleExpandBudget(budget.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: budget.category?.color + '20' }}
                    >
                      <div
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                        style={{ backgroundColor: budget.category?.color }}
                      />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                        {budget.category?.name || 'Kategori Tidak Dikenal'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {budget.period === 'monthly' ? t('budget.monthly') : t('budget.weekly')}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 hidden sm:inline">•</span>
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
                          {formatPeriodDates(budget.periodStart, budget.periodEnd, budget.period)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}
                        >
                          {budget.isOverBudget ? t('budget.overBudget') : 
                           budget.status === 'warning' ? 'Peringatan' : t('budget.onTrack')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-2">
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {formatRupiah(budget.spent)} / {formatRupiah(budget.amount)}
                      </div>
                      <div className={`text-xs sm:text-sm font-medium ${
                        budget.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {budget.remaining >= 0 
                          ? `${formatRupiah(budget.remaining)} ${t('budget.remaining')}`
                          : `${formatRupiah(Math.abs(budget.remaining))} ${t('budget.exceeds')}`
                        }
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedBudget === budget.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Progress Bar - Always visible */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{t('budget.progress')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{budget.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor(budget.status, budget.isOverBudget)}`}
                      style={{ width: `${budget.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedBudget === budget.id && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Period</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatPeriodDates(budget.periodStart, budget.periodEnd, budget.period)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Average</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatRupiah(budget.spent / Math.max(1, Math.floor((new Date().getTime() - budget.periodStart.getTime()) / (1000 * 60 * 60 * 24))))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBudget(budget.id);
                      }}
                      className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <Target className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('budget.noBudgets')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('budget.noBudgetsDesc')}</p>
          <button
            onClick={handleAddBudget}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>{t('budget.createFirst')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetList;