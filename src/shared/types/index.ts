export type UserRole = 'HR' | 'MENTOR' | 'EMPLOYEE';

export type ChallengeStatus = 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type ChallengeEmployeeProgress = 'GOING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
}

export interface Challenge {
  id: number;
  title: string;
  description?: string;
  url?: string;
  status: ChallengeStatus;
  date?: string; // ISO date string for calendar events
  maxPoints?: number;
}

export interface MentorEmployee {
  mentor_id: number;
  employee_id: number;
  assigned_by: number;
}

export interface ChallengeEmployee {
  challenge_id: number;
  employee_id: number;
  assigned_by: number;
  progress: ChallengeEmployeeProgress;
  comment?: string;
  links?: string[];
  awarded_points?: number;
  feedback?: string;
}
export interface Notification {
  id: number;
  user_id: number;
  message: string;
  link?: string | null;
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
  startTime?: string;   // "HH:MM"
  endTime?: string;     // "HH:MM"
  attendeeIds: number[];
  createdBy?: number;
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

export interface EmployeeActivityStats {
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
  graded?: boolean;          // for 'text' type: HR manually grades this question
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
  id: number;
  userId: number;
  quizId: number;
  score: number;         // percentage 0-100
  completedAt: string;
  pointsEarned: number;
  answers?: string[];    // text answers per question index (for 'text' type questions)
}

// ===== SURVEYS =====
export interface Survey {
  id: number;
  title: string;
  description: string;
  category: string;
  durationMin: number;
  questions: TestQuestion[];
  available: boolean;
}

export interface SurveyResult {
  id: number;
  userId: number;
  surveyId: number;
  completedAt: string;
  answers?: string[];    // answers per question index
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
  attachments?: string[];
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
  awardedPoints?: number;
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
  links?: string[];
  achievedDate?: string;
}
