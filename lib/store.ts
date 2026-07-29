import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  village: string;
  district: string;
  land_area_acres: number;
  preferred_language: string;
}

interface AppState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
