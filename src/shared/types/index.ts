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

// ===== POINTS / LEADERBOARD =====
export interface UserPoints {
  userId: number;
  totalPoints: number;
  level: number;
  levelName: string;
  pointsToNextLevel: number;
  rank: number;
}

// ===== QUIZ / TESTS =====
export type QuestionType = 'single' | 'multiple' | 'text';

export interface TestQuestion {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswers?: number[]; // indices into options
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  category: string;
  durationMin: number;
  questions: TestQuestion[];
  points: number;
  available: boolean;
}

export interface QuizResult {
  userId: number;
  quizId: number;
  score: number; // percentage 0-100
  completedAt: string;
  pointsEarned: number;
}

// ===== KNOWLEDGE BASE =====
export interface KBSection {
  id: number;
  title: string;
  icon: string;
  description: string;
}

export interface KBArticle {
  id: number;
  sectionId: number;
  title: string;
  content: string;
  createdAt: string;
  author: string;
}

// ===== TEAM =====
export type TeamStatus = 'active' | 'on_hold' | 'completed';

export interface Team {
  id: number;
  name: string;
  description: string;
  status: TeamStatus;
  memberIds: number[];
  project: string;
  mentorId?: number;
}

// ===== AI CHAT =====
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ===== MEETING ATTENDANCE =====
export interface MeetingAttendance {
  id: number;
  eventId: number; // CalendarEvent id
  userId: number;
  attended: boolean;
  markedAt?: string;
  markedBy?: number; // if HR overrode it
}

// ===== ACTIVITY / POINTS MANAGEMENT =====
export type ActivityStatus = 'pending' | 'approved' | 'rejected' | 'revision';
export type ActivityType = 'achievement' | 'task' | 'test' | 'event' | 'custom';

export interface Activity {
  id: number;
  userId: number;
  title: string;
  description: string;
  requestedPoints: number;
  awardedPoints?: number;
  status: ActivityStatus;
  type: ActivityType;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}
