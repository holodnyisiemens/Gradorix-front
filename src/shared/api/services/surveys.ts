import { apiClient } from '../client';
import type { Survey } from '@shared/types';

interface SurveyBackend {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_min: number;
  questions: unknown[];
  available: boolean;
}

function mapSurvey(b: SurveyBackend): Survey {
  return {
    id: b.id,
    title: b.title,
    description: b.description,
    category: b.category,
    durationMin: b.duration_min,
    questions: b.questions as Survey['questions'],
    available: b.available,
  };
}

export interface SurveyCreateInput {
  title: string;
  description: string;
  category: string;
  duration_min?: number;
  questions?: unknown[];
  available?: boolean;
}

export const surveysApi = {
  getAll: async (params?: { available?: boolean }): Promise<Survey[]> => {
    const res = await apiClient.get<SurveyBackend[]>('/surveys/', { params });
    return res.data.map(mapSurvey);
  },

  getById: async (id: number): Promise<Survey> => {
    const res = await apiClient.get<SurveyBackend>(`/surveys/${id}`);
    return mapSurvey(res.data);
  },

  create: async (data: SurveyCreateInput): Promise<Survey> => {
    const res = await apiClient.post<SurveyBackend>('/surveys/', data);
    return mapSurvey(res.data);
  },

  update: async (id: number, data: Partial<SurveyCreateInput>): Promise<Survey> => {
    const res = await apiClient.patch<SurveyBackend>(`/surveys/${id}`, data);
    return mapSurvey(res.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/surveys/${id}`);
  },
};
