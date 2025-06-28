import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { supabase } from '../lib/supabase';
import { getErrorDetails, logError, errorCodes } from '../utils/errorHandler';
import { useToast } from './ToastContext';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan dalam AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { error: showError, success: showSuccess } = useToast();

  useEffect(() => {
    // Periksa sesi yang ada
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          created_at: session.user.created_at || new Date().toISOString(),
        });
      }
      setLoading(false);
    });

    // Dengarkan perubahan auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          created_at: session.user.created_at || new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 6) {
      return {
        isValid: false,
        message: 'Kata sandi harus minimal 6 karakter'
      };
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return {
        isValid: false,
        message: 'Kata sandi harus mengandung huruf'
      };
    }
    return { isValid: true };
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Validate input
      if (!validateEmail(email)) {
        const errorDetails = getErrorDetails({ code: errorCodes.AUTH_INVALID_EMAIL });
        showError(errorDetails.userMessage, errorDetails.solution);
        return false;
      }

      if (!password) {
        showError('Kata sandi diperlukan', 'Masukkan kata sandi Anda');
        return false;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        const errorDetails = getErrorDetails(error);
        logError(error, 'Login attempt');
        showError(errorDetails.userMessage, errorDetails.solution);
        return false;
      }
      
      showSuccess('Berhasil masuk', 'Selamat datang kembali!');
      return true;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logError(error, 'Login error');
      showError(errorDetails.userMessage, errorDetails.solution);
      return false;
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // Validate input
      if (!name.trim()) {
        showError('Nama diperlukan', 'Masukkan nama lengkap Anda');
        return false;
      }

      if (!validateEmail(email)) {
        const errorDetails = getErrorDetails({ code: errorCodes.AUTH_INVALID_EMAIL });
        showError(errorDetails.userMessage, errorDetails.solution);
        return false;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        showError('Kata sandi tidak valid', passwordValidation.message);
        return false;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });
      
      if (error) {
        const errorDetails = getErrorDetails(error);
        logError(error, 'Signup attempt');
        showError(errorDetails.userMessage, errorDetails.solution);
        return false;
      }
      
      showSuccess('Akun berhasil dibuat', 'Selamat datang di KeuanganKu!');
      return true;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logError(error, 'Signup error');
      showError(errorDetails.userMessage, errorDetails.solution);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      showSuccess('Berhasil keluar', 'Sampai jumpa lagi!');
      // Navigation will be handled by the auth state change
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logError(error, 'Logout error');
      showError(errorDetails.userMessage, errorDetails.solution);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        const errorDetails = getErrorDetails(error);
        logError(error, 'Google login attempt');
        showError(errorDetails.userMessage, errorDetails.solution);
      }
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logError(error, 'Google login error');
      showError(errorDetails.userMessage, errorDetails.solution);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};