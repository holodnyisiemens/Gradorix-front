import { apiClient } from '../client';
import type { Activity, ActivityStatus, ActivityType } from '@shared/types';

interface ActivityBackend {
  id: number;
  user_id: number;
  title: string;
  description: string;
  requested_points: number;
  awarded_points?: number | null;
  status: ActivityStatus;
  activity_type: ActivityType;
  submitted_at: string;
  reviewed_at?: string | null;
  review_note?: string | null;
}

function mapActivity(b: ActivityBackend): Activity {
  return {
    id: b.id,
    userId: b.user_id,
    title: b.title,
    description: b.description,
    requestedPoints: b.requested_points,
    awardedPoints: b.awarded_points ?? undefined,
    status: b.status,
    type: b.activity_type,
    submittedAt: b.submitted_at,
    reviewedAt: b.reviewed_at ?? undefined,
    reviewNote: b.review_note ?? undefined,
  };
}

export interface ActivityCreateInput {
  user_id: number;
  title: string;
  description: string;
  requested_points: number;
  activity_type: ActivityType;
}

export interface ActivityUpdateInput {
  title?: string;
  description?: string;
  requested_points?: number;
  awarded_points?: number;
  status?: ActivityStatus;
  activity_type?: ActivityType;
  review_note?: string;
}

export const activitiesApi = {
  getAll: async (params?: { user_id?: number; activity_status?: ActivityStatus }): Promise<Activity[]> => {
    const res = await apiClient.get<ActivityBackend[]>('/activities/', { params });
    return res.data.map(mapActivity);
  },

  getById: async (id: number): Promise<Activity> => {
    const res = await apiClient.get<ActivityBackend>(`/activities/${id}`);
    return mapActivity(res.data);
  },

  create: async (data: ActivityCreateInput): Promise<Activity> => {
    const res = await apiClient.post<ActivityBackend>('/activities/', data);
    return mapActivity(res.data);
  },

  update: async (id: number, data: ActivityUpdateInput): Promise<Activity> => {
    const res = await apiClient.patch<ActivityBackend>(`/activities/${id}`, data);
    return mapActivity(res.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/activities/${id}`);
  },
};
