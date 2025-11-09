import { createContext, ReactNode, useContext } from 'react';
import { create } from 'zustand';

interface BandState {
  bandName: string;
  members: string[];
  activeSetlist: string | null;
  upcomingShows: number;
  setBandName: (name: string) => void;
  setMembers: (members: string[]) => void;
  setActiveSetlist: (setlistId: string | null) => void;
  addShow: () => void;
}

const useBandStore = create<BandState>((set) => ({
  bandName: 'Midnight Echoes',
  members: ['Lena', 'Kai', 'Mara'],
  activeSetlist: null,
  upcomingShows: 2,
  setBandName: (bandName) => set({ bandName }),
  setMembers: (members) => set({ members }),
  setActiveSetlist: (activeSetlist) => set({ activeSetlist }),
  addShow: () => set((prev) => ({ upcomingShows: prev.upcomingShows + 1 })),
}));

const BandContext = createContext<BandState | undefined>(undefined);

export const BandProvider = ({ children }: { children: ReactNode }) => {
  const store = useBandStore();
  return <BandContext.Provider value={store}>{children}</BandContext.Provider>;
};

export const useBand = () => {
  const context = useContext(BandContext);
  if (!context) {
    throw new Error('useBand must be used within BandProvider');
  }
  return context;
};
