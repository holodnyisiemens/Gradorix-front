import { apiClient } from '../client';
import type { QuizResult } from '@shared/types';

interface QuizResultBackend {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  completed_at: string;
  points_earned: number;
}

function mapQuizResult(b: QuizResultBackend): QuizResult {
  return {
    userId: b.user_id,
    quizId: b.quiz_id,
    score: b.score,
    completedAt: b.completed_at,
    pointsEarned: b.points_earned,
  };
}

export interface QuizResultCreateInput {
  user_id: number;
  quiz_id: number;
  score: number;
  completed_at?: string;
  points_earned?: number;
}

export const quizResultsApi = {
  getAll: async (params?: { user_id?: number; quiz_id?: number }): Promise<QuizResult[]> => {
    const res = await apiClient.get<QuizResultBackend[]>('/quiz-results/', { params });
    return res.data.map(mapQuizResult);
  },

  getById: async (id: number): Promise<QuizResult> => {
    const res = await apiClient.get<QuizResultBackend>(`/quiz-results/${id}`);
    return mapQuizResult(res.data);
  },

  create: async (data: QuizResultCreateInput): Promise<QuizResult> => {
    const payload = {
      ...data,
      // backend expects date-only format YYYY-MM-DD, not full ISO string
      completed_at: data.completed_at
        ? data.completed_at.split('T')[0]
        : new Date().toISOString().split('T')[0],
    };
    const res = await apiClient.post<QuizResultBackend>('/quiz-results/', payload);
    return mapQuizResult(res.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/quiz-results/${id}`);
  },
};
