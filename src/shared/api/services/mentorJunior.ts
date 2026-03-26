import { apiClient } from '../client';
import type { MentorJunior } from '@shared/types';

export interface MentorJuniorCreateInput {
  mentor_id: number;
  junior_id: number;
  assigned_by: number;
}

export const mentorJuniorApi = {
  getAll: async (params?: { mentor_id?: number; junior_id?: number }): Promise<MentorJunior[]> => {
    const res = await apiClient.get<MentorJunior[]>('/mentor-junior/', { params });
    return res.data;
  },

  getOne: async (mentorId: number, juniorId: number): Promise<MentorJunior> => {
    const res = await apiClient.get<MentorJunior>(`/mentor-junior/${mentorId}/${juniorId}`);
    return res.data;
  },

  create: async (data: MentorJuniorCreateInput): Promise<MentorJunior> => {
    const res = await apiClient.post<MentorJunior>('/mentor-junior/', data);
    return res.data;
  },

  update: async (mentorId: number, juniorId: number, data: Partial<MentorJuniorCreateInput>): Promise<MentorJunior> => {
    const res = await apiClient.patch<MentorJunior>(`/mentor-junior/${mentorId}/${juniorId}`, data);
    return res.data;
  },

  delete: async (mentorId: number, juniorId: number): Promise<void> => {
    await apiClient.delete(`/mentor-junior/${mentorId}/${juniorId}`);
  },
};
