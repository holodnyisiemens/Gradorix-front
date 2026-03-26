import { apiClient } from '../client';
import type { ChallengeJunior, ChallengeJuniorProgress } from '@shared/types';

export interface ChallengeJuniorCreateInput {
  challenge_id: number;
  junior_id: number;
  assigned_by: number;
  progress?: ChallengeJuniorProgress;
}

export interface ChallengeJuniorUpdateInput {
  progress?: ChallengeJuniorProgress;
}

export const challengeJuniorApi = {
  getAll: async (params?: { junior_id?: number; assigned_by?: number }): Promise<ChallengeJunior[]> => {
    const res = await apiClient.get<ChallengeJunior[]>('/challenge-junior/', { params });
    return res.data;
  },

  getOne: async (challengeId: number, juniorId: number): Promise<ChallengeJunior> => {
    const res = await apiClient.get<ChallengeJunior>(`/challenge-junior/${challengeId}/${juniorId}`);
    return res.data;
  },

  create: async (data: ChallengeJuniorCreateInput): Promise<ChallengeJunior> => {
    const res = await apiClient.post<ChallengeJunior>('/challenge-junior/', data);
    return res.data;
  },

  update: async (challengeId: number, juniorId: number, data: ChallengeJuniorUpdateInput): Promise<ChallengeJunior> => {
    const res = await apiClient.patch<ChallengeJunior>(`/challenge-junior/${challengeId}/${juniorId}`, data);
    return res.data;
  },

  delete: async (challengeId: number, juniorId: number): Promise<void> => {
    await apiClient.delete(`/challenge-junior/${challengeId}/${juniorId}`);
  },
};
