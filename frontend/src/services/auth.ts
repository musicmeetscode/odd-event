import apiClient from './api';
import { AuthResponse } from '@/types/api';

export const authService = {
  /**
   * Register an audience member with username and password
   * @param username - User's chosen username
   * @param password - User's password
   * @param displayName - Optional display name (defaults to username)
   * @returns Token, username, and user info
   */
  registerAudience: async (username: string, password: string, displayName?: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register-audience/', { 
      username, 
      password,
      display_name: displayName || username
    });
    return response.data;
  },

  /**
   * Login as an audience member
   * @param username - Audience username
   * @param password - Audience password
   * @returns Token, username, and user info
   */
  loginAudience: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login-audience/', { 
      username, 
      password 
    });
    return response.data;
  },

  /**
   * Login as a speaker with credentials
   * @param username - Speaker username
   * @param password - Speaker password
   * @returns Token, username, and speaker status
   */
  loginSpeaker: async (username: string,): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/speakers/login/', { 
      username, 
    });
    return response.data;
  },

  /**
   * Logout and delete the authentication token
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout/');
  },
};
