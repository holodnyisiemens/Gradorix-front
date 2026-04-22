import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usersApi,
  challengesApi,
  challengeJuniorApi,
  mentorJuniorApi,
  notificationsApi,
  calendarEventsApi,
  achievementsApi,
  userAchievementsApi,
  userPointsApi,
  activitiesApi,
  teamsApi,
  quizzesApi,
  quizResultsApi,
  kbApi,
  meetingAttendanceApi,
} from '@shared/api';
import type { UserCreateInput, UserUpdateInput } from '@shared/api/services/users';
import type { ChallengeCreateInput, ChallengeUpdateInput } from '@shared/api/services/challenges';
import type { ActivityCreateInput, ActivityUpdateInput } from '@shared/api/services/activities';
import type { CalendarEventCreateInput } from '@shared/api/services/calendarEvents';
import type { TeamCreateInput } from '@shared/api/services/teams';
import type { QuizCreateInput } from '@shared/api/services/quizzes';

// ===== USERS =====
export const useUsers = () =>
  useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });

export const useUser = (id: number) =>
  useQuery({ queryKey: ['users', id], queryFn: () => usersApi.getById(id), enabled: !!id });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreateInput) => usersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdateInput }) => usersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

// ===== CHALLENGES =====
export const useChallenges = () =>
  useQuery({ queryKey: ['challenges'], queryFn: challengesApi.getAll });

export const useChallenge = (id: number) =>
  useQuery({ queryKey: ['challenges', id], queryFn: () => challengesApi.getById(id), enabled: !!id });

export const useCreateChallenge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ChallengeCreateInput) => challengesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges'] }),
  });
};

export const useUpdateChallenge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChallengeUpdateInput }) => challengesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges'] }),
  });
};

export const useDeleteChallenge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => challengesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges'] }),
  });
};

// ===== CHALLENGE-JUNIOR =====
export const useChallengeJuniors = (params?: { junior_id?: number; assigned_by?: number }) =>
  useQuery({
    queryKey: ['challenge-junior', params],
    queryFn: () => challengeJuniorApi.getAll(params),
    staleTime: 0, // always refetch so juniors see HR feedback/points immediately
  });

export const useAssignChallenge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: challengeJuniorApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenge-junior'] }),
  });
};

export const useUnassignChallenge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, juniorId }: { challengeId: number; juniorId: number }) =>
      challengeJuniorApi.delete(challengeId, juniorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenge-junior'] }),
  });
};

export const useUpdateChallengeProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, juniorId, progress }: { challengeId: number; juniorId: number; progress: string }) =>
      challengeJuniorApi.update(challengeId, juniorId, { progress: progress as 'GOING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenge-junior'] }),
  });
};

export const useUpdateChallengeJunior = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, juniorId, data }: { challengeId: number; juniorId: number; data: import('@shared/api/services/challengeJunior').ChallengeJuniorUpdateInput }) =>
      challengeJuniorApi.update(challengeId, juniorId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenge-junior'] }),
  });
};

// ===== MENTOR-JUNIOR =====
export const useMentorJuniors = (params?: { mentor_id?: number; junior_id?: number }) =>
  useQuery({
    queryKey: ['mentor-junior', params],
    queryFn: () => mentorJuniorApi.getAll(params),
  });

export const useAssignMentor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mentorJuniorApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor-junior'] }),
  });
};

export const useRemoveMentor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mentorId, juniorId }: { mentorId: number; juniorId: number }) =>
      mentorJuniorApi.delete(mentorId, juniorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor-junior'] }),
  });
};

// ===== NOTIFICATIONS =====
export const useNotifications = (userId?: number) =>
  useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationsApi.getAll(userId ? { user_id: userId } : undefined),
    enabled: userId !== undefined,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useCreateNotification = () =>
  useMutation({ mutationFn: notificationsApi.create });

// ===== CALENDAR EVENTS =====
export const useCalendarEvents = (params?: { date?: string; event_type?: string }) =>
  useQuery({
    queryKey: ['calendar-events', params],
    queryFn: () => calendarEventsApi.getAll(params),
  });

export const useCreateCalendarEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarEventsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
};

export const useUpdateCalendarEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CalendarEventCreateInput> }) =>
      calendarEventsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
};

export const useDeleteCalendarEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => calendarEventsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
};

// ===== ACHIEVEMENTS =====
export const useAchievements = () =>
  useQuery({ queryKey: ['achievements'], queryFn: achievementsApi.getAll });

export const useDeleteAchievement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => achievementsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  });
};

export const useUserAchievements = (userId?: number) =>
  useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: () => userAchievementsApi.getAll({ user_id: userId }),
    enabled: userId !== undefined,
  });

export const useAllUserAchievements = () =>
  useQuery({
    queryKey: ['user-achievements'],
    queryFn: () => userAchievementsApi.getAll(),
  });

