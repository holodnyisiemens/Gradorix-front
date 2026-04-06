import { apiClient } from '../client';
import type { Achievement } from '@shared/types';
import type { AchievementBase } from './achievements';

export interface UserAchievementRecord {
  user_id: number;
  achievement_id: number;
  earned_at?: string | null;
}

export interface UserAchievementCreateInput {
  user_id: number;
  achievement_id: number;
  earned_at?: string;
}

export const userAchievementsApi = {
  getAll: async (params?: { user_id?: number }): Promise<UserAchievementRecord[]> => {
    const res = await apiClient.get<UserAchievementRecord[]>('/user-achievements/', { params });
    return res.data;
  },

  getOne: async (userId: number, achievementId: number): Promise<UserAchievementRecord> => {
    const res = await apiClient.get<UserAchievementRecord>(`/user-achievements/${userId}/${achievementId}`);
    return res.data;
  },

  create: async (data: UserAchievementCreateInput): Promise<UserAchievementRecord> => {
    const payload = {
      ...data,
      // backend expects date-only format YYYY-MM-DD, not full ISO string
      earned_at: data.earned_at
        ? data.earned_at.split('T')[0]
        : new Date().toISOString().split('T')[0],
    };
    const res = await apiClient.post<UserAchievementRecord>('/user-achievements/', payload);
    return res.data;
  },

  delete: async (userId: number, achievementId: number): Promise<void> => {
    await apiClient.delete(`/user-achievements/${userId}/${achievementId}`);
  },

  // Helper: merge achievements list with user's earned status
  mergeWithUser: (
    achievements: AchievementBase[],
    userAchievements: UserAchievementRecord[]
  ): Achievement[] => {
    const earnedMap = new Map(userAchievements.map((ua) => [ua.achievement_id, ua.earned_at]));
    return achievements.map((a) => ({
      ...a,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id) ?? undefined,
    }));
  },
};
