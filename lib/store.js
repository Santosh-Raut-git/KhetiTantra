import { create } from 'zustand';
export const useStore = create((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
