import React, { useMemo, useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  CreditCard,
  Calendar,
  PiggyBank,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Percent,
  BarChart3,
  RefreshCw,
  Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';
import { useTransactions } from '../../hooks/useTransactions';
import { useBudgets } from '../../hooks/useBudgets';
import { useSavingsGoals } from '../../hooks/useSavingsGoals';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';

const Dashboard: React.FC = () => {
  const { transactions, categories } = useTransactions();
  const { budgets } = useBudgets();
  const { savingsGoals } = useSavingsGoals();
  const { accounts, getTotalBalance, loadAccounts } = useAccounts();
  const { t, theme } = useTheme();
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadAccounts();
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = new Date(currentYear, currentMonth - 1);
    
    // Filter out transfer transactions
    const nonTransferTransactions = transactions.filter(t => t.type !== 'transfer');
    
    const currentMonthTransactions = nonTransferTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const lastMonthTransactions = nonTransferTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === lastMonth.getMonth() && 
             transactionDate.getFullYear() === lastMonth.getFullYear();
    });

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = currentIncome - currentExpenses;
    const cashFlow = balance;
    const lastCashFlow = lastIncome - lastExpenses;
    const cashFlowChange = lastCashFlow !== 0 ? ((cashFlow - lastCashFlow) / Math.abs(lastCashFlow)) * 100 : 0;

    // Calculate savings rate
    const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0;

    // Get total balance from accounts
    const totalBalance = getTotalBalance();

    return {
      totalIncome: currentIncome,
      totalExpenses: currentExpenses,
      balance,
      cashFlow,
      cashFlowChange,
      transactionCount: currentMonthTransactions.length,
      incomeChange: lastIncome !== 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0,
      expenseChange: lastExpenses !== 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0,
      savingsRate,
      totalBalance,
    };
  }, [transactions, getTotalBalance]);

  // Enhanced chart data
  const expensesByCategory = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const categoryTotals = new Map<string, { amount: number; category: any }>();
    
    transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' && 
               t.type !== 'transfer' &&
               transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      })
      .forEach(transaction => {
        const category = categories.find(c => c.id === transaction.category_id);
        const categoryId = transaction.category_id;
        
        if (categoryTotals.has(categoryId)) {
          const existing = categoryTotals.get(categoryId)!;
          categoryTotals.set(categoryId, {
            ...existing,
            amount: existing.amount + transaction.amount,
          });
        } else {
          categoryTotals.set(categoryId, {
            amount: transaction.amount,
            category,
          });
        }
      });

    return Array.from(categoryTotals.entries())
      .map(([categoryId, data]) => ({
        name: data.category?.name || 'Unknown',
        value: data.amount,
        color: data.category?.color || '#6B7280',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions, categories]);

  // Monthly trend data for the last 6 months
  const monthlyTrendData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    // Filter out transfer transactions
    const nonTransferTransactions = transactions.filter(t => t.type !== 'transfer');
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTransactions = nonTransferTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        month: date.toLocaleDateString('id-ID', { month: 'short' }),
        income,
        expenses,
        net: income - expenses,
      });
    }
    
    return months;
  }, [transactions]);

  const budgetProgress = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return budgets.slice(0, 3).map(budget => {
      const category = categories.find(c => c.id === budget.category_id);
      const spent = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.category_id === budget.category_id && 
                 t.type === 'expense' &&
                 t.type !== 'transfer' &&
                 transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      return {
        ...budget,
        category,
        spent,
        percentage: Math.min(percentage, 100),
        isOverBudget: spent > budget.amount,
        status: percentage > 90 ? 'danger' : percentage > 75 ? 'warning' : 'good',
      };
    });
  }, [budgets, categories, transactions]);

  const savingsProgress = useMemo(() => {
    const totalTargetAmount = savingsGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalCurrentAmount = savingsGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const completedGoals = savingsGoals.filter(goal => goal.is_completed).length;
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    return {
      totalGoals: savingsGoals.length,
      completedGoals,
      totalTargetAmount,
      totalCurrentAmount,
      overallProgress,
      activeGoals: savingsGoals.filter(goal => !goal.is_completed).slice(0, 3),
    };
  }, [savingsGoals]);

  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(transaction => ({
        ...transaction,
        category: categories.find(c => c.id === transaction.category_id),
      }));
  }, [transactions, categories]);

  // Budget utilization
  const budgetUtilization = useMemo(() => {
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgetProgress.reduce((sum, budget) => sum + budget.spent, 0);
    return totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  }, [budgets, budgetProgress]);

  const chartColors = {
    primary: theme === 'dark' ? '#60A5FA' : '#3B82F6',
    secondary: theme === 'dark' ? '#A78BFA' : '#8B5CF6',
    success: theme === 'dark' ? '#34D399' : '#10B981',
    danger: theme === 'dark' ? '#F87171' : '#EF4444',
    warning: theme === 'dark' ? '#FBBF24' : '#F59E0B',
    text: theme === 'dark' ? '#F3F4F6' : '#374151',
    grid: theme === 'dark' ? '#374151' : '#E5E7EB',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last sync: {lastSyncTime.toLocaleTimeString('id-ID')}</span>
          </div>
          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance from Accounts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Balance</p>
              <p className={`text-lg sm:text-2xl font-bold ${stats.totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatRupiah(stats.totalBalance)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
              stats.totalBalance >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
            }`}>
              <DollarSign className={`w-5 h-5 sm:w-6 sm:h-6 ${stats.totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.monthlyIncome')}</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{formatRupiah(stats.totalIncome)}</p>
              <div className="flex items-center mt-1 sm:mt-2">
                {stats.incomeChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                )}
                <span className={`text-xs sm:text-sm ml-1 ${stats.incomeChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {Math.abs(stats.incomeChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.monthlyExpenses')}</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{formatRupiah(stats.totalExpenses)}</p>
              <div className="flex items-center mt-1 sm:mt-2">
                {stats.expenseChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                )}
                <span className={`text-xs sm:text-sm ml-1 ${stats.expenseChange >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {Math.abs(stats.expenseChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Savings Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.savingsProgress')}</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{savingsProgress.overallProgress.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {savingsProgress.completedGoals} / {savingsProgress.totalGoals} {t('dashboard.goalsCompleted')}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.savingsRate')}</p>
              <p className={`text-lg sm:text-2xl font-bold ${stats.savingsRate >= 20 ? 'text-green-600 dark:text-green-400' : stats.savingsRate >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.savingsRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.savingsRate >= 20 ? 'Excellent' : stats.savingsRate >= 10 ? 'Good' : 'Needs Improvement'}
              </p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
              stats.savingsRate >= 20 ? 'bg-green-100 dark:bg-green-900/20' : 
              stats.savingsRate >= 10 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20'
            }`}>
              <Percent className={`w-5 h-5 sm:w-6 sm:h-6 ${
                stats.savingsRate >= 20 ? 'text-green-600 dark:text-green-400' : 
                stats.savingsRate >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.budgetUtilization')}</p>
              <p className={`text-lg sm:text-2xl font-bold ${budgetUtilization <= 80 ? 'text-green-600 dark:text-green-400' : budgetUtilization <= 95 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                {budgetUtilization.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {budgetUtilization <= 80 ? 'On Track' : budgetUtilization <= 95 ? 'Close to Limit' : 'Over Budget'}
              </p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
              budgetUtilization <= 80 ? 'bg-green-100 dark:bg-green-900/20' : 
              budgetUtilization <= 95 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20'
            }`}>
              <Target className={`w-5 h-5 sm:w-6 sm:h-6 ${
                budgetUtilization <= 80 ? 'text-green-600 dark:text-green-400' : 
                budgetUtilization <= 95 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.financialHealth')}</p>
              <p className={`text-lg sm:text-2xl font-bold ${
                stats.savingsRate >= 15 && budgetUtilization <= 85 ? 'text-green-600 dark:text-green-400' : 
                stats.savingsRate >= 5 && budgetUtilization <= 95 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {stats.savingsRate >= 15 && budgetUtilization <= 85 ? 'Excellent' : 
                 stats.savingsRate >= 5 && budgetUtilization <= 95 ? 'Good' : 'Poor'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Overall Score</p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
              stats.savingsRate >= 15 && budgetUtilization <= 85 ? 'bg-green-100 dark:bg-green-900/20' : 
              stats.savingsRate >= 5 && budgetUtilization <= 95 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20'
            }`}>
              <Activity className={`w-5 h-5 sm:w-6 sm:h-6 ${
                stats.savingsRate >= 15 && budgetUtilization <= 85 ? 'text-green-600 dark:text-green-400' : 
                stats.savingsRate >= 5 && budgetUtilization <= 95 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Budget Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.budgetStatus')}</h2>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          {budgetProgress.length > 0 ? (
            <div className="space-y-4">
              {budgetProgress.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 max-w-[60%]">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: budget.category?.color }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {budget.category?.name || 'Unknown Category'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {budget.isOverBudget ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : budget.status === 'good' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className={`font-medium ${
                        budget.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {budget.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        budget.isOverBudget ? 'bg-red-500' : 
                        budget.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatRupiah(budget.spent)}</span>
                    <span>{formatRupiah(budget.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('dashboard.noBudgets')}</p>
          )}
        </div>

        {/* Savings Goals */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.savingsGoals')}</h2>
            <PiggyBank className="w-5 h-5 text-gray-400" />
          </div>
          {savingsProgress.activeGoals.length > 0 ? (
            <div className="space-y-4">
              {savingsProgress.activeGoals.map((goal) => {
                const progress = (goal.current_amount / goal.target_amount) * 100;
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 max-w-[60%]">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: goal.color }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white truncate">{goal.name}</span>
                      </div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: goal.color 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatRupiah(goal.current_amount)}</span>
                      <span>{formatRupiah(goal.target_amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('dashboard.noSavingsGoals')}</p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recentTransactions')}</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: transaction.category?.color + '20' }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: transaction.category?.color }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">{transaction.category?.name}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 
                      transaction.type === 'expense' ? 'text-red-600 dark:text-red-400' :
                      'text-blue-600 dark:text-blue-400' // For transfer type
                    }`}>
                      {transaction.type === 'income' ? '+' : 
                       transaction.type === 'expense' ? '-' : 
                       '↔'}{formatRupiah(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.date).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('dashboard.noTransactions')}</p>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Expenses by Category Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.expensesByCategory')}</h3>
          {expensesByCategory.length > 0 ? (
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatRupiah(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 sm:h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No expense data available
            </div>
          )}
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.monthlyTrend')}</h3>
          {monthlyTrendData.length > 0 ? (
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="month" stroke={chartColors.text} />
                  <YAxis tickFormatter={(value) => formatRupiah(value)} stroke={chartColors.text} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatRupiah(value), name === 'income' ? t('dashboard.income') : name === 'expenses' ? t('dashboard.expenses') : 'Net']}
                    labelStyle={{ color: chartColors.text }}
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1"
                    stroke={chartColors.success} 
                    fill={chartColors.success}
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="2"
                    stroke={chartColors.danger} 
                    fill={chartColors.danger}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 sm:h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* Income vs Expenses Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.incomeVsExpenses')}</h3>
        {monthlyTrendData.length > 0 ? (
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="month" stroke={chartColors.text} />
                <YAxis tickFormatter={(value) => formatRupiah(value)} stroke={chartColors.text} />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatRupiah(value), name === 'income' ? t('dashboard.income') : t('dashboard.expenses')]}
                  labelStyle={{ color: chartColors.text }}
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="income" fill={chartColors.success} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill={chartColors.danger} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 sm:h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No comparison data available
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;