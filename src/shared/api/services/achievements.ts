import { apiClient } from '../client';

export interface AchievementBase {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'challenge' | 'streak' | 'social' | 'special';
  xp: number;
}

export interface AchievementCreateInput {
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'challenge' | 'streak' | 'social' | 'special';
  xp?: number;
}

export const achievementsApi = {
  getAll: async (): Promise<AchievementBase[]> => {
    const res = await apiClient.get<AchievementBase[]>('/achievements/');
    return res.data;
  },

  getById: async (id: number): Promise<AchievementBase> => {
    const res = await apiClient.get<AchievementBase>(`/achievements/${id}`);
    return res.data;
  },

  create: async (data: AchievementCreateInput): Promise<AchievementBase> => {
    const res = await apiClient.post<AchievementBase>('/achievements/', data);
    return res.data;
  },

  update: async (id: number, data: Partial<AchievementCreateInput>): Promise<AchievementBase> => {
    const res = await apiClient.patch<AchievementBase>(`/achievements/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/achievements/${id}`);
  },
};
