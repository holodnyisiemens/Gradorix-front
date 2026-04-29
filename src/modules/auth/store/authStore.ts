import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  updateToken: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, token, refreshToken) => {
        localStorage.setItem('gradorix-token', token);
        localStorage.setItem('gradorix-refresh-token', refreshToken);
        set({ user, token, refreshToken, isAuthenticated: true });
      },
      updateToken: (token, refreshToken) => {
        localStorage.setItem('gradorix-token', token);
        localStorage.setItem('gradorix-refresh-token', refreshToken);
        set({ token, refreshToken });
      },
      logout: () => {
        localStorage.removeItem('gradorix-token');
        localStorage.removeItem('gradorix-refresh-token');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'gradorix-auth',
    }
  )
);
