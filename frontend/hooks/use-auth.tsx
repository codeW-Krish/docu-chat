'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginData, RegisterData } from '@/types/index';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerInit: (name: string, email: string, password: string) => Promise<{ registration_token: string }>;
  registerComplete: (otp: string, registrationToken: string) => Promise<User>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<string>;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          // Clear invalid stored data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await api.login({ email, password });

      if (authResponse.success) {
        setUser(authResponse.user);
        localStorage.setItem('token', authResponse.token);
        localStorage.setItem('refreshToken', authResponse.refreshToken);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
      } else {
        throw new Error(authResponse.message);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await api.register({
        name,
        email,
        password,
        password_confirmation: password
      });

      if (authResponse.success) {
        setUser(authResponse.user);
        localStorage.setItem('token', authResponse.token);
        localStorage.setItem('refreshToken', authResponse.refreshToken);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
      } else {
        throw new Error(authResponse.message);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || '';
      await api.logout(refreshToken);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  };

  const registerInit = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.registerInit({ name, email, password });
      return data; // { registration_token }
    } catch (error: any) {
      console.error('Registration init error:', error);
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerComplete = async (otp: string, registrationToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authResponse = await api.registerComplete({
        otp,
        registration_token: registrationToken
      });

      if (authResponse.success) {
        setUser(authResponse.user);
        localStorage.setItem('token', authResponse.token);
        localStorage.setItem('refreshToken', authResponse.refreshToken);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
        return authResponse.user;
      } else {
        throw new Error(authResponse.message);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.forgotPassword(email);
      return response.message;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setError(error.message || 'Failed to send reset link');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.resetPassword(token, password);
      return response.message;
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message || 'Failed to reset password');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isLoading,
    isInitializing,
    login,
    register,
    registerInit,
    registerComplete,
    forgotPassword,
    resetPassword,
    logout,
    isAuthenticated: !!user,
    error,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
