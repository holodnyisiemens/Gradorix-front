import { apiClient } from '../client';
import type { MentorEmployee } from '@shared/types';

export interface MentorEmployeeCreateInput {
  mentor_id: number;
  employee_id: number;
  assigned_by: number;
}

export const mentorEmployeeApi = {
  getAll: async (params?: { mentor_id?: number; employee_id?: number }): Promise<MentorEmployee[]> => {
    const res = await apiClient.get<MentorEmployee[]>('/mentor-employee/', { params });
    return res.data;
  },

  getOne: async (mentorId: number, employeeId: number): Promise<MentorEmployee> => {
    const res = await apiClient.get<MentorEmployee>(`/mentor-employee/${mentorId}/${employeeId}`);
    return res.data;
  },

  create: async (data: MentorEmployeeCreateInput): Promise<MentorEmployee> => {
    const res = await apiClient.post<MentorEmployee>('/mentor-employee/', data);
    return res.data;
  },

  update: async (mentorId: number, employeeId: number, data: Partial<MentorEmployeeCreateInput>): Promise<MentorEmployee> => {
    const res = await apiClient.patch<MentorEmployee>(`/mentor-employee/${mentorId}/${employeeId}`, data);
    return res.data;
  },

  delete: async (mentorId: number, employeeId: number): Promise<void> => {
    await apiClient.delete(`/mentor-employee/${mentorId}/${employeeId}`);
  },
};
