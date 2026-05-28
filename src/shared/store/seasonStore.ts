import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn' | null;

interface SeasonState {
  season: Season;
  setSeason: (s: Season) => void;
}

export const useSeasonStore = create<SeasonState>()(
  persist(
    (set) => ({
      season: null,
      setSeason: (season) => set({ season }),
    }),
    { name: 'gradorix-season' }
  )
);
