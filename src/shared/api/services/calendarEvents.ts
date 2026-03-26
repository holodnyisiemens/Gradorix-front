import { apiClient } from '../client';
import type { CalendarEvent } from '@shared/types';

// Backend DTO shape
interface CalendarEventBackend {
  id: number;
  title: string;
  date: string;
  event_type: 'challenge' | 'meeting' | 'deadline';
  challenge_id?: number | null;
  description?: string | null;
}

function mapEvent(b: CalendarEventBackend): CalendarEvent {
  return {
    id: b.id,
    title: b.title,
    date: b.date,
    type: b.event_type,
    challengeId: b.challenge_id ?? undefined,
    description: b.description ?? undefined,
  };
}

export interface CalendarEventCreateInput {
  title: string;
  date: string;
  event_type: 'challenge' | 'meeting' | 'deadline';
  challenge_id?: number;
  description?: string;
}

export const calendarEventsApi = {
  getAll: async (params?: { date?: string; event_type?: string }): Promise<CalendarEvent[]> => {
    const res = await apiClient.get<CalendarEventBackend[]>('/calendar-events/', { params });
    return res.data.map(mapEvent);
  },

  getById: async (id: number): Promise<CalendarEvent> => {
    const res = await apiClient.get<CalendarEventBackend>(`/calendar-events/${id}`);
    return mapEvent(res.data);
  },

  create: async (data: CalendarEventCreateInput): Promise<CalendarEvent> => {
    const res = await apiClient.post<CalendarEventBackend>('/calendar-events/', data);
    return mapEvent(res.data);
  },

  update: async (id: number, data: Partial<CalendarEventCreateInput>): Promise<CalendarEvent> => {
    const res = await apiClient.patch<CalendarEventBackend>(`/calendar-events/${id}`, data);
    return mapEvent(res.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/calendar-events/${id}`);
  },
};
