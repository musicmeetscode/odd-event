import apiClient from './api';
import { Question } from '@/types/api';

export const questionService = {
  /**
   * Get questions, optionally filtered by session
   * @param sessionId - Optional session ID to filter by
   * @returns Array of questions
   */
  getQuestions: async (sessionId?: number): Promise<Question[]> => {
    const params = sessionId ? { session: sessionId } : {};
    const response = await apiClient.get<Question[]>('/questions/', { params });
    return response.data;
  },

  /**
   * Submit a new question
   * @param sessionId - Session ID
   * @param content - Question content
   * @returns Created question
   */
  createQuestion: async (sessionId: number, content: string): Promise<Question> => {
    const response = await apiClient.post<Question>('/questions/', {
      session: sessionId,
      content,
    });
    return response.data;
  },

  /**
   * Mark a question as answered (speaker only)
   * @param questionId - Question ID
   * @param answerText - Optional answer text
   * @returns Updated question
   */
  markAnswered: async (questionId: number, answerText?: string): Promise<Question> => {
    const response = await apiClient.patch<Question>(`/questions/${questionId}/`, {
      is_answered: true,
      ...(answerText && { answer_text: answerText }),
    });
    return response.data;
  },
};
