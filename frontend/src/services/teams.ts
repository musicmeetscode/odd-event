import apiClient from "./api";
import type { Team } from "@/types/api";

export const teamsService = {
  listTeams: async (eventId: number) => {
    const response = await apiClient.get<Team[]>(`/events/${eventId}/teams/`);
    return response.data;
  },

  createTeam: async (eventId: number, name: string) => {
    const response = await apiClient.post<Team>(`/events/${eventId}/teams/`, { name });
    return response.data;
  },

  deleteTeam: async (eventId: number, teamId: number) => {
    await apiClient.delete(`/events/${eventId}/teams/${teamId}/`);
  },

  joinTeam: async (eventId: number, teamId: number) => {
    const response = await apiClient.post(`/events/${eventId}/teams/${teamId}/join/`);
    return response.data;
  },

  leaveTeam: async (eventId: number, teamId: number) => {
    const response = await apiClient.post(`/events/${eventId}/teams/${teamId}/leave/`);
    return response.data;
  },

  addMember: async (eventId: number, teamId: number, userId: number) => {
    const response = await apiClient.post(`/events/${eventId}/teams/${teamId}/add_member/`, {
      user_id: userId,
    });
    return response.data;
  },

  removeMember: async (eventId: number, teamId: number, userId: number) => {
    const response = await apiClient.post(`/events/${eventId}/teams/${teamId}/remove_member/`, {
      user_id: userId,
    });
    return response.data;
  },
};
