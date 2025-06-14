import React, { useState } from 'react';
import { Plus, Wallet, CreditCard, Building, PiggyBank, Banknote, Edit, Trash2 } from 'lucide-react';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';
import AddAccountModal from './AddAccountModal';

const AccountList: React.FC = () => {
  const { accounts, addAccount, deleteAccount, getTotalBalance } = useAccounts();
  const { t } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);

  const getIconComponent = (iconName: string) => {
    const icons = {
      Wallet,
      CreditCard,
      Building,
      PiggyBank,
      Banknote,
    };
    return icons[iconName as keyof typeof icons] || Wallet;
  };

  const getAccountTypeLabel = (type: string) => {
    const types = {
      cash: 'Cash',
      checking: 'Checking Account',
      savings: 'Savings Account',
      credit: 'Credit Card',
      investment: 'Investment',
      other: 'Other',
    };
    return types[type as keyof typeof types] || 'Other';
  };

  const handleDeleteAccount = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete account "${name}"? This action cannot be undone.`)) {
      deleteAccount(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your financial accounts and track balances</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Total Balance Card */}
      {accounts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Total Balance</h3>
              <p className="text-3xl font-bold">{formatRupiah(getTotalBalance())}</p>
              <p className="text-blue-100 text-sm mt-1">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const IconComponent = getIconComponent(account.icon);
            return (
              <div
                key={account.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: account.color + '20' }}
                    >
                      <IconComponent 
                        className="w-6 h-6"
                        style={{ color: account.color }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{account.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getAccountTypeLabel(account.type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit account"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id, account.name)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Balance</p>
                    <p className={`text-2xl font-bold ${
                      account.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatRupiah(account.balance)}
                    </p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Wallet className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No accounts yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Start by adding your first account to track your money across different sources like cash, bank accounts, and credit cards.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Account</span>
          </button>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <AddAccountModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddAccount={addAccount}
        />
      )}
    </div>
  );
};

export default AccountList;