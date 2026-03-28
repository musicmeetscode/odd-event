import apiClient from "./api";
import type { EventAnalytics, Speaker, CertificateData } from "@/types/api";

export const adminService = {
  // Users
  listUsers: async (role?: string) => {
    const params = role ? { role } : {};
    const response = await apiClient.get("/users/", { params });
    return response.data;
  },

  createUser: async (data: {
    username: string;
    display_name?: string;
    password?: string;
    role?: string;
    email?: string;
  }) => {
    const response = await apiClient.post("/users/", data);
    return response.data;
  },

  updateUserRole: async (userId: number, role: string) => {
    const response = await apiClient.put(`/users/${userId}/`, { role });
    return response.data;
  },

  deleteUser: async (userId: number) => {
    const response = await apiClient.delete(`/users/${userId}/`);
    return response.data;
  },

  adminResetPassword: async (data: { user_id: number; new_password: string }) => {
    const response = await apiClient.post("/users/reset-password/", data);
    return response.data;
  },

  // Judging Criteria
  listCriteria: async (eventId: number) => {
    const response = await apiClient.get(`/events/${eventId}/criteria/`);
    return response.data;
  },

  createCriteria: async (
    eventId: number,
    data: { name: string; description?: string; max_score: number; weight: number }
  ) => {
    const response = await apiClient.post(`/events/${eventId}/criteria/`, data);
    return response.data;
  },

  updateCriteria: async (
    eventId: number,
    criteriaId: number,
    data: { name?: string; description?: string; max_score?: number; weight?: number }
  ) => {
    const response = await apiClient.patch(`/events/${eventId}/criteria/${criteriaId}/`, data);
    return response.data;
  },

  deleteCriteria: async (eventId: number, criteriaId: number) => {
    await apiClient.delete(`/events/${eventId}/criteria/${criteriaId}/`);
  },

  // Judge Assignments
  listJudges: async (eventId: number) => {
    const response = await apiClient.get(`/events/${eventId}/judges/`);
    return response.data;
  },

  assignJudge: async (eventId: number, judgeId: number) => {
    const response = await apiClient.post(`/events/${eventId}/judges/`, {
      judge_id: judgeId,
    });
    return response.data;
  },

  removeJudge: async (eventId: number, judgeId: number) => {
    await apiClient.delete(`/events/${eventId}/judges/`, {
      data: { judge_id: judgeId },
    });
  },

  // Event Attendees
  listAttendees: async (eventId: number) => {
    const response = await apiClient.get(`/events/${eventId}/attendees/`);
    return response.data;
  },

  updateAttendeeStatus: async (eventId: number, registrationId: number, status: string) => {
    const response = await apiClient.patch(`/events/${eventId}/attendees/`, {
      registration_id: registrationId,
      status,
    });
    return response.data;
  },

  removeAttendee: async (eventId: number, registrationId: number) => {
    const response = await apiClient.delete(`/events/${eventId}/attendees/`, {
      data: { registration_id: registrationId },
    });
    return response.data;
  },

  // Analytics
  getAnalytics: async (eventId: number) => {
    const response = await apiClient.get<EventAnalytics>(`/events/${eventId}/analytics/`);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await apiClient.get("/dashboard/stats/");
    return response.data;
  },

  // Export (returns download URL — browser opens it)
  getExportUrl: (eventId: number, type: string) => {
    const baseUrl = apiClient.defaults.baseURL || "";
    return `${baseUrl}/events/${eventId}/export/?type=${type}`;
  },

  // Speakers
  listSpeakers: async (eventId: number) => {
    const response = await apiClient.get<Speaker[]>(`/events/${eventId}/speakers/`);
    return response.data;
  },

  // Certificate
  getCertificate: async (eventId: number) => {
    const response = await apiClient.get<CertificateData>(`/events/${eventId}/certificate/`);
    return response.data;
  },

  // Profile
  getProfile: async () => {
    const response = await apiClient.get("/profile/");
    return response.data;
  },

  updateProfile: async (data: {
    display_name?: string;
    bio?: string;
    profession?: string;
    avatar_url?: string;
  }) => {
    const response = await apiClient.put("/profile/", data);
    return response.data;
  },

  releaseCertificates: async (eventId: number) => {
    const response = await apiClient.post(`/events/${eventId}/release_certificates/`);
    return response.data;
  },

  unreleaseCertificates: async (eventId: number) => {
    const response = await apiClient.post(`/events/${eventId}/unrelease_certificates/`);
    return response.data;
  },
};
