import React, { useState } from 'react';
import { X, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { Account } from '../../types';
import { useAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRupiah } from '../../utils/currency';

interface TransferModalProps {
  isOpen: boolean;
  accounts: Account[];
  onClose: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, accounts, onClose }) => {
  const { user } = useAuth();
  const { addTransaction, loadTransactions } = useTransactions();
  const { loadAccounts } = useAccounts();
  const { error: showError, success: showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    sourceAccountId: '',
    destinationAccountId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const sourceAccount = accounts.find(a => a.id === formData.sourceAccountId);
  const destinationAccount = accounts.find(a => a.id === formData.destinationAccountId);
  const transferAmount = parseFloat(formData.amount) || 0;

  const validateForm = () => {
    if (!formData.sourceAccountId) {
      showError('Pilih akun sumber', 'Akun sumber harus dipilih');
      return false;
    }
    if (!formData.destinationAccountId) {
      showError('Pilih akun tujuan', 'Akun tujuan harus dipilih');
      return false;
    }
    if (formData.sourceAccountId === formData.destinationAccountId) {
      showError('Akun tidak boleh sama', 'Pilih akun sumber dan tujuan yang berbeda');
      return false;
    }
    if (!formData.amount || transferAmount <= 0) {
      showError('Jumlah tidak valid', 'Masukkan jumlah transfer yang valid');
      return false;
    }
    if (sourceAccount && transferAmount > sourceAccount.balance) {
      showError('Saldo tidak mencukupi', `Saldo tersedia: ${formatRupiah(sourceAccount.balance)}`);
      return false;
    }
    if (!formData.description.trim()) {
      showError('Deskripsi diperlukan', 'Masukkan deskripsi transfer');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!user || !sourceAccount || !destinationAccount) return;

    setLoading(true);
    try {
      // Create expense transaction for source account
      await addTransaction({
        amount: transferAmount,
        description: `Transfer ke ${destinationAccount.name}: ${formData.description}`,
        category_id: await getOrCreateTransferCategory(),
        type: 'expense',
        date: formData.date,
        user_id: user.id,
        account_id: formData.sourceAccountId,
      });

      // Create income transaction for destination account
      await addTransaction({
        amount: transferAmount,
        description: `Transfer dari ${sourceAccount.name}: ${formData.description}`,
        category_id: await getOrCreateTransferCategory(),
        type: 'income',
        date: formData.date,
        user_id: user.id,
        account_id: formData.destinationAccountId,
      });

      // Reload data
      await Promise.all([loadTransactions(), loadAccounts()]);

      showSuccess(
        'Transfer berhasil',
        `${formatRupiah(transferAmount)} telah ditransfer dari ${sourceAccount.name} ke ${destinationAccount.name}`
      );

      // Reset form and close modal
      setFormData({
        sourceAccountId: '',
        destinationAccountId: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error('Error processing transfer:', error);
      showError('Transfer gagal', 'Silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateTransferCategory = async () => {
    // This would typically be handled by a hook or service
    // For now, we'll assume there's a "Transfer" category
    // In a real implementation, you'd want to create this category if it doesn't exist
    return 'transfer-category-id'; // Placeholder
  };

  if (!isOpen) return null;

  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Konfirmasi Transfer</h2>
            <button
              onClick={() => setShowConfirmation(false)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-200">Detail Transfer</span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 dark:text-blue-200">Dari:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">{sourceAccount?.name}</span>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 dark:text-blue-200">Ke:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">{destinationAccount?.name}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                  <span className="text-blue-800 dark:text-blue-200">Jumlah:</span>
                  <span className="font-bold text-blue-900 dark:text-blue-100">{formatRupiah(transferAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 dark:text-blue-200">Deskripsi:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">{formData.description}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Peringatan</p>
                  <p>Transfer ini akan membuat 2 transaksi: pengeluaran dari akun sumber dan pemasukan ke akun tujuan.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Memproses...' : 'Konfirmasi Transfer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Transfer Dana</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Source Account */}
          <div>
            <label htmlFor="sourceAccount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Akun Sumber
            </label>
            <select
              id="sourceAccount"
              required
              value={formData.sourceAccountId}
              onChange={(e) => setFormData({ ...formData, sourceAccountId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Pilih akun sumber</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({formatRupiah(account.balance)})
                </option>
              ))}
            </select>
            {sourceAccount && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Saldo tersedia: {formatRupiah(sourceAccount.balance)}
              </p>
            )}
          </div>

          {/* Destination Account */}
          <div>
            <label htmlFor="destinationAccount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Akun Tujuan
            </label>
            <select
              id="destinationAccount"
              required
              value={formData.destinationAccountId}
              onChange={(e) => setFormData({ ...formData, destinationAccountId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Pilih akun tujuan</option>
              {accounts
                .filter(account => account.id !== formData.sourceAccountId)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatRupiah(account.balance)})
                  </option>
                ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jumlah Transfer
            </label>
            <input
              type="number"
              id="amount"
              required
              min="1"
              step="1000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="0"
            />
            {transferAmount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatRupiah(transferAmount)}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deskripsi Transfer
            </label>
            <input
              type="text"
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Contoh: Pembayaran tagihan, Transfer ke tabungan"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal Transfer
            </label>
            <input
              type="date"
              id="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Transfer Preview */}
          {sourceAccount && destinationAccount && transferAmount > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Preview Transfer</h4>
              <div className="flex items-center justify-between text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900 dark:text-white">{sourceAccount.name}</p>
                  <p className="text-red-600 dark:text-red-400">-{formatRupiah(transferAmount)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sisa: {formatRupiah(sourceAccount.balance - transferAmount)}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div className="text-center">
                  <p className="font-medium text-gray-900 dark:text-white">{destinationAccount.name}</p>
                  <p className="text-green-600 dark:text-green-400">+{formatRupiah(transferAmount)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total: {formatRupiah(destinationAccount.balance + transferAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={accounts.length < 2}
              className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Transfer Dana
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;