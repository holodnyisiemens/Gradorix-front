import { apiClient } from '../client';
import type { User, UserRole } from '@shared/types';

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  firstname?: string;
  lastname?: string;
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  role?: UserRole;
  firstname?: string;
  lastname?: string;
  is_active?: boolean;
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/users/');
    return res.data;
  },

  getById: async (id: number): Promise<User> => {
    const res = await apiClient.get<User>(`/users/${id}`);
    return res.data;
  },

  create: async (data: UserCreateInput): Promise<User> => {
    const res = await apiClient.post<User>('/users/', data);
    return res.data;
  },

  update: async (id: number, data: UserUpdateInput): Promise<User> => {
    const res = await apiClient.patch<User>(`/users/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
