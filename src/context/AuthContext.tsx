import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  apiClient,
  clearAuthSession,
  getStoredToken,
  getStoredUserJson,
  storeAuthSession,
} from '../api/client.ts';
import type { AuthUser } from '../types/index.ts';
import { useToast } from './ToastContext.tsx';

interface AuthContextValue {
  user: AuthUser | null;
  companyName: string;
  unreadNotifications: number;
  loading: boolean;
  login: (identifier: string, password: string, remember: boolean) => Promise<AuthUser>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = getStoredUserJson();
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });
  const [companyName, setCompanyName] = useState('Commission Tracker');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  const refreshMe = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/auth/me');
      setUser(res.data.user);
      setCompanyName(res.data.companyName || 'Commission Tracker');
      setUnreadNotifications(res.data.unreadNotifications || 0);
    } catch {
      clearAuthSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      showToast('Your session has expired. Please sign in again.', 'error');
    };
    window.addEventListener('lakshya:session-expired', handleExpired);
    return () => window.removeEventListener('lakshya:session-expired', handleExpired);
  }, [showToast]);

  const login = useCallback(async (identifier: string, password: string, remember: boolean) => {
    const res = await apiClient.post('/auth/login', { identifier, password });
    const { token, user: loggedUser } = res.data;
    storeAuthSession(token, JSON.stringify(loggedUser), remember);
    setUser(loggedUser);
    return loggedUser as AuthUser;
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setUnreadNotifications(0);
    showToast('Signed out successfully.', 'info');
  }, [showToast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        companyName,
        unreadNotifications,
        loading,
        login,
        logout,
        refreshMe,
        setUnreadNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
