'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Merchant } from '@/types';
import { getProfile } from '@/services/auth';

interface AuthContextType {
  token: string | null;
  merchant: Merchant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, merchant: Merchant) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  merchant: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedMerchant = localStorage.getItem('merchant');
    if (storedToken) {
      setToken(storedToken);
      if (storedMerchant) {
        try {
          setMerchant(JSON.parse(storedMerchant));
        } catch {
          localStorage.removeItem('merchant');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newMerchant: Merchant) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('merchant', JSON.stringify(newMerchant));
    setToken(newToken);
    setMerchant(newMerchant);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('merchant');
    setToken(null);
    setMerchant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        merchant,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
