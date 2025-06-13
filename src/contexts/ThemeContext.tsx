import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Language = 'id' | 'en';

interface ThemeContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Translation dictionaries
const translations = {
  id: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transaksi',
    'nav.categories': 'Kategori',
    'nav.budgets': 'Anggaran',
    'nav.savings': 'Tujuan Tabungan',
    'nav.reports': 'Laporan',
    'nav.settings': 'Pengaturan',
    'nav.logout': 'Keluar',
    'nav.loggedInAs': 'Masuk sebagai',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Ringkasan lengkap status keuangan Anda',
    'dashboard.totalBalance': 'Total Saldo',
    'dashboard.monthlyIncome': 'Pemasukan Bulan Ini',
    'dashboard.monthlyExpenses': 'Pengeluaran Bulan Ini',
    'dashboard.savingsProgress': 'Progress Tabungan',
    'dashboard.cashFlow': 'Arus Kas Bulanan',
    'dashboard.income': 'Pemasukan',
    'dashboard.expenses': 'Pengeluaran',
    'dashboard.netCashFlow': 'Arus Kas Bersih',
    'dashboard.budgetStatus': 'Status Anggaran',
    'dashboard.savingsGoals': 'Tujuan Tabungan',
    'dashboard.recentTransactions': 'Transaksi Terbaru',
    'dashboard.fromLastMonth': 'dari bulan lalu',
    'dashboard.goalsCompleted': 'tujuan tercapai',
    'dashboard.noBudgets': 'Belum ada anggaran yang ditetapkan',
    'dashboard.noSavingsGoals': 'Belum ada tujuan tabungan',
    'dashboard.noTransactions': 'Belum ada transaksi',
    'dashboard.expensesByCategory': 'Pengeluaran per Kategori',
    'dashboard.incomeVsExpenses': 'Pemasukan vs Pengeluaran',
    'dashboard.monthlyTrend': 'Tren Bulanan',
    'dashboard.topCategories': 'Kategori Teratas',
    'dashboard.financialHealth': 'Kesehatan Keuangan',
    'dashboard.savingsRate': 'Tingkat Tabungan',
    'dashboard.budgetUtilization': 'Utilisasi Anggaran',
    
    // Transactions
    'transactions.title': 'Transaksi',
    'transactions.subtitle': 'Kelola pemasukan dan pengeluaran Anda',
    'transactions.addTransaction': 'Tambah Transaksi',
    'transactions.searchPlaceholder': 'Cari transaksi...',
    'transactions.allTypes': 'Semua Jenis',
    'transactions.allCategories': 'Semua Kategori',
    'transactions.noTransactions': 'Tidak ada transaksi ditemukan',
    'transactions.noTransactionsDesc': 'Coba sesuaikan pencarian atau filter Anda, atau tambahkan transaksi baru.',
    'transactions.addFirstTransaction': 'Tambah Transaksi Pertama',
    'transactions.deleteConfirm': 'Apakah Anda yakin ingin menghapus transaksi ini?',
    'transactions.addTransactionModal': 'Tambah Transaksi',
    'transactions.type': 'Jenis',
    'transactions.amount': 'Jumlah (Rp)',
    'transactions.description': 'Deskripsi',
    'transactions.category': 'Kategori',
    'transactions.date': 'Tanggal',
    'transactions.selectCategory': 'Pilih kategori',
    'transactions.enterDescription': 'Masukkan deskripsi transaksi',
    
    // Categories
    'categories.title': 'Kategori',
    'categories.subtitle': 'Atur transaksi dan template anggaran Anda',
    'categories.addCategory': 'Tambah Kategori',
    'categories.allCategories': 'Semua Kategori',
    'categories.income': 'Pemasukan',
    'categories.expense': 'Pengeluaran',
    'categories.noCategories': 'Tidak ada kategori ditemukan',
    'categories.noCategoriesDesc': 'Anda belum membuat kategori apapun.',
    'categories.addFirstCategory': 'Tambah Kategori Pertama',
    'categories.deleteConfirm': 'Apakah Anda yakin ingin menghapus kategori',
    'categories.cannotDelete': 'Kategori yang masih digunakan dalam transaksi atau anggaran tidak dapat dihapus.',
    'categories.budgetTemplate': 'Template Anggaran Bulanan:',
    'categories.budgetTemplateDesc': 'Atur anggaran default untuk kategori pengeluaran. Template ini akan digunakan untuk membuat anggaran bulanan baru secara otomatis di halaman Budget.',
    'categories.defaultBudget': 'Anggaran Default',
    'categories.notSet': 'Belum diatur',
    'categories.perMonth': 'per bulan',
    'categories.setBudget': 'Atur',
    'categories.editBudget': 'Edit',
    'categories.addCategoryModal': 'Tambah Kategori',
    'categories.categoryName': 'Nama Kategori',
    'categories.enterCategoryName': 'Masukkan nama kategori',
    'categories.color': 'Warna',
    'categories.preview': 'Preview',
    'categories.categoryNamePlaceholder': 'Nama Kategori',
    
    // Budget
    'budget.title': 'Anggaran',
    'budget.subtitle': 'Tetapkan dan pantau batas pengeluaran Anda',
    'budget.addBudget': 'Tambah Anggaran',
    'budget.totalBudgets': 'Total Anggaran',
    'budget.onTrack': 'Sesuai Target',
    'budget.overBudget': 'Melebihi Anggaran',
    'budget.noBudgets': 'Belum ada anggaran',
    'budget.noBudgetsDesc': 'Tetapkan batas pengeluaran untuk kategori Anda agar tetap sesuai dengan tujuan keuangan.',
    'budget.createFirst': 'Buat Anggaran Pertama',
    'budget.deleteConfirm': 'Apakah Anda yakin ingin menghapus anggaran ini?',
    'budget.autoReset': 'Reset Otomatis Anggaran:',
    'budget.autoResetDesc': 'Anggaran akan direset secara otomatis setiap awal periode (bulanan/mingguan). Pengeluaran dihitung ulang dari nol untuk periode baru, namun batas anggaran tetap sama.',
    'budget.refresh': 'Refresh',
    'budget.checkReset': 'Periksa dan reset periode anggaran',
    'budget.progress': 'Progress',
    'budget.spent': 'Terpakai',
    'budget.remaining': 'tersisa',
    'budget.exceeds': 'melebihi anggaran',
    'budget.period': 'Periode',
    'budget.monthly': 'Bulanan',
    'budget.weekly': 'Mingguan',
    'budget.selectCategory': 'Pilih kategori',
    'budget.budgetAmount': 'Jumlah Anggaran (Rp)',
    'budget.needCategories': 'Anda perlu membuat kategori pengeluaran terlebih dahulu.',
    
    // Savings Goals
    'savings.title': 'Tujuan Tabungan',
    'savings.subtitle': 'Tetapkan dan capai target keuangan Anda',
    'savings.addGoal': 'Tambah Tujuan',
    'savings.totalGoals': 'Total Tujuan',
    'savings.completed': 'Tercapai',
    'savings.totalTarget': 'Total Target',
    'savings.overallProgress': 'Progress Keseluruhan',
    'savings.activeGoals': 'Tujuan Aktif',
    'savings.completedGoals': 'Tujuan Tercapai',
    'savings.noGoals': 'Belum ada tujuan tabungan',
    'savings.noGoalsDesc': 'Mulai merencanakan masa depan keuangan Anda dengan menetapkan tujuan tabungan yang jelas dan terukur.',
    'savings.createFirst': 'Buat Tujuan Pertama',
    'savings.daysRemaining': 'hari lagi',
    'savings.today': 'Hari ini',
    'savings.daysLate': 'hari terlambat',
    'savings.contribute': 'Kontribusi',
    'savings.delete': 'Hapus',
    'savings.deleteConfirm': 'Apakah Anda yakin ingin menghapus tujuan',
    'savings.targetReached': 'Target tercapai',
    'savings.completedOn': 'Diselesaikan pada',
    'savings.addGoalModal': 'Tambah Tujuan Tabungan',
    'savings.goalName': 'Nama Tujuan',
    'savings.goalNamePlaceholder': 'Contoh: Liburan ke Bali, Dana Darurat, dll',
    'savings.description': 'Deskripsi (Opsional)',
    'savings.descriptionPlaceholder': 'Jelaskan tujuan tabungan Anda...',
    'savings.targetAmount': 'Target Jumlah (Rp)',
    'savings.targetDate': 'Tanggal Target',
    'savings.goalNameDefault': 'Nama Tujuan',
    'savings.target': 'Target:',
    'savings.deadline': 'Deadline:',
    
    // Reports
    'reports.title': 'Laporan Keuangan',
    'reports.subtitle': 'Analisis mendalam tentang pola keuangan Anda',
    'reports.exportData': 'Ekspor Data',
    'reports.startDate': 'Tanggal Mulai',
    'reports.endDate': 'Tanggal Akhir',
    'reports.reportType': 'Jenis Laporan',
    'reports.transactions': 'Transaksi',
    'reports.totalExpenses': 'Total Pengeluaran',
    'reports.totalIncome': 'Total Pemasukan',
    'reports.transactionCount': 'Jumlah Transaksi',
    'reports.averagePerTransaction': 'Rata-rata per Transaksi',
    'reports.expenseDistribution': 'Distribusi Pengeluaran per Kategori',
    'reports.incomeDistribution': 'Distribusi Pemasukan per Kategori',
    'reports.monthlyTrend': 'Tren Bulanan',
    'reports.categoryDetails': 'Detail per Kategori',
    'reports.category': 'Kategori',
    'reports.transactionCount': 'Jumlah Transaksi',
    'reports.totalAmount': 'Total Amount',
    'reports.percentage': 'Persentase',
    'reports.average': 'Rata-rata',
    'reports.noData': 'Tidak ada data',
    'reports.noDataDesc': 'Tidak ada transaksi ditemukan untuk periode dan jenis yang dipilih.',
    'reports.noDataAvailable': 'Tidak ada data untuk ditampilkan',
    'reports.unknownCategory': 'Kategori Tidak Dikenal',
    
    // Settings
    'settings.title': 'Pengaturan',
    'settings.subtitle': 'Kelola akun dan preferensi data Anda',
    'settings.accountInfo': 'Informasi Akun',
    'settings.accountDesc': 'Detail pribadi Anda',
    'settings.name': 'Nama',
    'settings.email': 'Email',
    'settings.memberSince': 'Anggota Sejak',
    'settings.unknown': 'Tidak diketahui',
    'settings.dataManagement': 'Manajemen Data',
    'settings.dataDesc': 'Ekspor atau kelola data keuangan Anda',
    'settings.exportData': 'Ekspor Data',
    'settings.exportDesc': 'Unduh semua transaksi, kategori, dan anggaran Anda',
    'settings.export': 'Ekspor',
    'settings.dangerZone': 'Zona Berbahaya',
    'settings.dangerDesc': 'Tindakan yang tidak dapat dibatalkan',
    'settings.deleteAllData': 'Hapus Semua Data',
    'settings.deleteAllDesc': 'Hapus permanen semua transaksi, kategori, dan anggaran Anda',
    'settings.deleteData': 'Hapus Data',
    'settings.logout': 'Keluar',
    'settings.logoutDesc': 'Keluar dari akun Anda',
    'settings.deleteConfirm': 'Apakah Anda yakin ingin menghapus semua data Anda? Tindakan ini tidak dapat dibatalkan.',
    'settings.dataDeleted': 'Semua data Anda telah dihapus.',
    'settings.exportError': 'Terjadi kesalahan saat mengekspor data.',
    'settings.deleteError': 'Terjadi kesalahan saat menghapus data.',
    
    // Common
    'common.loading': 'Memuat...',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.delete': 'Hapus',
    'common.edit': 'Edit',
    'common.add': 'Tambah',
    'common.close': 'Tutup',
    'common.confirm': 'Konfirmasi',
    'common.yes': 'Ya',
    'common.no': 'Tidak',
    'common.search': 'Cari',
    'common.filter': 'Filter',
    'common.all': 'Semua',
    'common.income': 'Pemasukan',
    'common.expense': 'Pengeluaran',
    'common.amount': 'Jumlah',
    'common.description': 'Deskripsi',
    'common.category': 'Kategori',
    'common.date': 'Tanggal',
    'common.total': 'Total',
    'common.remaining': 'Sisa',
    'common.progress': 'Progress',
    'common.target': 'Target',
    'common.current': 'Saat Ini',
    'common.monthly': 'Bulanan',
    'common.weekly': 'Mingguan',
    'common.daily': 'Harian',
    'common.yearly': 'Tahunan',
    'common.status': 'Status',
    'common.actions': 'Aksi',
    'common.preview': 'Preview',
    'common.saving': 'Menyimpan...',
    'common.creating': 'Membuat...',
    'common.updating': 'Mengupdate...',
    'common.deleting': 'Menghapus...',
    'common.processing': 'Memproses...',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transactions',
    'nav.categories': 'Categories',
    'nav.budgets': 'Budgets',
    'nav.savings': 'Savings Goals',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.loggedInAs': 'Logged in as',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Complete overview of your financial status',
    'dashboard.totalBalance': 'Total Balance',
    'dashboard.monthlyIncome': 'Monthly Income',
    'dashboard.monthlyExpenses': 'Monthly Expenses',
    'dashboard.savingsProgress': 'Savings Progress',
    'dashboard.cashFlow': 'Monthly Cash Flow',
    'dashboard.income': 'Income',
    'dashboard.expenses': 'Expenses',
    'dashboard.netCashFlow': 'Net Cash Flow',
    'dashboard.budgetStatus': 'Budget Status',
    'dashboard.savingsGoals': 'Savings Goals',
    'dashboard.recentTransactions': 'Recent Transactions',
    'dashboard.fromLastMonth': 'from last month',
    'dashboard.goalsCompleted': 'goals completed',
    'dashboard.noBudgets': 'No budgets set',
    'dashboard.noSavingsGoals': 'No savings goals',
    'dashboard.noTransactions': 'No transactions',
    'dashboard.expensesByCategory': 'Expenses by Category',
    'dashboard.incomeVsExpenses': 'Income vs Expenses',
    'dashboard.monthlyTrend': 'Monthly Trend',
    'dashboard.topCategories': 'Top Categories',
    'dashboard.financialHealth': 'Financial Health',
    'dashboard.savingsRate': 'Savings Rate',
    'dashboard.budgetUtilization': 'Budget Utilization',
    
    // Transactions
    'transactions.title': 'Transactions',
    'transactions.subtitle': 'Manage your income and expenses',
    'transactions.addTransaction': 'Add Transaction',
    'transactions.searchPlaceholder': 'Search transactions...',
    'transactions.allTypes': 'All Types',
    'transactions.allCategories': 'All Categories',
    'transactions.noTransactions': 'No transactions found',
    'transactions.noTransactionsDesc': 'Try adjusting your search or filters, or add a new transaction.',
    'transactions.addFirstTransaction': 'Add First Transaction',
    'transactions.deleteConfirm': 'Are you sure you want to delete this transaction?',
    'transactions.addTransactionModal': 'Add Transaction',
    'transactions.type': 'Type',
    'transactions.amount': 'Amount',
    'transactions.description': 'Description',
    'transactions.category': 'Category',
    'transactions.date': 'Date',
    'transactions.selectCategory': 'Select category',
    'transactions.enterDescription': 'Enter transaction description',
    
    // Categories
    'categories.title': 'Categories',
    'categories.subtitle': 'Organize your transactions and budget templates',
    'categories.addCategory': 'Add Category',
    'categories.allCategories': 'All Categories',
    'categories.income': 'Income',
    'categories.expense': 'Expense',
    'categories.noCategories': 'No categories found',
    'categories.noCategoriesDesc': 'You haven\'t created any categories yet.',
    'categories.addFirstCategory': 'Add First Category',
    'categories.deleteConfirm': 'Are you sure you want to delete category',
    'categories.cannotDelete': 'Categories still used in transactions or budgets cannot be deleted.',
    'categories.budgetTemplate': 'Monthly Budget Template:',
    'categories.budgetTemplateDesc': 'Set default budgets for expense categories. These templates will be used to automatically create new monthly budgets on the Budget page.',
    'categories.defaultBudget': 'Default Budget',
    'categories.notSet': 'Not set',
    'categories.perMonth': 'per month',
    'categories.setBudget': 'Set',
    'categories.editBudget': 'Edit',
    'categories.addCategoryModal': 'Add Category',
    'categories.categoryName': 'Category Name',
    'categories.enterCategoryName': 'Enter category name',
    'categories.color': 'Color',
    'categories.preview': 'Preview',
    'categories.categoryNamePlaceholder': 'Category Name',
    
    // Budget
    'budget.title': 'Budget',
    'budget.subtitle': 'Set and monitor your spending limits',
    'budget.addBudget': 'Add Budget',
    'budget.totalBudgets': 'Total Budgets',
    'budget.onTrack': 'On Track',
    'budget.overBudget': 'Over Budget',
    'budget.noBudgets': 'No budgets yet',
    'budget.noBudgetsDesc': 'Set spending limits for your categories to stay on track with your financial goals.',
    'budget.createFirst': 'Create First Budget',
    'budget.deleteConfirm': 'Are you sure you want to delete this budget?',
    'budget.autoReset': 'Automatic Budget Reset:',
    'budget.autoResetDesc': 'Budgets will be automatically reset at the beginning of each period (monthly/weekly). Spending is recalculated from zero for the new period, but budget limits remain the same.',
    'budget.refresh': 'Refresh',
    'budget.checkReset': 'Check and reset budget periods',
    'budget.progress': 'Progress',
    'budget.spent': 'Spent',
    'budget.remaining': 'remaining',
    'budget.exceeds': 'over budget',
    'budget.period': 'Period',
    'budget.monthly': 'Monthly',
    'budget.weekly': 'Weekly',
    'budget.selectCategory': 'Select category',
    'budget.budgetAmount': 'Budget Amount',
    'budget.needCategories': 'You need to create expense categories first.',
    
    // Savings Goals
    'savings.title': 'Savings Goals',
    'savings.subtitle': 'Set and achieve your financial targets',
    'savings.addGoal': 'Add Goal',
    'savings.totalGoals': 'Total Goals',
    'savings.completed': 'Completed',
    'savings.totalTarget': 'Total Target',
    'savings.overallProgress': 'Overall Progress',
    'savings.activeGoals': 'Active Goals',
    'savings.completedGoals': 'Completed Goals',
    'savings.noGoals': 'No savings goals yet',
    'savings.noGoalsDesc': 'Start planning your financial future by setting clear and measurable savings goals.',
    'savings.createFirst': 'Create First Goal',
    'savings.daysRemaining': 'days remaining',
    'savings.today': 'Today',
    'savings.daysLate': 'days late',
    'savings.contribute': 'Contribute',
    'savings.delete': 'Delete',
    'savings.deleteConfirm': 'Are you sure you want to delete goal',
    'savings.targetReached': 'Target reached',
    'savings.completedOn': 'Completed on',
    'savings.addGoalModal': 'Add Savings Goal',
    'savings.goalName': 'Goal Name',
    'savings.goalNamePlaceholder': 'e.g., Vacation to Bali, Emergency Fund, etc.',
    'savings.description': 'Description (Optional)',
    'savings.descriptionPlaceholder': 'Describe your savings goal...',
    'savings.targetAmount': 'Target Amount',
    'savings.targetDate': 'Target Date',
    'savings.goalNameDefault': 'Goal Name',
    'savings.target': 'Target:',
    'savings.deadline': 'Deadline:',
    
    // Reports
    'reports.title': 'Financial Reports',
    'reports.subtitle': 'Deep analysis of your financial patterns',
    'reports.exportData': 'Export Data',
    'reports.startDate': 'Start Date',
    'reports.endDate': 'End Date',
    'reports.reportType': 'Report Type',
    'reports.transactions': 'Transactions',
    'reports.totalExpenses': 'Total Expenses',
    'reports.totalIncome': 'Total Income',
    'reports.transactionCount': 'Transaction Count',
    'reports.averagePerTransaction': 'Average per Transaction',
    'reports.expenseDistribution': 'Expense Distribution by Category',
    'reports.incomeDistribution': 'Income Distribution by Category',
    'reports.monthlyTrend': 'Monthly Trend',
    'reports.categoryDetails': 'Category Details',
    'reports.category': 'Category',
    'reports.transactionCount': 'Transaction Count',
    'reports.totalAmount': 'Total Amount',
    'reports.percentage': 'Percentage',
    'reports.average': 'Average',
    'reports.noData': 'No data',
    'reports.noDataDesc': 'No transactions found for the selected period and type.',
    'reports.noDataAvailable': 'No data available to display',
    'reports.unknownCategory': 'Unknown Category',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account and data preferences',
    'settings.accountInfo': 'Account Information',
    'settings.accountDesc': 'Your personal details',
    'settings.name': 'Name',
    'settings.email': 'Email',
    'settings.memberSince': 'Member Since',
    'settings.unknown': 'Unknown',
    'settings.dataManagement': 'Data Management',
    'settings.dataDesc': 'Export or manage your financial data',
    'settings.exportData': 'Export Data',
    'settings.exportDesc': 'Download all your transactions, categories, and budgets',
    'settings.export': 'Export',
    'settings.dangerZone': 'Danger Zone',
    'settings.dangerDesc': 'Irreversible actions',
    'settings.deleteAllData': 'Delete All Data',
    'settings.deleteAllDesc': 'Permanently delete all your transactions, categories, and budgets',
    'settings.deleteData': 'Delete Data',
    'settings.logout': 'Logout',
    'settings.logoutDesc': 'Sign out of your account',
    'settings.deleteConfirm': 'Are you sure you want to delete all your data? This action cannot be undone.',
    'settings.dataDeleted': 'All your data has been deleted.',
    'settings.exportError': 'An error occurred while exporting data.',
    'settings.deleteError': 'An error occurred while deleting data.',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.income': 'Income',
    'common.expense': 'Expense',
    'common.amount': 'Amount',
    'common.description': 'Description',
    'common.category': 'Category',
    'common.date': 'Date',
    'common.total': 'Total',
    'common.remaining': 'Remaining',
    'common.progress': 'Progress',
    'common.target': 'Target',
    'common.current': 'Current',
    'common.monthly': 'Monthly',
    'common.weekly': 'Weekly',
    'common.daily': 'Daily',
    'common.yearly': 'Yearly',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.preview': 'Preview',
    'common.saving': 'Saving...',
    'common.creating': 'Creating...',
    'common.updating': 'Updating...',
    'common.deleting': 'Deleting...',
    'common.processing': 'Processing...',
  },
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedLanguage = localStorage.getItem('language') as Language;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    
    if (savedLanguage) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <ThemeContext.Provider value={{ theme, language, toggleTheme, setLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
};