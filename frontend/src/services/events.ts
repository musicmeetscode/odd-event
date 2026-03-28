import apiClient from "./api";
import type { Event, EventRegistration, Session, Question, Submission } from "@/types/api";

export const eventsService = {
  // Events
  listEvents: async () => {
    const response = await apiClient.get<Event[]>("/events/");
    return response.data;
  },

  getEvent: async (id: number) => {
    const response = await apiClient.get<Event>(`/events/${id}/`);
    return response.data;
  },

  createEvent: async (data: Partial<Event>) => {
    const response = await apiClient.post<Event>("/events/", data);
    return response.data;
  },

  updateEvent: async (id: number, data: Partial<Event>) => {
    const response = await apiClient.put<Event>(`/events/${id}/`, data);
    return response.data;
  },

  patchEvent: async (id: number, data: Partial<Event>) => {
    const response = await apiClient.patch<Event>(`/events/${id}/`, data);
    return response.data;
  },

  deleteEvent: async (id: number) => {
    await apiClient.delete(`/events/${id}/`);
  },

  // Registration
  registerForEvent: async (eventId: number) => {
    const response = await apiClient.post<EventRegistration>(
      `/events/${eventId}/register/`
    );
    return response.data;
  },

  unregisterFromEvent: async (eventId: number) => {
    await apiClient.delete(`/events/${eventId}/register/`);
  },

  getMyEvents: async () => {
    const response = await apiClient.get<Event[]>("/my-events/");
    return response.data;
  },

  // Sessions (Q&A)
  getEventSessions: async (eventId: number) => {
    const response = await apiClient.get<Session[]>(
      `/events/${eventId}/sessions/`
    );
    return response.data;
  },

  createSession: async (eventId: number, data: Partial<Session>) => {
    const response = await apiClient.post<Session>(
      `/events/${eventId}/sessions/`,
      data
    );
    return response.data;
  },

  updateSession: async (eventId: number, sessionId: number, data: Partial<Session>) => {
    const response = await apiClient.put<Session>(
      `/events/${eventId}/sessions/${sessionId}/`,
      data
    );
    return response.data;
  },

  deleteSession: async (eventId: number, sessionId: number) => {
    await apiClient.delete(`/events/${eventId}/sessions/${sessionId}/`);
  },

  // Questions
  getQuestions: async (sessionId: number) => {
    const response = await apiClient.get<Question[]>("/questions/", {
      params: { session: sessionId },
    });
    return response.data;
  },

  postQuestion: async (sessionId: number, content: string) => {
    const response = await apiClient.post<Question>("/questions/", {
      session: sessionId,
      content,
    });
    return response.data;
  },

  // Submissions
  getSubmissions: async (eventId: number) => {
    const response = await apiClient.get<Submission[]>(
      `/events/${eventId}/submissions/`
    );
    return response.data;
  },

  getSubmission: async (eventId: number, submissionId: number) => {
    const response = await apiClient.get<Submission>(
      `/events/${eventId}/submissions/${submissionId}/`
    );
    return response.data;
  },

  createSubmission: async (
    eventId: number,
    data: { title: string; description: string; repo_url?: string; demo_url?: string; team?: number }
  ) => {
    const response = await apiClient.post<Submission>(
      `/events/${eventId}/submissions/`,
      data
    );
    return response.data;
  },

  // Leaderboard
  getLeaderboard: async (eventId: number) => {
    const response = await apiClient.get(`/events/${eventId}/leaderboard/`);
    return response.data;
  },
};
