import { apiClient } from '../client';
import type { Challenge, ChallengeStatus } from '@shared/types';

interface ChallengeBackend {
  id: number;
  title: string;
  description?: string;
  url?: string;
  status: ChallengeStatus;
  date?: string;
  max_points?: number;
}

function mapChallenge(b: ChallengeBackend): Challenge {
  return {
    id: b.id,
    title: b.title,
    description: b.description,
    url: b.url,
    status: b.status,
    date: b.date,
    maxPoints: b.max_points,
  };
}

export interface ChallengeCreateInput {
  title: string;
  description?: string;
  url?: string;
  status: ChallengeStatus;
  date?: string;
  max_points?: number;
}

export interface ChallengeUpdateInput {
  title?: string;
  description?: string;
  url?: string;
  status?: ChallengeStatus;
  date?: string;
  max_points?: number;
}

export const challengesApi = {
  getAll: async (): Promise<Challenge[]> => {
    const res = await apiClient.get<ChallengeBackend[]>('/challenges/');
    return res.data.map(mapChallenge);
  },

  getById: async (id: number): Promise<Challenge> => {
    const res = await apiClient.get<ChallengeBackend>(`/challenges/${id}`);
    return mapChallenge(res.data);
  },

  create: async (data: ChallengeCreateInput): Promise<Challenge> => {
    const res = await apiClient.post<ChallengeBackend>('/challenges/', data);
    return mapChallenge(res.data);
  },

  update: async (id: number, data: ChallengeUpdateInput): Promise<Challenge> => {
    const res = await apiClient.patch<ChallengeBackend>(`/challenges/${id}`, data);
    return mapChallenge(res.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/challenges/${id}`);
  },
};
