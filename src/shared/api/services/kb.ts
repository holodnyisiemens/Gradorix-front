import { apiClient } from '../client';
import type { KBSection, KBArticle } from '@shared/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

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
  attachments?: string[] | null;
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
    attachments: b.attachments
      ? b.attachments.map(p => `${API_BASE}${p}`)
      : undefined,
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
    files?: File[];
  }): Promise<KBArticle> => {
    const form = new FormData();
    form.append('section_id', String(data.section_id));
    form.append('title', data.title);
    form.append('content', data.content);
    form.append('author', data.author);
    form.append('created_at', data.created_at
      ? data.created_at.split('T')[0]
      : new Date().toISOString().split('T')[0]);
    if (data.files) {
      data.files.forEach(f => form.append('files', f));
    }
    const res = await apiClient.post<KBArticleBackend>('/kb-articles/', form);
    return mapArticle(res.data);
  },

  updateArticle: async (id: number, data: {
    section_id?: number;
    title?: string;
    content?: string;
    author?: string;
    files?: File[];
  }): Promise<KBArticle> => {
    const form = new FormData();
    if (data.section_id != null) form.append('section_id', String(data.section_id));
    if (data.title != null) form.append('title', data.title);
    if (data.content != null) form.append('content', data.content);
    if (data.author != null) form.append('author', data.author);
    if (data.files) {
      data.files.forEach(f => form.append('files', f));
    }
    const res = await apiClient.patch<KBArticleBackend>(`/kb-articles/${id}`, form);
    return mapArticle(res.data);
  },

  deleteArticle: async (id: number): Promise<void> => {
    await apiClient.delete(`/kb-articles/${id}`);
  },
};
