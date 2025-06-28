import React, { useState } from 'react';
import { useRecurringTransactions } from '../../hooks/useRecurringTransactions';
import { useModal } from '../Layout/ModalProvider';
import { useTransactions } from '../../hooks/useTransactions';
import { Transaction } from '../../types';
import { RecurringTransaction } from '../../types';
import { formatRupiah } from '../../utils/currency';
import { Plus, Trash2, Repeat, ArrowUpCircle, ArrowDownCircle, ChevronDown, ChevronRight, List } from 'lucide-react';

const RecurringTransactionList: React.FC = () => {
  const { recurringTransactions, loading, deleteRecurringTransaction } = useRecurringTransactions();
  const { openModal } = useModal();
  const { getTransactionsByRuleId } = useTransactions();
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recurring transaction? This cannot be undone.')) {
      try {
        await deleteRecurringTransaction(id);
      } catch (error) {
        console.error('Failed to delete recurring transaction:', error);
      }
    }
  };

  const handleToggleHistory = async (ruleId: string) => {
    if (expandedRuleId === ruleId) {
      // If it's already open, close it
      setExpandedRuleId(null);
      setHistory([]);
    } else {
      // If it's closed, open it and fetch history
      setHistoryLoading(true);
      setExpandedRuleId(ruleId);
      const fetchedHistory = await getTransactionsByRuleId(ruleId);
      setHistory(fetchedHistory);
      setHistoryLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'expense':
        return <ArrowDownCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <ArrowDownCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };
  
  const getAmountColor = (type: string) => {
    return type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recurring Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your automatic bills and income.</p>
        </div>
        <button
          onClick={() => openModal('addRecurringTransaction')}
          className="flex items-center justify-center space-x-2 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recurring</span>
        </button>
      </div>

      {/* List of Recurring Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {loading && recurringTransactions.length === 0 ? (
          <div className="p-8 text-center">Loading...</div>
        ) : recurringTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recurringTransactions.map((rt: RecurringTransaction) => (
              <div key={rt.id}>
                <div className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">{getTransactionIcon(rt.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{rt.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {rt.next_due_date 
                          ? `Next due: ${new Date(rt.next_due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                          : 'Inactive'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                        <p className={`font-semibold ${getAmountColor(rt.type)}`}>{formatRupiah(rt.amount)}</p>
                        <p className="text-xs text-gray-400 capitalize">{rt.frequency}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => handleToggleHistory(rt.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                            title="View History"
                        >
                            {expandedRuleId === rt.id ? <ChevronDown className="w-4 h-4" /> : <List className="w-4 h-4" />}
                        </button>
                        
                        <button
                            onClick={() => handleDelete(rt.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                            title="Delete Rule"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                </div>

                {/* Inline History Display */}
                {expandedRuleId === rt.id && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {historyLoading ? (
                      <p className="text-sm text-center text-gray-500">Loading history...</p>
                    ) : history.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Generated Transactions:</h4>
                        {history.map(tx => (
                          <div key={tx.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className={`font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {formatRupiah(tx.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-center text-gray-500">No transactions have been generated from this rule yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Repeat className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Recurring Transactions</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first recurring bill or income to get started.</p>
            <button
              onClick={() => openModal('addRecurringTransaction')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Recurring
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurringTransactionList;
