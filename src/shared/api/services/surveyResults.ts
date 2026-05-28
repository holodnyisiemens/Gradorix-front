import { apiClient } from '../client';
import type { SurveyResult } from '@shared/types';

interface SurveyResultBackend {
  id: number;
  user_id: number;
  quiz_id: number;
  completed_at: string;
  answers?: string[];
}

function mapSurveyResult(b: SurveyResultBackend): SurveyResult {
  return {
    id: b.id,
    userId: b.user_id,
    surveyId: b.quiz_id,
    completedAt: b.completed_at,
    answers: b.answers,
  };
}

export interface SurveyResultCreateInput {
  quiz_id: number;
  completed_at?: string;
  answers?: string[];
}

export interface SurveyStatistics {
  survey_id: number;
  total_responses: number;
  completion_rate: number;
  answers_per_question: Array<{
    question_index: number;
    responses: Array<{
      answer: string;
      count: number;
    }>;
  }>;
}

export const surveyResultsApi = {
  getAll: async (params?: { user_id?: number; quiz_id?: number; survey_id?: number }): Promise<SurveyResult[]> => {
    const { user_id, quiz_id, survey_id } = params ?? {};
    const res = await apiClient.get<SurveyResultBackend[]>('/survey-results/', {
      params: { user_id, survey_id: survey_id ?? quiz_id },
    });
    return res.data.map(mapSurveyResult);
  },

  getById: async (id: number): Promise<SurveyResult> => {
    const res = await apiClient.get<SurveyResultBackend>(`/survey-results/${id}`);
    return mapSurveyResult(res.data);
  },

  create: async (data: SurveyResultCreateInput): Promise<SurveyResult> => {
    const payload: SurveyResultCreateInput = {
      quiz_id: data.quiz_id,
      completed_at: data.completed_at
        ? data.completed_at.split('T')[0]
        : new Date().toISOString().split('T')[0],
      ...(data.answers !== undefined ? { answers: data.answers } : {}),
    };
    const res = await apiClient.post<SurveyResultBackend>('/survey-results/', payload);
    return mapSurveyResult(res.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/survey-results/${id}`);
  },

  getStatistics: async (surveyId: number): Promise<SurveyStatistics> => {
    const res = await apiClient.get<SurveyStatistics>(`/survey-results/statistics`, {
      params: { survey_id: surveyId },
    });
    return res.data;
  },
};
