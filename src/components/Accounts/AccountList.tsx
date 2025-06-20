import React, { useState } from 'react';
import { Plus, Wallet, CreditCard, Building, PiggyBank, Banknote, Edit, Trash2, ArrowRightLeft, History, RefreshCw } from 'lucide-react';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRupiah, formatNumber } from '../../utils/currency';
import TransferHistory from './TransferHistory';
import { useModal } from '../Layout/ModalProvider';

const AccountList: React.FC = () => {
  const { accounts, deleteAccount, getTotalBalance, loadAccounts } = useAccounts();
  const { t } = useTheme();
  const { error: showError, success: showSuccess } = useToast();
  const { openModal } = useModal();
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    const accountToEdit = accounts.find(a => a.id === accountId);
    if (accountToEdit) {
      openModal('editAccount', accountToEdit);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAccounts();
      showSuccess('Data berhasil diperbarui', 'Informasi akun telah diperbarui');
    } catch (error) {
      console.error('Error refreshing accounts:', error);
      showError('Gagal memperbarui data', 'Silakan coba lagi');
    } finally {
      setIsRefreshing(false);
    }
  };

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
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {accounts.length >= 2 && (
            <>
              <button
                onClick={() => setShowTransferHistory(!showTransferHistory)}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Riwayat Transfer</span>
                <span className="sm:hidden">Riwayat</span>
              </button>
              <button
                onClick={() => openModal('transfer', accounts)}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Transfer Dana</span>
                <span className="sm:hidden">Transfer</span>
              </button>
            </>
          )}
          <button
            onClick={() => openModal('addAccount')}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('accounts.addAccount')}</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      {accounts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">{t('accounts.totalBalance')}</h3>
              <p className="text-2xl sm:text-3xl font-bold">{formatRupiah(getTotalBalance())}</p>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">
                di {formatAccountCount(accounts.length)}
              </p>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>
        </div>
      )}

      {/* Transfer History */}
      {showTransferHistory && accounts.length >= 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Riwayat Transfer</h2>
          <TransferHistory accounts={accounts} />
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {accounts.map((account) => {
            const IconComponent = getIconComponent(account.icon);
            return (
              <div
                key={account.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: account.color + '20' }}
                    >
                      <IconComponent 
                        className="w-5 h-5 sm:w-6 sm:h-6"
                        style={{ color: account.color }}
                      />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{account.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{getAccountTypeLabel(account.type)}</p>
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
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">{t('accounts.currentBalance')}</p>
                    <p className={`text-xl sm:text-2xl font-bold ${
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <Wallet className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{t('accounts.noAccounts')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {t('accounts.noAccountsDesc')}
          </p>
          <button
            onClick={() => openModal('addAccount')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>{t('accounts.addFirstAccount')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountList;