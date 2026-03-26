import { apiClient } from '../client';
import type { Quiz } from '@shared/types';

interface QuizBackend {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_min: number;
  questions: unknown[];
  points: number;
  available: boolean;
}

function mapQuiz(b: QuizBackend): Quiz {
  return {
    id: b.id,
    title: b.title,
    description: b.description,
    category: b.category,
    durationMin: b.duration_min,
    questions: b.questions as Quiz['questions'],
    points: b.points,
    available: b.available,
  };
}

export interface QuizCreateInput {
  title: string;
  description: string;
  category: string;
  duration_min?: number;
  questions?: unknown[];
  points?: number;
  available?: boolean;
}

export const quizzesApi = {
  getAll: async (params?: { available?: boolean }): Promise<Quiz[]> => {
    const res = await apiClient.get<QuizBackend[]>('/quizzes/', { params });
    return res.data.map(mapQuiz);
  },

  getById: async (id: number): Promise<Quiz> => {
    const res = await apiClient.get<QuizBackend>(`/quizzes/${id}`);
    return mapQuiz(res.data);
  },

  create: async (data: QuizCreateInput): Promise<Quiz> => {
    const res = await apiClient.post<QuizBackend>('/quizzes/', data);
    return mapQuiz(res.data);
  },

  update: async (id: number, data: Partial<QuizCreateInput>): Promise<Quiz> => {
    const res = await apiClient.patch<QuizBackend>(`/quizzes/${id}`, data);
    return mapQuiz(res.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/quizzes/${id}`);
  },
};
