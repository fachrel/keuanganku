import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Trash2, Calendar } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';
import AddTransactionModal from './AddTransactionModal';

const TransactionList: React.FC = () => {
  const { transactions, categories, addTransaction, deleteTransaction } = useTransactions();
  const { t } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || transaction.type === filterType;
        const matchesCategory = filterCategory === 'all' || transaction.category_id === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(transaction => ({
        ...transaction,
        category: categories.find(c => c.id === transaction.category_id),
      }));
  }, [transactions, categories, searchTerm, filterType, filterCategory]);

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm(t('transactions.deleteConfirm'))) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('transactions.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('transactions.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>{t('transactions.addTransaction')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('transactions.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">{t('transactions.allTypes')}</option>
            <option value="income">{t('common.income')}</option>
            <option value="expense">{t('common.expense')}</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">{t('transactions.allCategories')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: transaction.category?.color + '20' }}
                    >
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: transaction.category?.color }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{transaction.description}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{transaction.category?.name || t('reports.unknownCategory')}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(transaction.date).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatRupiah(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {transaction.type === 'income' ? t('common.income') : t('common.expense')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Filter className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('transactions.noTransactions')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('transactions.noTransactionsDesc')}</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddTransactionModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onAddTransaction={addTransaction}
        />
      )}
    </div>
  );
};

export default TransactionList;