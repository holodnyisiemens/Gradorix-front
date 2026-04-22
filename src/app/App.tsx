import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useThemeStore } from '@shared/store/themeStore';
import { authApi } from '@shared/api/services/auth';
import { registerPushSubscription } from '@shared/services/push';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AppInner() {
  const theme = useThemeStore((s) => s.theme);
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('gradorix-token');
      console.log('Initializing auth, token exists:', !!token);
      if (token && !useAuthStore.getState().isAuthenticated) {
        try {
          console.log('Attempting to get user with existing token');
          const user = await authApi.getMe();
          login(user, token);
          console.log('Auth initialized successfully');
          registerPushSubscription(user.id);
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('gradorix-token');
          console.warn('Invalid token removed from localStorage:', error);
        }
      }
    };

    initAuth();
  }, [login]);

  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}