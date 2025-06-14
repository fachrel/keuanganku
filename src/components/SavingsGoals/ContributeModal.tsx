import React, { useState, useEffect } from 'react';
import { X, PiggyBank, DollarSign, CreditCard, AlertTriangle } from 'lucide-react';
import { SavingsGoal } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccounts } from '../../hooks/useAccounts';
import { formatRupiah } from '../../utils/currency';

interface ContributeModalProps {
  goal: SavingsGoal;
  onClose: () => void;
  onContribute: (goalId: string, amount: number, description: string, accountId?: string) => Promise<boolean>;
}

const ContributeModal: React.FC<ContributeModalProps> = ({ goal, onClose, onContribute }) => {
  const { t } = useTheme();
  const { accounts } = useAccounts();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState(`Kontribusi untuk ${goal.name}`);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const remainingAmount = goal.target_amount - goal.current_amount;
  const progress = (goal.current_amount / goal.target_amount) * 100;
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const contributionAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description.trim()) {
      return;
    }

    if (contributionAmount <= 0) {
      alert('Jumlah kontribusi harus lebih dari 0');
      return;
    }

    // Check account balance if account is selected
    if (selectedAccount && contributionAmount > selectedAccount.balance) {
      alert(`Saldo tidak mencukupi. Saldo tersedia: ${formatRupiah(selectedAccount.balance)}`);
      return;
    }

    if (contributionAmount > remainingAmount) {
      if (!window.confirm(`Jumlah kontribusi (${formatRupiah(contributionAmount)}) melebihi sisa target (${formatRupiah(remainingAmount)}). Lanjutkan?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      const success = await onContribute(goal.id, contributionAmount, description.trim(), selectedAccountId || undefined);
      if (success) {
        onClose();
      } else {
        alert('Gagal menambahkan kontribusi. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error contributing to goal:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const quickAmounts = [
    Math.min(50000, remainingAmount),
    Math.min(100000, remainingAmount),
    Math.min(250000, remainingAmount),
    remainingAmount,
  ].filter(amount => amount > 0);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Kontribusi Tabungan</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Goal Info */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: goal.color + '20' }}
              >
                <PiggyBank 
                  className="w-6 h-6"
                  style={{ color: goal.color }}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{goal.name}</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>{formatRupiah(goal.current_amount)} / {formatRupiah(goal.target_amount)}</p>
                  <p>Sisa: {formatRupiah(remainingAmount)} ({(100 - progress).toFixed(1)}%)</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Source Account Selection */}
              {accounts.length > 0 && (
                <div>
                  <label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sumber Dana (Opsional)
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <select
                      id="account"
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Tidak menggunakan akun</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({formatRupiah(account.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedAccount && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Saldo tersedia: {formatRupiah(selectedAccount.balance)}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jumlah Kontribusi (Rp)
                </label>
                <input
                  type="number"
                  id="amount"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="0"
                />
              </div>

              {/* Quick Amount Buttons */}
              {quickAmounts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jumlah Cepat
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {quickAmounts.map((quickAmount, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAmount(quickAmount.toString())}
                        className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-900 dark:text-white"
                      >
                        {index === quickAmounts.length - 1 ? 'Sisa Target' : formatRupiah(quickAmount)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deskripsi Transaksi
                </label>
                <input
                  type="text"
                  id="description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Deskripsi kontribusi"
                />
              </div>

              {/* Balance Warning */}
              {selectedAccount && contributionAmount > selectedAccount.balance && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800 dark:text-red-200">
                      <p className="font-medium mb-1">Saldo Tidak Mencukupi</p>
                      <p>Saldo akun {selectedAccount.name}: {formatRupiah(selectedAccount.balance)}</p>
                      <p>Jumlah kontribusi: {formatRupiah(contributionAmount)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {amount && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-900 dark:text-blue-200">{t('common.preview')} Kontribusi</span>
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>Jumlah: {formatRupiah(parseFloat(amount))}</p>
                    <p>Setelah kontribusi: {formatRupiah(goal.current_amount + parseFloat(amount))}</p>
                    <p>Progress: {((goal.current_amount + parseFloat(amount)) / goal.target_amount * 100).toFixed(1)}%</p>
                    {selectedAccount && (
                      <p>Saldo {selectedAccount.name} setelah kontribusi: {formatRupiah(selectedAccount.balance - parseFloat(amount))}</p>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || (selectedAccount && contributionAmount > selectedAccount.balance)}
            className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('common.processing') : t('savings.contribute')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContributeModal;