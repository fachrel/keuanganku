import React, { useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useTheme } from '../../contexts/ThemeContext';
import { Transaction } from '../../types';
import { formatRupiah } from '../../utils/currency';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightCircle,
  Edit,
  Trash2,
  CreditCard,
  RefreshCw,
  XCircle,
  Camera
} from 'lucide-react';
import { useModal } from '../Layout/ModalProvider';

const TransactionList: React.FC = () => {
  const { transactions, loading, deleteTransaction, loadTransactions } = useTransactions();
  const { t } = useTheme();
  const { openModal } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null)

  const filteredTransactions = transactions
    ?.filter((transaction: Transaction) => {
      const transactionDate = new Date(transaction.date);

      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            transaction.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || transaction.type === filterType;

      // NEW: Date filtering logic
      const matchesDate = 
        (!startDate || transactionDate >= startDate) && 
        (!endDate || transactionDate <= endDate);

      return matchesSearch && matchesType && matchesDate; // Add matchesDate here
    })
    .sort((a: Transaction, b: Transaction) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return b.amount - a.amount;
    });

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm(t('confirm_delete_transaction'))) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadTransactions();
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />;
      case 'expense':
        return <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />;
      case 'transfer':
        return <ArrowRightCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'expense':
        return 'bg-red-100 dark:bg-red-900/20';
      case 'transfer':
        return 'bg-blue-100 dark:bg-blue-900/20';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600 dark:text-green-400';
      case 'expense':
        return 'text-red-600 dark:text-red-400';
      case 'transfer':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'income':
        return '+';
      case 'expense':
        return '-';
      case 'transfer':
        return '↔';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('transactions')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('manage_transactions_description')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => openModal('ocrTransaction')}
            className="flex items-center justify-center space-x-2 px-4 py-2 text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all duration-200"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Scan Receipt</span>
            <span className="sm:hidden">Scan</span>
          </button>
          <button
            onClick={() => openModal('addTransaction')}
            className="flex items-center justify-center space-x-2 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('add_transaction')}</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('search_transactions')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Type Filter (No changes inside this div) */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense' | 'transfer')}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('all_types')}</option>
                <option value="income">{t('income')}</option>
                <option value="expense">{t('expense')}</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            {/* Sort (No changes inside this div) */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">{t('sort_by_date')}</option>
                <option value="amount">{t('sort_by_amount')}</option>
              </select>
            </div>
          </div>

          {/* ADD THIS NEW SECTION BELOW THE FILTERS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Start Date */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                    type="date"
                    value={startDate ? startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (!e.target.value) return setStartDate(null);
                      const date = new Date(e.target.value);
                      date.setHours(0, 0, 0, 0); // Set to start of day
                      setStartDate(date);
                    }}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* End Date */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                    type="date"
                    value={endDate ? endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                        if (!e.target.value) return setEndDate(null);
                        const date = new Date(e.target.value);
                        date.setHours(23, 59, 59, 999); // Set to end of day
                        setEndDate(date);
                    }}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
          </div>

          {/* ADD THIS NEW CLEAR BUTTON LOGIC */}
          {(startDate || endDate) && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
                className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <XCircle className="w-3 h-3"/>
                <span>Clear Date Filter</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.map((transaction: Transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  {/* Left side - Icon and details */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-full flex-shrink-0 ${getTransactionTypeColor(transaction.type)}`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                        {transaction.description}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {transaction.category && (
                          <div className="flex items-center space-x-1">
                            <span
                              className="inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: transaction.category.color }}
                            />
                            <span className="truncate">{transaction.category.name}</span>
                          </div>
                        )}
                        {transaction.account && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate">{transaction.account.name}</span>
                          </>
                        )}
                        <span className="hidden sm:inline">•</span>
                        <span className="flex-shrink-0">{new Date(transaction.date).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'short',
                          year: window.innerWidth < 640 ? '2-digit' : 'numeric'
                        })}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Amount and actions */}
                  <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                    <span className={`text-sm sm:text-lg font-semibold ${getAmountColor(transaction.type)}`}>
                      {getAmountPrefix(transaction.type)}{formatRupiah(transaction.amount)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title={t('edit')}
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('no_transactions')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('no_transactions_description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => openModal('ocrTransaction')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan Receipt
              </button>
              <button
                onClick={() => openModal('addTransaction')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('add_first_transaction')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;