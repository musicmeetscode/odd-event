import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authService } from '@/services/auth';
import { brand } from '@/config/brandConfig';
import type { UserRole } from '@/types/api';

interface AuthContextType {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  userId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, username: string, role: UserRole, userId: number) => void;
  loginWithGoogle: (credential: string, eventId?: string | number) => Promise<import('@/types/api').AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('events-token');
    const savedUsername = localStorage.getItem('events-username');
    const savedRole = localStorage.getItem('events-role') as UserRole | null;
    const savedUserId = localStorage.getItem('events-userId');

    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
      setRole(savedRole);
      setUserId(savedUserId ? Number(savedUserId) : null);
    }

    setIsLoading(false);
  }, []);

  // Inject brand colors into CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', brand.colors.primary);
    root.style.setProperty('--brand-accent', brand.colors.accent);
    root.style.setProperty('--brand-surface', brand.colors.surface || "#FFFFFF");
    root.style.setProperty('--brand-border', brand.colors.border || "#E2E8F0");
  }, []);

  const login = (newToken: string, newUsername: string, newRole: UserRole, newUserId: number) => {
    localStorage.setItem('events-token', newToken);
    localStorage.setItem('events-username', newUsername);
    localStorage.setItem('events-role', newRole);
    localStorage.setItem('events-userId', String(newUserId));

    setToken(newToken);
    setUsername(newUsername);
    setRole(newRole);
    setUserId(newUserId);
  };

  const loginWithGoogle = async (credential: string, eventId?: string | number) => {
    const data = await authService.googleLogin(credential, eventId);
    login(data.token, data.username, data.role, data.user_id);
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed with local cleanup even if server call fails
    } finally {
      localStorage.removeItem('events-token');
      localStorage.removeItem('events-username');
      localStorage.removeItem('events-role');
      localStorage.removeItem('events-userId');

      setToken(null);
      setUsername(null);
      setRole(null);
      setUserId(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        role,
        userId,
        isAuthenticated: !!token,
        isLoading,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
