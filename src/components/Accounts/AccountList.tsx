import React, { useState } from 'react';
import { Plus, Wallet, CreditCard, Building, PiggyBank, Banknote, Edit, Trash2, ArrowRightLeft, History } from 'lucide-react';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRupiah, formatNumber } from '../../utils/currency';
import AddAccountModal from './AddAccountModal';
import EditAccountModal from './EditAccountModal';
import TransferModal from './TransferModal';
import TransferHistory from './TransferHistory';

const AccountList: React.FC = () => {
  const { accounts, deleteAccount, getTotalBalance } = useAccounts();
  const { t } = useTheme();
  const { error: showError, success: showSuccess } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

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
      cash: t('accounts.types.cash'),
      bank: t('accounts.types.bank'),
      emoney: t('accounts.types.emoney'),
      other: t('accounts.types.other'),
    };
    return types[type as keyof typeof types] || t('accounts.types.other');
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (window.confirm(`${t('accounts.deleteConfirm')} "${name}"?`)) {
      const success = await deleteAccount(id);
      if (success) {
        showSuccess('Akun berhasil dihapus', `Akun ${name} telah dihapus`);
      } else {
        showError('Gagal menghapus akun', t('accounts.cannotDelete'));
      }
    }
  };

  const handleEditAccount = (accountId: string) => {
    setSelectedAccount(accountId);
    setShowEditModal(true);
  };

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);

  // Format account count for display
  const formatAccountCount = (count: number) => {
    if (count === 1) {
      return '1 akun';
    }
    return `${formatNumber(count)} akun`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('accounts.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('accounts.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {accounts.length >= 2 && (
            <>
              <button
                onClick={() => setShowTransferHistory(!showTransferHistory)}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                <span>Riwayat Transfer</span>
              </button>
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Transfer Dana</span>
              </button>
            </>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>{t('accounts.addAccount')}</span>
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      {accounts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('accounts.totalBalance')}</h3>
              <p className="text-3xl font-bold">{formatRupiah(getTotalBalance())}</p>
              <p className="text-blue-100 text-sm mt-1">
                di {formatAccountCount(accounts.length)}
              </p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </div>
      )}

      {/* Transfer History */}
      {showTransferHistory && accounts.length >= 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Riwayat Transfer</h2>
          <TransferHistory accounts={accounts} />
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
                      onClick={() => handleEditAccount(account.id)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title={t('accounts.editAccount')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id, account.name)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('accounts.currentBalance')}</p>
                    <p className={`text-2xl font-bold ${
                      account.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatRupiah(account.balance)}
                    </p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('accounts.created')} {new Date(account.created_at).toLocaleDateString('id-ID')}
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
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{t('accounts.noAccounts')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {t('accounts.noAccountsDesc')}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>{t('accounts.addFirstAccount')}</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddAccountModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && selectedAccountData && (
        <EditAccountModal
          isOpen={showEditModal}
          account={selectedAccountData}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAccount(null);
          }}
        />
      )}

      {showTransferModal && (
        <TransferModal
          isOpen={showTransferModal}
          accounts={accounts}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  );
};

export default AccountList;