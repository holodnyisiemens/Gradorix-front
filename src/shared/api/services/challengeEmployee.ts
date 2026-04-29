import { apiClient } from '../client';
import type { ChallengeEmployee, ChallengeEmployeeProgress } from '@shared/types';

export interface ChallengeEmployeeCreateInput {
  challenge_id: number;
  employee_id: number;
  assigned_by: number;
  progress: ChallengeEmployeeProgress;
}

export interface ChallengeEmployeeUpdateInput {
  progress?: ChallengeEmployeeProgress;
  comment?: string;
  links?: string[];
  awarded_points?: number;
  feedback?: string;
}

export const challengeEmployeeApi = {
  getAll: async (params?: { employee_id?: number; assigned_by?: number }): Promise<ChallengeEmployee[]> => {
    const res = await apiClient.get<ChallengeEmployee[]>('/challenge-employee/', { params });
    return res.data;
  },

  getOne: async (challengeId: number, employeeId: number): Promise<ChallengeEmployee> => {
    const res = await apiClient.get<ChallengeEmployee>(`/challenge-employee/${challengeId}/${employeeId}`);
    return res.data;
  },

  create: async (data: ChallengeEmployeeCreateInput): Promise<ChallengeEmployee> => {
    const res = await apiClient.post<ChallengeEmployee>('/challenge-employee/', data);
    return res.data;
  },

  update: async (challengeId: number, employeeId: number, data: ChallengeEmployeeUpdateInput): Promise<ChallengeEmployee> => {
    const res = await apiClient.patch<ChallengeEmployee>(`/challenge-employee/${challengeId}/${employeeId}`, data);
    return res.data;
  },

  delete: async (challengeId: number, employeeId: number): Promise<void> => {
    await apiClient.delete(`/challenge-employee/${challengeId}/${employeeId}`);
  },
};
