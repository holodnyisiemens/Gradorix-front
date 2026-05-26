import { apiClient } from '../client';
import type { User } from '@shared/types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type RegisterResponse = LoginResponse;

export interface ChangePasswordInput {
  old_password: string;
  new_password: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: {
    username: string;
    password: string;
    role: string;
  }): Promise<RegisterResponse> => {
    const res = await apiClient.post<RegisterResponse>('/auth/register', data);
    return res.data;
  },

  refresh: async (refresh_token: string): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/refresh', { refresh_token });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/users/me');
    return res.data;
  },

  changePassword: async (data: ChangePasswordInput): Promise<void> => {
    await apiClient.post('/auth/change-password', data);
  },
};