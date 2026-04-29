import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../utils/types';
import api from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateTheme: (theme: 'light' | 'dark') => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sn_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('sn_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          applyTheme(res.data.user.theme);
        } catch {
          localStorage.removeItem('sn_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const applyTheme = (theme: 'light' | 'dark') => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('sn_token', t);
    setToken(t);
    setUser(u);
    applyTheme(u.theme);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('sn_token', t);
    setToken(t);
    setUser(u);
    applyTheme(u.theme);
  };

  const logout = () => {
    localStorage.removeItem('sn_token');
    setToken(null);
    setUser(null);
  };

  const updateTheme = async (theme: 'light' | 'dark') => {
    applyTheme(theme);
    setUser(prev => prev ? { ...prev, theme } : null);
    await api.patch('/auth/theme', { theme });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateTheme, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
