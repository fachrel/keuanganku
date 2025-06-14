import React, { useState, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';
import { MonthlyBudgetWithDetails } from '../../types';
import { formatRupiah } from '../../utils/currency';

interface EditBudgetModalProps {
  budget: MonthlyBudgetWithDetails;
  onClose: () => void;
  onUpdateBudget: (budgetId: string, newAmount: number) => Promise<boolean>;
}

const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  budget,
  onClose,
  onUpdateBudget,
}) => {
  const [amount, setAmount] = useState(budget.planned_amount.toString());
  const [loading, setLoading] = useState(false);

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAmount = parseFloat(amount);
    if (newAmount < 0) {
      alert('Jumlah anggaran tidak boleh negatif');
      return;
    }

    setLoading(true);
    try {
      const success = await onUpdateBudget(budget.id, newAmount);
      if (success) {
        onClose();
      } else {
        alert('Gagal mengupdate anggaran. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error updating budget:', error);
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

  const newAmount = parseFloat(amount) || 0;
  const newRemaining = newAmount - budget.actual_spent;
  const newProgress = newAmount > 0 ? (budget.actual_spent / newAmount) * 100 : 0;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Anggaran</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Budget Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: budget.category.color + '20' }}
            >
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: budget.category.color }}
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{budget.category.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Terpakai: {formatRupiah(budget.actual_spent)}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jumlah Anggaran (Rp)
            </label>
            <input
              type="number"
              id="amount"
              step="1000"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0"
            />
          </div>

          {/* Current vs New Comparison */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anggaran Saat Ini</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatRupiah(budget.planned_amount)}</p>
              <p className={`text-sm ${budget.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {budget.remaining >= 0 ? 'Sisa: ' : 'Lebih: '}{formatRupiah(Math.abs(budget.remaining))}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anggaran Baru</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{formatRupiah(newAmount)}</p>
              <p className={`text-sm ${newRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {newRemaining >= 0 ? 'Sisa: ' : 'Lebih: '}{formatRupiah(Math.abs(newRemaining))}
              </p>
            </div>
          </div>

          {/* Progress Preview */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-200">Preview Perubahan</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-800 dark:text-blue-200">Progress baru:</span>
                <span className="font-medium text-blue-900 dark:text-blue-200">{newProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    newProgress > 100 ? 'bg-red-500 dark:bg-red-600' : 
                    newProgress > 85 ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-blue-500 dark:bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(newProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudgetModal;