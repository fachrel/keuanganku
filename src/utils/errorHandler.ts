export interface ErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  solution?: string;
}

export class AppError extends Error {
  code: string;
  userMessage: string;
  solution?: string;

  constructor(code: string, message: string, userMessage: string, solution?: string) {
    super(message);
    this.code = code;
    this.userMessage = userMessage;
    this.solution = solution;
    this.name = 'AppError';
  }
}

export const errorCodes = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_NOT_CONFIRMED: 'AUTH_EMAIL_NOT_CONFIRMED',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_INVALID_EMAIL: 'AUTH_INVALID_EMAIL',
  
  // Transaction errors
  TRANSACTION_INSUFFICIENT_BALANCE: 'TRANSACTION_INSUFFICIENT_BALANCE',
  TRANSACTION_INVALID_AMOUNT: 'TRANSACTION_INVALID_AMOUNT',
  TRANSACTION_CATEGORY_REQUIRED: 'TRANSACTION_CATEGORY_REQUIRED',
  
  // Budget errors
  BUDGET_INVALID_AMOUNT: 'BUDGET_INVALID_AMOUNT',
  BUDGET_CATEGORY_EXISTS: 'BUDGET_CATEGORY_EXISTS',
  
  // Account errors
  ACCOUNT_INSUFFICIENT_BALANCE: 'ACCOUNT_INSUFFICIENT_BALANCE',
  ACCOUNT_NAME_REQUIRED: 'ACCOUNT_NAME_REQUIRED',
  
  // General errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

export const getErrorDetails = (error: any, language: 'id' | 'en' = 'id'): ErrorDetails => {
  const translations = {
    id: {
      [errorCodes.AUTH_INVALID_CREDENTIALS]: {
        userMessage: 'Email atau kata sandi tidak valid',
        solution: 'Periksa kembali email dan kata sandi Anda'
      },
      [errorCodes.AUTH_EMAIL_NOT_CONFIRMED]: {
        userMessage: 'Email belum dikonfirmasi',
        solution: 'Periksa email Anda dan klik link konfirmasi'
      },
      [errorCodes.AUTH_USER_NOT_FOUND]: {
        userMessage: 'Akun tidak ditemukan',
        solution: 'Daftar akun baru atau periksa email Anda'
      },
      [errorCodes.AUTH_WEAK_PASSWORD]: {
        userMessage: 'Kata sandi terlalu lemah',
        solution: 'Gunakan minimal 6 karakter dengan kombinasi huruf dan angka'
      },
      [errorCodes.AUTH_EMAIL_ALREADY_EXISTS]: {
        userMessage: 'Email sudah terdaftar',
        solution: 'Gunakan email lain atau masuk dengan akun yang ada'
      },
      [errorCodes.AUTH_INVALID_EMAIL]: {
        userMessage: 'Format email tidak valid',
        solution: 'Masukkan alamat email yang benar'
      },
      [errorCodes.TRANSACTION_INSUFFICIENT_BALANCE]: {
        userMessage: 'Saldo tidak mencukupi',
        solution: 'Tambah saldo atau kurangi jumlah transaksi'
      },
      [errorCodes.TRANSACTION_INVALID_AMOUNT]: {
        userMessage: 'Jumlah transaksi tidak valid',
        solution: 'Masukkan jumlah yang lebih besar dari 0'
      },
      [errorCodes.TRANSACTION_CATEGORY_REQUIRED]: {
        userMessage: 'Kategori harus dipilih',
        solution: 'Pilih kategori untuk transaksi ini'
      },
      [errorCodes.BUDGET_INVALID_AMOUNT]: {
        userMessage: 'Jumlah anggaran tidak valid',
        solution: 'Masukkan jumlah anggaran yang valid'
      },
      [errorCodes.ACCOUNT_INSUFFICIENT_BALANCE]: {
        userMessage: 'Saldo akun tidak mencukupi',
        solution: 'Pilih akun lain atau tambah saldo'
      },
      [errorCodes.NETWORK_ERROR]: {
        userMessage: 'Koneksi bermasalah',
        solution: 'Periksa koneksi internet Anda'
      },
      [errorCodes.UNKNOWN_ERROR]: {
        userMessage: 'Terjadi kesalahan tidak terduga',
        solution: 'Coba lagi dalam beberapa saat'
      }
    },
    en: {
      [errorCodes.AUTH_INVALID_CREDENTIALS]: {
        userMessage: 'Invalid email or password',
        solution: 'Please check your email and password'
      },
      [errorCodes.AUTH_EMAIL_NOT_CONFIRMED]: {
        userMessage: 'Email not confirmed',
        solution: 'Check your email and click the confirmation link'
      },
      [errorCodes.AUTH_USER_NOT_FOUND]: {
        userMessage: 'Account not found',
        solution: 'Create a new account or check your email'
      },
      [errorCodes.AUTH_WEAK_PASSWORD]: {
        userMessage: 'Password too weak',
        solution: 'Use at least 6 characters with letters and numbers'
      },
      [errorCodes.AUTH_EMAIL_ALREADY_EXISTS]: {
        userMessage: 'Email already registered',
        solution: 'Use a different email or sign in with existing account'
      },
      [errorCodes.AUTH_INVALID_EMAIL]: {
        userMessage: 'Invalid email format',
        solution: 'Enter a valid email address'
      },
      [errorCodes.TRANSACTION_INSUFFICIENT_BALANCE]: {
        userMessage: 'Insufficient balance',
        solution: 'Add funds or reduce transaction amount'
      },
      [errorCodes.TRANSACTION_INVALID_AMOUNT]: {
        userMessage: 'Invalid transaction amount',
        solution: 'Enter an amount greater than 0'
      },
      [errorCodes.TRANSACTION_CATEGORY_REQUIRED]: {
        userMessage: 'Category is required',
        solution: 'Select a category for this transaction'
      },
      [errorCodes.BUDGET_INVALID_AMOUNT]: {
        userMessage: 'Invalid budget amount',
        solution: 'Enter a valid budget amount'
      },
      [errorCodes.ACCOUNT_INSUFFICIENT_BALANCE]: {
        userMessage: 'Account balance insufficient',
        solution: 'Choose another account or add funds'
      },
      [errorCodes.NETWORK_ERROR]: {
        userMessage: 'Connection problem',
        solution: 'Check your internet connection'
      },
      [errorCodes.UNKNOWN_ERROR]: {
        userMessage: 'An unexpected error occurred',
        solution: 'Please try again in a moment'
      }
    }
  };

  // Handle Supabase auth errors
  if (error?.message) {
    if (error.message.includes('Invalid login credentials')) {
      return {
        code: errorCodes.AUTH_INVALID_CREDENTIALS,
        message: error.message,
        ...translations[language][errorCodes.AUTH_INVALID_CREDENTIALS]
      };
    }
    if (error.message.includes('Email not confirmed')) {
      return {
        code: errorCodes.AUTH_EMAIL_NOT_CONFIRMED,
        message: error.message,
        ...translations[language][errorCodes.AUTH_EMAIL_NOT_CONFIRMED]
      };
    }
    if (error.message.includes('User not found')) {
      return {
        code: errorCodes.AUTH_USER_NOT_FOUND,
        message: error.message,
        ...translations[language][errorCodes.AUTH_USER_NOT_FOUND]
      };
    }
    if (error.message.includes('Password should be at least')) {
      return {
        code: errorCodes.AUTH_WEAK_PASSWORD,
        message: error.message,
        ...translations[language][errorCodes.AUTH_WEAK_PASSWORD]
      };
    }
    if (error.message.includes('User already registered')) {
      return {
        code: errorCodes.AUTH_EMAIL_ALREADY_EXISTS,
        message: error.message,
        ...translations[language][errorCodes.AUTH_EMAIL_ALREADY_EXISTS]
      };
    }
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      solution: error.solution
    };
  }

  // Default unknown error
  return {
    code: errorCodes.UNKNOWN_ERROR,
    message: error?.message || 'Unknown error',
    ...translations[language][errorCodes.UNKNOWN_ERROR]
  };
};

export const logError = (error: any, context?: string) => {
  const errorDetails = getErrorDetails(error);
  console.error(`[${errorDetails.code}] ${context || 'Error'}:`, {
    message: errorDetails.message,
    userMessage: errorDetails.userMessage,
    solution: errorDetails.solution,
    timestamp: new Date().toISOString(),
    stack: error?.stack
  });
};