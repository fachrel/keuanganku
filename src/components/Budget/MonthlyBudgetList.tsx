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
  RefreshCw
} from 'lucide-react';
import { useMonthlyBudgets } from '../../hooks/useMonthlyBudgets';
import { formatRupiah } from '../../utils/currency';
import EditBudgetModal from './EditBudgetModal';

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

  const [budgetExists, setBudgetExists] = useState(false);
  const [checkingBudget, setCheckingBudget] = useState(false);
  const [creatingBudget, setCreatingBudget] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

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

  const handleEditBudget = (budgetId: string) => {
    setSelectedBudget(budgetId);
    setShowEditModal(true);
  };

  const handleDeleteBudget = async (budgetId: string, categoryName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus anggaran untuk kategori "${categoryName}"?`)) {
      await deleteBudgetItem(budgetId);
    }
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
      case 'danger': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const totalPlanned = monthlyBudgets.reduce((sum, budget) => sum + budget.planned_amount, 0);
  const totalSpent = monthlyBudgets.reduce((sum, budget) => sum + budget.actual_spent, 0);
  const totalRemaining = totalPlanned - totalSpent;
  const overallProgress = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;

  const selectedBudgetData = monthlyBudgets.find(b => b.id === selectedBudget);

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anggaran Bulanan</h1>
          <p className="text-gray-600">Kelola anggaran berdasarkan bulan dan tahun</p>
        </div>
        <div className="flex items-center space-x-3">
          {!isCurrentMonth() && (
            <button
              onClick={navigateToCurrentMonth}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Bulan Ini</span>
            </button>
          )}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={navigateToPreviousMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {getMonthName(currentMonth)} {currentYear}
            </h2>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                {isCurrentMonth() ? 'Bulan Ini' : 'Bulan Lalu'}
              </span>
            </div>
          </div>

          <button
            onClick={navigateToNextMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Budget Creation or Overview */}
      {checkingBudget ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memeriksa anggaran...</p>
        </div>
      ) : !budgetExists ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Belum ada anggaran untuk {getMonthName(currentMonth)} {currentYear}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Direncanakan</p>
                  <p className="text-2xl font-bold text-blue-600">{formatRupiah(totalPlanned)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Terpakai</p>
                  <p className="text-2xl font-bold text-red-600">{formatRupiah(totalSpent)}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sisa Anggaran</p>
                  <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatRupiah(totalRemaining)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  totalRemaining >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {totalRemaining >= 0 ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progress Keseluruhan</p>
                  <p className="text-2xl font-bold text-purple-600">{overallProgress.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Budget Items List */}
          <div className="space-y-4">
            {monthlyBudgets.map((budget) => {
              const isOverBudget = budget.actual_spent > budget.planned_amount;
              
              return (
                <div key={budget.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
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
                        <h3 className="text-lg font-medium text-gray-900">
                          {budget.category.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}
                          >
                            {isOverBudget ? 'Melebihi Anggaran' : 
                             budget.status === 'warning' ? 'Peringatan' : 'Sesuai Target'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditBudget(budget.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit anggaran"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budget.id, budget.category.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus anggaran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Direncanakan vs Terpakai</span>
                      <span className="font-medium text-gray-900">
                        {formatRupiah(budget.actual_spent)} / {formatRupiah(budget.planned_amount)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(budget.status, isOverBudget)}`}
                        style={{ width: `${budget.progress_percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Progress: {budget.progress_percentage.toFixed(1)}%</span>
                      <span className={`font-medium ${
                        budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {budget.remaining >= 0 
                          ? `${formatRupiah(budget.remaining)} tersisa`
                          : `${formatRupiah(Math.abs(budget.remaining))} melebihi anggaran`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Edit Budget Modal */}
      {showEditModal && selectedBudgetData && (
        <EditBudgetModal
          budget={selectedBudgetData}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBudget(null);
          }}
          onUpdateBudget={updateBudgetAmount}
        />
      )}
    </div>
  );
};

export default MonthlyBudgetList;