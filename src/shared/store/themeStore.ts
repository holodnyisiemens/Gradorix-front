import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme =
  | 'dark' | 'light'
  | 'boys' | 'boys-light'
  | 'breaking-bad' | 'breaking-bad-light'
  | 'arcane' | 'arcane-light'
  | 'squid-game' | 'squid-game-light'
  | 'dc' | 'dc-light'
  | 'marvel' | 'marvel-light';

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (t) => {
        document.documentElement.setAttribute('data-theme', t);
        set({ theme: t });
      },
    }),
    {
      name: 'gradorix-theme',
      onRehydrateStorage: () => (state) => {
        if (state) document.documentElement.setAttribute('data-theme', state.theme);
      },
    }
  )
);
