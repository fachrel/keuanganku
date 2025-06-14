import React, { useState, useMemo } from 'react';
import { Calendar, PieChart, BarChart3, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTransactions } from '../../hooks/useTransactions';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';

const Reports: React.FC = () => {
  const { transactions, categories, loadTransactions } = useTransactions();
  const { t, theme } = useTheme();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportType, setReportType] = useState<'expense' | 'income'>('expense');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      return transactionDate >= startDate && 
             transactionDate <= endDate && 
             transaction.type === reportType;
    });
  }, [transactions, dateRange, reportType]);

  const categoryData = useMemo(() => {
    const categoryTotals = new Map<string, { amount: number; category: any; count: number }>();
    
    filteredTransactions.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.category_id);
      const categoryId = transaction.category_id;
      
      if (categoryTotals.has(categoryId)) {
        const existing = categoryTotals.get(categoryId)!;
        categoryTotals.set(categoryId, {
          ...existing,
          amount: existing.amount + transaction.amount,
          count: existing.count + 1,
        });
      } else {
        categoryTotals.set(categoryId, {
          amount: transaction.amount,
          category,
          count: 1,
        });
      }
    });

    return Array.from(categoryTotals.entries())
      .map(([categoryId, data]) => ({
        id: categoryId,
        name: data.category?.name || t('reports.unknownCategory'),
        amount: data.amount,
        count: data.count,
        color: data.category?.color || '#6B7280',
        percentage: 0, // Will be calculated below
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories, t]);

  const totalAmount = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + item.amount, 0);
  }, [categoryData]);

  const pieChartData = useMemo(() => {
    return categoryData.map(item => ({
      ...item,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    }));
  }, [categoryData, totalAmount]);

  const monthlyData = useMemo(() => {
    const monthlyTotals = new Map<string, number>();
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + transaction.amount);
    });

    return Array.from(monthlyTotals.entries())
      .map(([month, amount]) => ({
        month,
        amount,
        formattedMonth: new Date(month + '-01').toLocaleDateString('id-ID', { 
          month: 'short', 
          year: 'numeric' 
        }),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  const exportData = () => {
    const exportData = {
      dateRange,
      reportType,
      summary: {
        totalAmount,
        transactionCount: filteredTransactions.length,
        categoryCount: categoryData.length,
      },
      categoryBreakdown: categoryData,
      monthlyTrend: monthlyData,
      transactions: filteredTransactions.map(t => ({
        ...t,
        categoryName: categories.find(c => c.id === t.category_id)?.name || t('reports.unknownCategory'),
      })),
      generatedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-${reportType}-${dateRange.startDate}-${dateRange.endDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadTransactions();
    } catch (error) {
      console.error('Error refreshing reports:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const chartColors = {
    text: theme === 'dark' ? '#F3F4F6' : '#374151',
    grid: theme === 'dark' ? '#374151' : '#E5E7EB',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            <span>{t('reports.exportData')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('reports.startDate')}
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('reports.endDate')}
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('reports.reportType')}
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'expense' | 'income')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="expense">{t('common.expense')}</option>
              <option value="income">{t('common.income')}</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 w-full">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {filteredTransactions.length} {t('reports.transactions')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total: {formatRupiah(totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {reportType === 'expense' ? t('reports.totalExpenses') : t('reports.totalIncome')}
              </p>
              <p className={`text-2xl font-bold ${reportType === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {formatRupiah(totalAmount)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              reportType === 'expense' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'
            }`}>
              <TrendingUp className={`w-6 h-6 ${reportType === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reports.transactionCount')}</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reports.averagePerTransaction')}</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatRupiah(filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <PieChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {reportType === 'expense' ? t('reports.expenseDistribution') : t('reports.incomeDistribution')}
          </h3>
          {pieChartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="amount"
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatRupiah(value)} 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      color: chartColors.text
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              {t('reports.noDataAvailable')}
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('reports.monthlyTrend')}
          </h3>
          {monthlyData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="formattedMonth" stroke={chartColors.text} />
                  <YAxis tickFormatter={(value) => formatRupiah(value)} stroke={chartColors.text} />
                  <Tooltip 
                    formatter={(value: number) => formatRupiah(value)}
                    labelStyle={{ color: chartColors.text }}
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill={reportType === 'expense' ? '#EF4444' : '#10B981'} 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              {t('reports.noDataAvailable')}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('reports.categoryDetails')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('reports.category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('reports.transactionCount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('reports.totalAmount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('reports.percentage')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('reports.average')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {pieChartData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatRupiah(item.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.percentage.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatRupiah(item.amount / item.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pieChartData.length === 0 && (
          <div className="p-12 text-center">
            <PieChart className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('reports.noData')}</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('reports.noDataDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;