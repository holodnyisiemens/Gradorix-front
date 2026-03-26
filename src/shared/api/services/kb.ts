import { apiClient } from '../client';
import type { KBSection, KBArticle } from '@shared/types';

interface KBSectionBackend {
  id: number;
  title: string;
  order: number;
}

interface KBArticleBackend {
  id: number;
  section_id: number;
  title: string;
  content: string;
  created_at: string;
  author: string;
}

function mapSection(b: KBSectionBackend): KBSection {
  return {
    id: b.id,
    title: b.title,
    icon: '',
    description: '',
  };
}

function mapArticle(b: KBArticleBackend): KBArticle {
  return {
    id: b.id,
    sectionId: b.section_id,
    title: b.title,
    content: b.content,
    createdAt: b.created_at,
    author: b.author,
  };
}

export const kbApi = {
  getSections: async (): Promise<KBSection[]> => {
    const res = await apiClient.get<KBSectionBackend[]>('/kb-sections/');
    return res.data.map(mapSection);
  },

  getSectionById: async (id: number): Promise<KBSection> => {
    const res = await apiClient.get<KBSectionBackend>(`/kb-sections/${id}`);
    return mapSection(res.data);
  },

  createSection: async (data: { title: string; order?: number }): Promise<KBSection> => {
    const res = await apiClient.post<KBSectionBackend>('/kb-sections/', data);
    return mapSection(res.data);
  },

  updateSection: async (id: number, data: { title?: string; order?: number }): Promise<KBSection> => {
    const res = await apiClient.patch<KBSectionBackend>(`/kb-sections/${id}`, data);
    return mapSection(res.data);
  },

  deleteSection: async (id: number): Promise<void> => {
    await apiClient.delete(`/kb-sections/${id}`);
  },

  getArticles: async (params?: { section_id?: number }): Promise<KBArticle[]> => {
    const res = await apiClient.get<KBArticleBackend[]>('/kb-articles/', { params });
    return res.data.map(mapArticle);
  },

  getArticleById: async (id: number): Promise<KBArticle> => {
    const res = await apiClient.get<KBArticleBackend>(`/kb-articles/${id}`);
    return mapArticle(res.data);
  },

  createArticle: async (data: {
    section_id: number;
    title: string;
    content: string;
    created_at?: string;
    author: string;
  }): Promise<KBArticle> => {
    const res = await apiClient.post<KBArticleBackend>('/kb-articles/', data);
    return mapArticle(res.data);
  },

  updateArticle: async (id: number, data: {
    section_id?: number;
    title?: string;
    content?: string;
    author?: string;
  }): Promise<KBArticle> => {
    const res = await apiClient.patch<KBArticleBackend>(`/kb-articles/${id}`, data);
    return mapArticle(res.data);
  },

  deleteArticle: async (id: number): Promise<void> => {
    await apiClient.delete(`/kb-articles/${id}`);
  },
};
