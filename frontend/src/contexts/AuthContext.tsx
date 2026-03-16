import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/auth';

interface AuthContextType {
  token: string | null;
  username: string | null;
  isSpeaker: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, username: string, isSpeaker?: boolean) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('devfest-token');
    const savedUsername = localStorage.getItem('devfest-username');
    const savedIsSpeaker = localStorage.getItem('devfest-is-speaker') === 'true';
    
    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
      setIsSpeaker(savedIsSpeaker);
      console.log('🔐 Restored authentication state:', { username: savedUsername, isSpeaker: savedIsSpeaker });
    }
    
    // Set loading to false after checking localStorage
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUsername: string, speaker = false) => {
    // Save to localStorage
    localStorage.setItem('devfest-token', newToken);
    localStorage.setItem('devfest-username', newUsername);
    localStorage.setItem('devfest-is-speaker', String(speaker));
    
    // Update state
    setToken(newToken);
    setUsername(newUsername);
    setIsSpeaker(speaker);
    
    console.log('✅ User logged in:', { username: newUsername, isSpeaker: speaker });
  };

  const logout = async () => {
    try {
      // Call backend API to delete token from database
      await authService.logout();
      console.log('✅ Backend logout successful');
    } catch (error) {
      console.error('⚠️ Backend logout failed, clearing local state anyway:', error);
    } finally {
      // Always clear localStorage and state, even if backend call fails
      localStorage.removeItem('devfest-token');
      localStorage.removeItem('devfest-username');
      localStorage.removeItem('devfest-is-speaker');
      
      // Clear state
      setToken(null);
      setUsername(null);
      setIsSpeaker(false);
      
      console.log('👋 User logged out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        isSpeaker,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
