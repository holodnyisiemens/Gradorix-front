import { apiClient } from '../client';
import type { Team, TeamStatus } from '@shared/types';

interface TeamBackend {
  id: number;
  name: string;
  project: string;
  status: TeamStatus;
  mentor_id?: number | null;
  description: string;
  member_ids: number[];
}

function mapTeam(b: TeamBackend): Team {
  return {
    id: b.id,
    name: b.name,
    project: b.project,
    status: b.status,
    mentorId: b.mentor_id ?? undefined,
    description: b.description,
    memberIds: b.member_ids,
  };
}

export interface TeamCreateInput {
  name: string;
  project: string;
  status?: TeamStatus;
  mentor_id?: number;
  description?: string;
  member_ids?: number[];
}

export const teamsApi = {
  getAll: async (params?: { mentor_id?: number }): Promise<Team[]> => {
    const res = await apiClient.get<TeamBackend[]>('/teams/', { params });
    return res.data.map(mapTeam);
  },

  getById: async (id: number): Promise<Team> => {
    const res = await apiClient.get<TeamBackend>(`/teams/${id}`);
    return mapTeam(res.data);
  },

  create: async (data: TeamCreateInput): Promise<Team> => {
    const res = await apiClient.post<TeamBackend>('/teams/', data);
    return mapTeam(res.data);
  },

  update: async (id: number, data: Partial<TeamCreateInput>): Promise<Team> => {
    const res = await apiClient.patch<TeamBackend>(`/teams/${id}`, data);
    return mapTeam(res.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/teams/${id}`);
  },
};
