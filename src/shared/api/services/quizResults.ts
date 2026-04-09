import { apiClient } from '../client';
import type { QuizResult } from '@shared/types';

interface QuizResultBackend {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  completed_at: string;
  points_earned: number;
  answers?: string[];
}

function mapQuizResult(b: QuizResultBackend): QuizResult {
  return {
    id: b.id,
    userId: b.user_id,
    quizId: b.quiz_id,
    score: b.score,
    completedAt: b.completed_at,
    pointsEarned: b.points_earned,
    answers: b.answers,
  };
}

export interface QuizResultCreateInput {
  user_id: number;
  quiz_id: number;
  score: number;
  completed_at?: string;
  points_earned?: number;
  answers?: string[];
}

export interface QuizResultUpdateInput {
  score?: number;
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
      completed_at: data.completed_at
        ? data.completed_at.split('T')[0]
        : new Date().toISOString().split('T')[0],
    };
    const res = await apiClient.post<QuizResultBackend>('/quiz-results/', payload);
    return mapQuizResult(res.data);
  },

  update: async (id: number, data: QuizResultUpdateInput): Promise<QuizResult> => {
    const res = await apiClient.patch<QuizResultBackend>(`/quiz-results/${id}`, data);
    return mapQuizResult(res.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/quiz-results/${id}`);
  },
};
