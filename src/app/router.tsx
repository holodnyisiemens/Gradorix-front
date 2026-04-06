import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@shared/components/layout/AppLayout/AppLayout';
import { ProtectedRoute } from '@shared/components/routing/ProtectedRoute';
import { PublicRoute } from '@shared/components/routing/PublicRoute';
import { LoginPage } from '@pages/LoginPage/LoginPage';
import { RegisterPage } from '@pages/RegisterPage/RegisterPage';
import { DashboardPage } from '@pages/DashboardPage/DashboardPage';
import { CalendarPage } from '@pages/CalendarPage/CalendarPage';
import { ChallengesPage } from '@pages/ChallengesPage/ChallengesPage';
import { ChallengePage } from '@pages/ChallengePage/ChallengePage';
import { UsersPage } from '@pages/UsersPage/UsersPage';
import { MentorshipsPage } from '@pages/MentorshipsPage/MentorshipsPage';
import { NotificationsPage } from '@pages/NotificationsPage/NotificationsPage';
import { JuniorsPage } from '@pages/JuniorsPage/JuniorsPage';
import { ProfilePage } from '@pages/ProfilePage/ProfilePage';
import { LeaderboardPage } from '@pages/LeaderboardPage/LeaderboardPage';
import { TestsPage } from '@pages/TestsPage/TestsPage';
import { TestPage } from '@pages/TestPage/TestPage';
import { KnowledgePage } from '@pages/KnowledgePage/KnowledgePage';
import { KnowledgeSectionPage } from '@pages/KnowledgeSectionPage/KnowledgeSectionPage';
import { TeamPage } from '@pages/TeamPage/TeamPage';
import { PointsPage } from '@pages/PointsPage/PointsPage';
import { AdminPage } from '@pages/AdminPage/AdminPage';
import { AttendancePage } from '@pages/AttendancePage/AttendancePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',        element: <DashboardPage /> },
      { path: 'calendar',         element: <CalendarPage /> },
      { path: 'challenges',       element: <ChallengesPage /> },
      { path: 'challenges/:id',   element: <ChallengePage /> },
      { path: 'users',            element: <UsersPage /> },
      { path: 'mentorships',      element: <MentorshipsPage /> },
      { path: 'notifications',    element: <NotificationsPage /> },
      { path: 'juniors',          element: <JuniorsPage /> },
      { path: 'profile',          element: <ProfilePage /> },
      { path: 'leaderboard',      element: <LeaderboardPage /> },
      { path: 'tests',            element: <TestsPage /> },
      { path: 'tests/:id',        element: <TestPage /> },
      { path: 'knowledge',        element: <KnowledgePage /> },
      { path: 'knowledge/:sectionId', element: <KnowledgeSectionPage /> },
      { path: 'team',             element: <TeamPage /> },
      { path: 'points',           element: <PointsPage /> },
      { path: 'admin',            element: <AdminPage /> },
      { path: 'attendance',       element: <AttendancePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);