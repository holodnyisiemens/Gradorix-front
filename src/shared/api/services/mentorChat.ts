import { apiClient } from '../client';
import type { MentorChatConversation, MentorChatMessage } from '@shared/types';

export const mentorChatApi = {
  getConversations: async (): Promise<MentorChatConversation[]> => {
    const res = await apiClient.get<MentorChatConversation[]>('/mentor-chat/conversations');
    return res.data;
  },

  getMessages: async (
    mentorId: number,
    employeeId: number,
    params?: { limit?: number; before_id?: string },
  ): Promise<MentorChatMessage[]> => {
    const res = await apiClient.get<MentorChatMessage[]>(
      `/mentor-chat/${mentorId}/${employeeId}/messages`,
      { params },
    );
    return res.data;
  },

  markRead: async (mentorId: number, employeeId: number): Promise<void> => {
    await apiClient.post(`/mentor-chat/${mentorId}/${employeeId}/read`);
  },
};
