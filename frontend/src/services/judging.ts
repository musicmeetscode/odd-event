import apiClient from "./api";
import type { JudgeDashboardEvent, Submission, Score } from "@/types/api";

export const judgingService = {
  getDashboard: async () => {
    const response = await apiClient.get<JudgeDashboardEvent[]>(
      "/judge/dashboard/"
    );
    return response.data;
  },

  getSubmissions: async (eventId: string | number) => {
    const response = await apiClient.get<Submission[]>(
      `/events/${eventId}/submissions/`,
      { params: { judging: 'true' } }
    );
    return response.data;
  },

  getSubmissionDetail: async (eventId: string | number, submissionId: number) => {
    const response = await apiClient.get<Submission>(
      `/events/${eventId}/submissions/${submissionId}/`
    );
    return response.data;
  },

  submitScores: async (
    submissionId: number,
    scores: { criteria: number; score: number; comment?: string }[]
  ) => {
    const response = await apiClient.post("/judge/score/", {
      submission: submissionId,
      scores,
    });
    return response.data;
  },
};
