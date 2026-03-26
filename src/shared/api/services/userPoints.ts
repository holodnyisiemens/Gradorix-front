import { apiClient } from '../client';
import type { UserPoints } from '@shared/types';

interface UserPointsBackend {
  user_id: number;
  total_points: number;
  level: number;
  level_name: string;
  points_to_next_level: number;
  rank?: number | null;
}

function mapPoints(b: UserPointsBackend): UserPoints {
  return {
    userId: b.user_id,
    totalPoints: b.total_points,
    level: b.level,
    levelName: b.level_name,
    pointsToNextLevel: b.points_to_next_level,
    rank: b.rank ?? 0,
  };
}

export interface UserPointsCreateInput {
  user_id: number;
  total_points?: number;
  level?: number;
  level_name?: string;
  points_to_next_level?: number;
}

export const userPointsApi = {
  getLeaderboard: async (): Promise<UserPoints[]> => {
    const res = await apiClient.get<UserPointsBackend[]>('/user-points/leaderboard');
    return res.data.map(mapPoints);
  },

  getByUserId: async (userId: number): Promise<UserPoints> => {
    const res = await apiClient.get<UserPointsBackend>(`/user-points/${userId}`);
    return mapPoints(res.data);
  },

  create: async (data: UserPointsCreateInput): Promise<UserPoints> => {
    const res = await apiClient.post<UserPointsBackend>('/user-points/', data);
    return mapPoints(res.data);
  },

  update: async (userId: number, data: Partial<UserPointsCreateInput>): Promise<UserPoints> => {
    const res = await apiClient.patch<UserPointsBackend>(`/user-points/${userId}`, data);
    return mapPoints(res.data);
  },

  delete: async (userId: number): Promise<void> => {
    await apiClient.delete(`/user-points/${userId}`);
  },
};
