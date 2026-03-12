import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@shared/components/layout/AppLayout/AppLayout';
import { LoginPage } from '@pages/LoginPage/LoginPage';
import { DashboardPage } from '@pages/DashboardPage/DashboardPage';
import { CalendarPage } from '@pages/CalendarPage/CalendarPage';
import { ChallengesPage } from '@pages/ChallengesPage/ChallengesPage';
import { ChallengePage } from '@pages/ChallengePage/ChallengePage';
import { UsersPage } from '@pages/UsersPage/UsersPage';
import { MentorshipsPage } from '@pages/MentorshipsPage/MentorshipsPage';
import { NotificationsPage } from '@pages/NotificationsPage/NotificationsPage';
import { JuniorsPage } from '@pages/JuniorsPage/JuniorsPage';
import { ProfilePage } from '@pages/ProfilePage/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'challenges', element: <ChallengesPage /> },
      { path: 'challenges/:id', element: <ChallengePage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'mentorships', element: <MentorshipsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'juniors', element: <JuniorsPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
