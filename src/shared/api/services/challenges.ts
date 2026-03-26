import { apiClient } from '../client';
import type { Challenge, ChallengeStatus } from '@shared/types';

export interface ChallengeCreateInput {
  title: string;
  description?: string;
  url?: string;
  status: ChallengeStatus;
  date?: string;
}

export interface ChallengeUpdateInput {
  title?: string;
  description?: string;
  url?: string;
  status?: ChallengeStatus;
  date?: string;
}

export const challengesApi = {
  getAll: async (): Promise<Challenge[]> => {
    const res = await apiClient.get<Challenge[]>('/challenges/');
    return res.data;
  },

  getById: async (id: number): Promise<Challenge> => {
    const res = await apiClient.get<Challenge>(`/challenges/${id}`);
    return res.data;
  },

  create: async (data: ChallengeCreateInput): Promise<Challenge> => {
    const res = await apiClient.post<Challenge>('/challenges/', data);
    return res.data;
  },

  update: async (id: number, data: ChallengeUpdateInput): Promise<Challenge> => {
    const res = await apiClient.patch<Challenge>(`/challenges/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/challenges/${id}`);
  },
};
