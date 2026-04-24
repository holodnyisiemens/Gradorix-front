import { apiClient } from '../client';
import type { Notification } from '@shared/types';

export interface NotificationCreateInput {
  user_id: number;
  message: string;
  link?: string;
  is_read?: boolean;
}

export const notificationsApi = {
  getAll: async (params?: { user_id?: number }): Promise<Notification[]> => {
    const res = await apiClient.get<Notification[]>('/notifications/', { params });
    return res.data;
  },

  getById: async (id: number): Promise<Notification> => {
    const res = await apiClient.get<Notification>(`/notifications/${id}`);
    return res.data;
  },

  create: async (data: NotificationCreateInput): Promise<Notification> => {
    const res = await apiClient.post<Notification>('/notifications/', data);
    return res.data;
  },

  markRead: async (id: number): Promise<Notification> => {
    const res = await apiClient.patch<Notification>(`/notifications/${id}`, { is_read: true });
    return res.data;
  },

  update: async (id: number, data: Partial<NotificationCreateInput>): Promise<Notification> => {
    const res = await apiClient.patch<Notification>(`/notifications/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};
