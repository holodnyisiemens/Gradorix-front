export type UserRole = 'HR' | 'MENTOR' | 'JUNIOR';

export type ChallengeStatus = 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type ChallengeJuniorProgress = 'GOING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  firstname?: string;
  lastname?: string;
  is_active: boolean;
}

export interface Challenge {
  id: number;
  title: string;
  description?: string;
  url?: string;
  status: ChallengeStatus;
  date?: string; // ISO date string for calendar events
}

export interface MentorJunior {
  mentor_id: number;
  junior_id: number;
  assigned_by: number;
}

export interface ChallengeJunior {
  challenge_id: number;
  junior_id: number;
  assigned_by: number;
  progress: ChallengeJuniorProgress;
}

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'challenge' | 'meeting' | 'deadline';
  challengeId?: number;
  description?: string;
}

export type AchievementCategory = 'milestone' | 'challenge' | 'streak' | 'social' | 'special';

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  category: AchievementCategory;
  xp: number;
}

export interface JuniorActivityStats {
  userId: number;
  totalChallenges: number;
  done: number;
  inProgress: number;
  going: number;
  skipped: number;
  completionRate: number; // 0-100
  lastActive: string; // ISO date
}
