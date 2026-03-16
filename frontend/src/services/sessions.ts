import apiClient from './api';
import { Session } from '@/types/api';

export const sessionService = {
  /**
   * Get all sessions
   * @returns Array of sessions
   */
  getAllSessions: async (): Promise<Session[]> => {
    const response = await apiClient.get<Session[]>('/sessions/');
    return response.data;
  },

  /**
   * Get a single session by ID
   * @param id - Session ID
   * @returns Session details
   */
  getSession: async (id: number): Promise<Session> => {
    const response = await apiClient.get<Session>(`/sessions/${id}/`);
    return response.data;
  },

  /**
   * Create a new session (speakers only)
   * @param data - Session data
   * @returns Created session
   */
  createSession: async (data: Partial<Session>): Promise<Session> => {
    const response = await apiClient.post<Session>('/sessions/', data);
    return response.data;
  },
};