export const useAwardAchievement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id: number; achievement_id: number }) =>
      userAchievementsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });
};

export const useRevokeAchievement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, achievementId }: { userId: number; achievementId: number }) =>
      userAchievementsApi.delete(userId, achievementId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });
};

// Combined hook: achievements merged with user's earned status
export const useUserAchievementsWithStatus = (userId?: number) => {
  const achievementsQuery = useAchievements();
  const userAchievementsQuery = useUserAchievements(userId);

  const data =
    achievementsQuery.data && userAchievementsQuery.data
      ? userAchievementsApi.mergeWithUser(achievementsQuery.data, userAchievementsQuery.data)
      : undefined;

  return {
    data,
    isLoading: achievementsQuery.isLoading || userAchievementsQuery.isLoading,
    error: achievementsQuery.error || userAchievementsQuery.error,
  };
};

// ===== USER POINTS =====
export const useLeaderboard = () =>
  useQuery({ queryKey: ['user-points', 'leaderboard'], queryFn: userPointsApi.getLeaderboard });

export const useUserPoints = (userId?: number) =>
  useQuery({
    queryKey: ['user-points', userId],
    queryFn: () => userPointsApi.getByUserId(userId!),
    enabled: userId !== undefined,
  });

// ===== ACTIVITIES =====
export const useActivities = (params?: { user_id?: number }) =>
  useQuery({
    queryKey: ['activities', params],
    queryFn: () => activitiesApi.getAll(params),
  });

export const useCreateActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ActivityCreateInput) => activitiesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
};

export const useUpdateActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActivityUpdateInput }) => activitiesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
};

export const useDeleteActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => activitiesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
};

// ===== TEAMS =====
export const useTeams = (params?: { mentor_id?: number }) =>
  useQuery({
    queryKey: ['teams', params],
    queryFn: () => teamsApi.getAll(params),
  });

export const useTeam = (id: number) =>
  useQuery({ queryKey: ['teams', id], queryFn: () => teamsApi.getById(id), enabled: !!id });

export const useCreateTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TeamCreateInput) => teamsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useUpdateTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TeamCreateInput> }) => teamsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useDeleteTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => teamsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
};

// ===== QUIZZES =====
export const useQuizzes = (available?: boolean) =>
  useQuery({
    queryKey: ['quizzes', available],
    queryFn: () => quizzesApi.getAll(available !== undefined ? { available } : undefined),
  });

export const useQuiz = (id: number) =>
  useQuery({ queryKey: ['quizzes', id], queryFn: () => quizzesApi.getById(id), enabled: !!id });

export const useCreateQuiz = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: QuizCreateInput) => quizzesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  });
};

export const useUpdateQuiz = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<QuizCreateInput> }) =>
      quizzesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  });
};

export const useDeleteQuiz = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => quizzesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  });
};

// ===== QUIZ RESULTS =====
export const useQuizResults = (params?: { user_id?: number; quiz_id?: number }) =>
  useQuery({
    queryKey: ['quiz-results', params],
    queryFn: () => quizResultsApi.getAll(params),
  });

export const useUpdateQuizResult = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: import('@shared/api/services/quizResults').QuizResultUpdateInput }) =>
      quizResultsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz-results'] }),
  });
};

export const useSubmitQuizResult = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quizResultsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz-results'] }),
  });
};

// ===== KNOWLEDGE BASE =====
export const useKBSections = () =>
  useQuery({ queryKey: ['kb-sections'], queryFn: kbApi.getSections });

export const useKBArticles = (sectionId?: number) =>
  useQuery({
    queryKey: ['kb-articles', sectionId],
    queryFn: () => kbApi.getArticles(sectionId ? { section_id: sectionId } : undefined),
  });

export const useKBArticle = (id: number) =>
  useQuery({ queryKey: ['kb-articles', 'detail', id], queryFn: () => kbApi.getArticleById(id), enabled: !!id });

export const useCreateKBSection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; order?: number }) => kbApi.createSection(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb-sections'] }),
  });
};

export const useDeleteKBSection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => kbApi.deleteSection(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb-sections'] }),
  });
};

export const useCreateKBArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { section_id: number; title: string; content: string; author: string }) =>
      kbApi.createArticle(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb-articles'] }),
  });
};

export const useDeleteKBArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => kbApi.deleteArticle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb-articles'] }),
  });
};

// ===== MEETING ATTENDANCE =====
export const useMeetingAttendance = (params?: { event_id?: number; user_id?: number }) =>
  useQuery({
    queryKey: ['meeting-attendance', params],
    queryFn: () => meetingAttendanceApi.getAll(params),
  });

export const useMarkAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: meetingAttendanceApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meeting-attendance'] }),
  });
};

export const useUpdateAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { attended?: boolean } }) =>
      meetingAttendanceApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meeting-attendance'] }),
  });
};

export const useDeleteAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => meetingAttendanceApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meeting-attendance'] }),
  });
};
