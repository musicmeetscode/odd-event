import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authService } from '@/services/auth';
import { brand } from '@/config/brandConfig';
import type { UserRole } from '@/types/api';

interface AuthContextType {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, username: string, role: UserRole) => void;
  loginWithGoogle: (credential: string, eventId?: string | number) => Promise<import('@/types/api').AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('events-token');
    const savedUsername = localStorage.getItem('events-username');
    const savedRole = localStorage.getItem('events-role') as UserRole | null;

    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
      setRole(savedRole);
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

  const login = (newToken: string, newUsername: string, newRole: UserRole) => {
    localStorage.setItem('events-token', newToken);
    localStorage.setItem('events-username', newUsername);
    localStorage.setItem('events-role', newRole);

    setToken(newToken);
    setUsername(newUsername);
    setRole(newRole);
  };

  const loginWithGoogle = async (credential: string, eventId?: string | number) => {
    const data = await authService.googleLogin(credential, eventId);
    login(data.token, data.username, data.role);
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

      setToken(null);
      setUsername(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        role,
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
