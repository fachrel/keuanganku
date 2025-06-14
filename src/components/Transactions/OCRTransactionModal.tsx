import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Camera, FileText, Loader, CheckCircle, AlertTriangle, Eye, EyeOff, Settings } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useAccounts } from '../../hooks/useAccounts';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRupiah } from '../../utils/currency';
import { geminiAI, type OCRResponse } from '../../services/geminiAI';

interface OCRTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OCRTransactionModal: React.FC<OCRTransactionModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, categories, loadTransactions } = useTransactions();
  const { accounts } = useAccounts();
  const { user } = useAuth();
  const { error: showError, success: showSuccess, warning: showWarning, info: showInfo } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<OCRResponse | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    account_id: '',
  });

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Check Gemini AI configuration
  const configStatus = geminiAI.getConfigStatus();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = geminiAI.validateImage(file);
    if (!validation.isValid) {
      showError('File tidak valid', validation.error || 'Format file tidak didukung');
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;

    if (!configStatus.isConfigured) {
      showError(
        'Gemini AI belum dikonfigurasi',
        'Silakan tambahkan VITE_GEMINI_API_KEY ke environment variables'
      );
      setShowConfig(true);
      return;
    }

    setIsProcessing(true);
    try {
      showInfo('Memproses gambar...', 'AI sedang menganalisis receipt Anda');
      
      const result = await geminiAI.extractTransactionData(selectedFile, categories);
      setExtractedData(result);
      
      // Pre-fill form with extracted data
      setFormData({
        amount: result.amount.toString(),
        description: result.description,
        category_id: result.suggestedCategory?.id || '',
        type: 'expense',
        date: result.date,
        account_id: '',
      });

      if (result.uncertainties.length > 0) {
        showWarning(
          'Beberapa data perlu verifikasi',
          `${result.uncertainties.length} field memerlukan pengecekan manual`
        );
      } else {
        showSuccess('Gambar berhasil diproses', `Confidence: ${result.confidence}%`);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memproses gambar';
      showError('Gagal memproses gambar', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!user || !extractedData) return;

    if (!formData.amount || !formData.description || !formData.category_id) {
      showError('Data tidak lengkap', 'Pastikan semua field wajib telah diisi');
      return;
    }

    try {
      await addTransaction({
        amount: parseFloat(formData.amount),
        description: formData.description,
        category_id: formData.category_id,
        type: formData.type,
        date: formData.date,
        user_id: user.id,
        account_id: formData.account_id || null,
      });

      await loadTransactions();
      showSuccess('Transaksi berhasil ditambahkan', 'Data dari OCR telah disimpan');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      showError('Gagal menambahkan transaksi', 'Silakan coba lagi');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setShowRawText(false);
    setFormData({
      amount: '',
      description: '',
      category_id: '',
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      account_id: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-container"
      onClick={handleBackdropClick}
    >
      <div className="modal-content max-w-6xl w-full">
        <div className="modal-header">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              OCR Transaction Recognition
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upload receipts, bills, or invoices to automatically extract transaction data
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Configuration"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Panel */}
        {showConfig && (
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Gemini AI Configuration
            </h3>
            
            {configStatus.isConfigured ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-200">
                    Gemini AI is properly configured
                  </span>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                  You can now use OCR to extract transaction data from images.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium text-yellow-900 dark:text-yellow-200">
                    Configuration Required
                  </span>
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
                  <p>Missing environment variables:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {configStatus.missingConfig.map((config) => (
                      <li key={config} className="font-mono">{config}</li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded border">
                    <p className="font-medium mb-2">Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Get a Gemini API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google AI Studio</a></li>
                      <li>Add <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">VITE_GEMINI_API_KEY=your_api_key</code> to your .env file</li>
                      <li>Restart the development server</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="modal-body overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Column - Image Upload & Preview */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Upload Receipt/Invoice
                </h3>
                
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    <Upload className="w-8 sm:w-12 h-8 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      JPG, PNG, PDF up to 10MB
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                      Minimum resolution: 300x300 pixels
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {previewUrl && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Receipt preview"
                          className="w-full h-60 sm:h-80 object-contain bg-gray-50 dark:bg-gray-700"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={resetForm}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {!extractedData && (
                      <button
                        onClick={handleProcessImage}
                        disabled={isProcessing || !configStatus.isConfigured}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Processing with AI...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-5 h-5" />
                            <span>Analyze with AI</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Extracted Data Display */}
              {extractedData && (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-900 dark:text-green-200">
                        AI Analysis Complete
                      </span>
                      <span className="text-sm text-green-700 dark:text-green-300">
                        ({extractedData.confidence}% confidence)
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-green-800 dark:text-green-200">Amount:</span>
                        <p className="font-medium text-green-900 dark:text-green-100">
                          {formatRupiah(extractedData.amount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-green-800 dark:text-green-200">Date:</span>
                        <p className="font-medium text-green-900 dark:text-green-100">
                          {new Date(extractedData.date).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <span className="text-green-800 dark:text-green-200">Merchant:</span>
                        <p className="font-medium text-green-900 dark:text-green-100">
                          {extractedData.merchant || 'Not detected'}
                        </p>
                      </div>
                      {extractedData.suggestedCategory && (
                        <div>
                          <span className="text-green-800 dark:text-green-200">Category:</span>
                          <p className="font-medium text-green-900 dark:text-green-100">
                            {extractedData.suggestedCategory.name} ({extractedData.suggestedCategory.confidence}%)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {extractedData.uncertainties.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <span className="font-medium text-yellow-900 dark:text-yellow-200">
                          Needs Verification
                        </span>
                      </div>
                      <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                        {extractedData.uncertainties.map((uncertainty, index) => (
                          <li key={index}>• {uncertainty}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {extractedData.rawText && (
                    <div>
                      <button
                        onClick={() => setShowRawText(!showRawText)}
                        className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        {showRawText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span>{showRawText ? 'Hide' : 'Show'} Raw Text</span>
                      </button>
                      {showRawText && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {extractedData.rawText}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Transaction Form */}
            {extractedData && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Verify & Submit Transaction
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Transaction Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'expense' })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.type === 'expense'
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'income' })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.type === 'income'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        Income
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select category</option>
                      {categories
                        .filter(cat => cat.type === formData.type)
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                            {extractedData.suggestedCategory?.id === category.id && ' (AI Suggested)'}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account (Optional)
                    </label>
                    <select
                      value={formData.account_id}
                      onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">No account selected</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({formatRupiah(account.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with action buttons */}
        {extractedData && (
          <div className="modal-footer">
            <button
              onClick={resetForm}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSubmitTransaction}
              className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200"
            >
              Add Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OCRTransactionModal;