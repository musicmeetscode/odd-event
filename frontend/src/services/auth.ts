import apiClient from "./api";
import type { AuthResponse } from "@/types/api";

export const authService = {
  register: async (username: string, password: string, displayName?: string) => {
    const response = await apiClient.post<AuthResponse>("/auth/register/", {
      username,
      password,
      display_name: displayName || username,
    });
    return response.data;
  },

  login: async (username: string, password: string) => {
    const response = await apiClient.post<AuthResponse>("/auth/login/", {
      username,
      password,
    });
    return response.data;
  },

  logout: async () => {
    await apiClient.post("/auth/logout/");
  },

  me: async () => {
    const response = await apiClient.get("/auth/me/");
    return response.data;
  },

  resetPassword: async (newPassword: string) => {
    const response = await apiClient.post("/auth/reset-password/", {
      new_password: newPassword,
    });
    return response.data;
  },

  checkIn: async (eventId: number, name: string, email?: string, phone?: string) => {
    const response = await apiClient.post("/check-in/", {
      event_id: eventId,
      name,
      email: email || "",
      phone: phone || "",
    });
    return response.data;
  },
};
