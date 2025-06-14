import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit3, 
  Trash2, 
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { useMonthlyBudgets } from '../../hooks/useMonthlyBudgets';
import { formatRupiah } from '../../utils/currency';
import { useModal } from '../Layout/ModalProvider';

const MonthlyBudgetList: React.FC = () => {
  const {
    monthlyBudgets,
    loading,
    currentMonth,
    currentYear,
    checkBudgetExists,
    createBudgetFromTemplate,
    updateBudgetAmount,
    deleteBudgetItem,
    navigateToMonth,
    getMonthName,
  } = useMonthlyBudgets();

  const { openModal } = useModal();
  const [budgetExists, setBudgetExists] = useState(false);
  const [checkingBudget, setCheckingBudget] = useState(false);
  const [creatingBudget, setCreatingBudget] = useState(false);
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null);

  useEffect(() => {
    checkBudgetExistence();
  }, [currentMonth, currentYear]);

  const checkBudgetExistence = async () => {
    setCheckingBudget(true);
    const exists = await checkBudgetExists(currentMonth, currentYear);
    setBudgetExists(exists);
    setCheckingBudget(false);
  };

  const handleCreateBudget = async () => {
    setCreatingBudget(true);
    const success = await createBudgetFromTemplate(currentMonth, currentYear);
    if (success) {
      setBudgetExists(true);
    } else {
      alert('Gagal membuat anggaran. Pastikan Anda sudah mengatur template anggaran di halaman Kategori.');
    }
    setCreatingBudget(false);
  };

  const handleEditBudget = (budget: any) => {
    openModal('editBudget', {
      budget,
      onUpdateBudget: updateBudgetAmount
    });
  };

  const handleDeleteBudget = async (budgetId: string, categoryName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus anggaran untuk kategori "${categoryName}"?`)) {
      await deleteBudgetItem(budgetId);
    }
  };

  const toggleExpandBudget = (budgetId: string) => {
    setExpandedBudget(prev => prev === budgetId ? null : budgetId);
  };

  const navigateToPreviousMonth = () => {
    if (currentMonth === 1) {
      navigateToMonth(12, currentYear - 1);
    } else {
      navigateToMonth(currentMonth - 1, currentYear);
    }
  };

  const navigateToNextMonth = () => {
    if (currentMonth === 12) {
      navigateToMonth(1, currentYear + 1);
    } else {
      navigateToMonth(currentMonth + 1, currentYear);
    }
  };

  const navigateToCurrentMonth = () => {
    const now = new Date();
    navigateToMonth(now.getMonth() + 1, now.getFullYear());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();
  };

  const getProgressColor = (status: string, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-500';
    switch (status) {
      case 'danger': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'danger': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      default: return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    }
  };

  const totalPlanned = monthlyBudgets.reduce((sum, budget) => sum + budget.planned_amount, 0);
  const totalSpent = monthlyBudgets.reduce((sum, budget) => sum + budget.actual_spent, 0);
  const totalRemaining = totalPlanned - totalSpent;
  const overallProgress = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anggaran Bulanan</h1>
          <p className="text-gray-600 dark:text-gray-400">Kelola anggaran berdasarkan bulan dan tahun</p>
        </div>
        <div className="flex items-center space-x-3">
          {!isCurrentMonth() && (
            <button
              onClick={navigateToCurrentMonth}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Bulan Ini</span>
            </button>
          )}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={navigateToPreviousMonth}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {getMonthName(currentMonth)} {currentYear}
            </h2>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isCurrentMonth() ? 'Bulan Ini' : 'Bulan Lalu'}
              </span>
            </div>
          </div>

          <button
            onClick={navigateToNextMonth}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Budget Creation or Overview */}
      {checkingBudget ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Memeriksa anggaran...</p>
        </div>
      ) : !budgetExists ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <Target className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Belum ada anggaran untuk {getMonthName(currentMonth)} {currentYear}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Buat anggaran bulanan berdasarkan template yang sudah Anda atur di halaman Kategori.
          </p>
          <button
            onClick={handleCreateBudget}
            disabled={creatingBudget}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            <span>{creatingBudget ? 'Membuat Anggaran...' : 'Buat Anggaran dari Template'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Budget Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Direncanakan</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{formatRupiah(totalPlanned)}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Terpakai</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{formatRupiah(totalSpent)}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Sisa Anggaran</p>
                  <p className={`text-lg sm:text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatRupiah(totalRemaining)}
                  </p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                  totalRemaining >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {totalRemaining >= 0 ? (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Progress Keseluruhan</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{overallProgress.toFixed(1)}%</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Budget Items List */}
          <div className="space-y-4">
            {monthlyBudgets.map((budget) => {
              const isOverBudget = budget.actual_spent > budget.planned_amount;
              const isExpanded = expandedBudget === budget.id;
              
              return (
                <div 
                  key={budget.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Budget Header - Always visible */}
                  <div 
                    className="p-4 sm:p-6 cursor-pointer"
                    onClick={() => toggleExpandBudget(budget.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: budget.category.color + '20' }}
                        >
                          <div
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                            style={{ backgroundColor: budget.category.color }}
                          />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                            {budget.category.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}
                            >
                              {isOverBudget ? 'Melebihi Anggaran' : 
                               budget.status === 'warning' ? 'Peringatan' : 'Sesuai Target'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                          {formatRupiah(budget.actual_spent)} / {formatRupiah(budget.planned_amount)}
                        </div>
                        <div className={`text-xs sm:text-sm font-medium ${
                          budget.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {budget.remaining >= 0 
                            ? `${formatRupiah(budget.remaining)} tersisa`
                            : `${formatRupiah(Math.abs(budget.remaining))} melebihi anggaran`
                          }
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar - Always visible */}
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor(budget.status, isOverBudget)}`}
                          style={{ width: `${budget.progress_percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Progress: {budget.progress_percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Anggaran</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatRupiah(budget.planned_amount)}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Terpakai</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatRupiah(budget.actual_spent)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBudget(budget);
                          }}
                          className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBudget(budget.id, budget.category.name);
                          }}
                          className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyBudgetList;