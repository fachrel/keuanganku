import React, { useState, useEffect } from 'react';
import { useRecurringTransactions } from '../../hooks/useRecurringTransactions';
import { useAccounts } from '../../hooks/useAccounts';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { RecurringTransaction, Category } from '../../types';
import { X, DollarSign, Calendar, FileText, Tag, Repeat, CreditCard } from 'lucide-react';

// The input type for our form data state
type FormData = Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'last_created_date' | 'accounts' | 'categories' | 'amount'> & {
    amount: string; 
};

interface AddRecurringModalProps {
  closeModal: () => void;
}

const AddRecurringModal: React.FC<AddRecurringModalProps> = ({ closeModal }) => {
  const { addRecurringTransaction, loading } = useRecurringTransactions();
  const { accounts } = useAccounts();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const { success: showSuccess, error: showError } = useToast();

  const [formData, setFormData] = useState<FormData>({
    description: '',
    amount: '',
    type: 'expense',
    account_id: '',
    category_id: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    next_due_date: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories when the modal is opened
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);
      if (error) {
        showError('Gagal memuat kategori.');
        console.error(error);
      } else {
        setCategories(data || []);
      }
    };
    fetchCategories();
  }, [user, showError]);


  // Set default account when accounts are loaded
  useEffect(() => {
    if (accounts.length > 0 && !formData.account_id) {
        setFormData(prev => ({ ...prev, account_id: accounts[0].id }));
    }
  }, [accounts, formData.account_id]);


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.description.trim()) newErrors.description = 'Deskripsi diperlukan';
    if (!formData.amount) newErrors.amount = 'Jumlah diperlukan';
    if (parseFloat(formData.amount) <= 0) newErrors.amount = 'Jumlah harus lebih besar dari 0';
    if (!formData.account_id) newErrors.account_id = 'Akun harus dipilih';
    if (!formData.start_date) newErrors.start_date = 'Tanggal mulai diperlukan';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type,
      category_id: '' // Reset category on type change
    }));
  };
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        showError('Data tidak valid', 'Periksa kembali isian form Anda.');
        return;
    }

    try {
      const next_due_date = formData.start_date;

      // Prepare the data for submission, ensuring optional fields are handled correctly
      const submissionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        next_due_date,
        // THIS IS THE FIX: If end_date is an empty string, send null instead.
        end_date: formData.end_date || null,
      };

      await addRecurringTransaction(submissionData);

      showSuccess('Transaksi berulang berhasil ditambahkan');
      closeModal();
    } catch (error) {
      console.error("Failed to add recurring transaction", error);
      showError('Gagal menambahkan transaksi', 'Terjadi kesalahan pada server.');
    }
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <div className="modal-container" onClick={handleBackdropClick}>
      <div className="modal-content max-w-lg w-full">
        <div className="modal-header">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tambah Transaksi Berulang</h2>
            <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
        </div>

        <div className="modal-body scrollbar-hide">
            <form className="space-y-6" noValidate>
                {/* Transaction Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Jenis Transaksi</label>
                    <div className="flex space-x-3">
                        <button type="button" onClick={() => handleTypeChange('expense')} className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${formData.type === 'expense' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'border-gray-200 dark:border-gray-600'}`}>
                            Pengeluaran
                        </button>
                        <button type="button" onClick={() => handleTypeChange('income')} className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${formData.type === 'income' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-gray-200 dark:border-gray-600'}`}>
                            Pemasukan
                        </button>
                    </div>
                </div>
                
                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deskripsi</label>
                  <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                      <input id="description" type="text" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`} placeholder="e.g., Tagihan Internet"/>
                  </div>
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jumlah</label>
                  <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                      <input id="amount" type="number" value={formData.amount} onChange={(e) => handleChange('amount', e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`} placeholder="100000"/>
                  </div>
                  {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Account */}
                    <div>
                        <label htmlFor="account_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Akun</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                            <select id="account_id" value={formData.account_id} onChange={(e) => handleChange('account_id', e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-lg appearance-none focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.account_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                        {errors.account_id && <p className="text-red-500 text-xs mt-1">{errors.account_id}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategori</label>
                         <div className="relative">
                            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                            <select id="category_id" value={formData.category_id || ''} onChange={(e) => handleChange('category_id', e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="">-- Tanpa Kategori --</option>
                                {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {/* Frequency */}
                    <div>
                        <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frekuensi</label>
                         <div className="relative">
                            <Repeat className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                            <select id="frequency" value={formData.frequency} onChange={(e) => handleChange('frequency', e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')} className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="daily">Harian</option>
                                <option value="weekly">Mingguan</option>
                                <option value="monthly">Bulanan</option>
                                <option value="yearly">Tahunan</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Start Date */}
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tanggal Mulai</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                            <input id="start_date" type="date" value={formData.start_date} onChange={(e) => handleChange('start_date', e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.start_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`} />
                        </div>
                        {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
                    </div>

                    {/* End Date (Optional) */}
                    <div className="sm:col-span-2">
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tanggal Berakhir (Opsional)</label>
                        <div className="relative">
                           <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                           <input id="end_date" type="date" value={formData.end_date || ''} onChange={(e) => handleChange('end_date', e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700" />
                        </div>
                    </div>
                </div>
            </form>
        </div>
        
        <div className="modal-footer">
            <button type="button" onClick={closeModal} disabled={loading} className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                Batal
            </button>
            <button type="submit" onClick={handleSubmit} disabled={loading} className={`flex-1 px-4 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${formData.type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {loading ? 'Menyimpan...' : 'Simpan Aturan'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddRecurringModal;
