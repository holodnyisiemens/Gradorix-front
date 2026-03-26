import { apiClient } from '../client';
import type { MeetingAttendance } from '@shared/types';

interface MeetingAttendanceBackend {
  id: number;
  event_id: number;
  user_id: number;
  attended: boolean;
  marked_at?: string | null;
  marked_by?: number | null;
}

function mapAttendance(b: MeetingAttendanceBackend): MeetingAttendance {
  return {
    id: b.id,
    eventId: b.event_id,
    userId: b.user_id,
    attended: b.attended,
    markedAt: b.marked_at ?? undefined,
    markedBy: b.marked_by ?? undefined,
  };
}

export interface AttendanceCreateInput {
  event_id: number;
  user_id: number;
  attended: boolean;
  marked_by?: number;
}

export const meetingAttendanceApi = {
  getAll: async (params?: { event_id?: number; user_id?: number }): Promise<MeetingAttendance[]> => {
    const res = await apiClient.get<MeetingAttendanceBackend[]>('/meeting-attendance/', { params });
    return res.data.map(mapAttendance);
  },

  getById: async (id: number): Promise<MeetingAttendance> => {
    const res = await apiClient.get<MeetingAttendanceBackend>(`/meeting-attendance/${id}`);
    return mapAttendance(res.data);
  },

  create: async (data: AttendanceCreateInput): Promise<MeetingAttendance> => {
    const res = await apiClient.post<MeetingAttendanceBackend>('/meeting-attendance/', data);
    return mapAttendance(res.data);
  },

  update: async (id: number, data: Partial<AttendanceCreateInput>): Promise<MeetingAttendance> => {
    const res = await apiClient.patch<MeetingAttendanceBackend>(`/meeting-attendance/${id}`, data);
    return mapAttendance(res.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/meeting-attendance/${id}`);
  },
};
