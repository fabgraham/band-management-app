import { createContext, ReactNode, useContext, useEffect } from 'react';
import { create } from 'zustand';
import {
  Band,
  getBands,
  createBand as createBandService,
  updateBand as updateBandService,
  deleteBand as deleteBandService,
  canCreateBand,
  Profile,
  getProfile,
} from '../services/data/bandService';

interface BandState {
  bands: Band[];
  activeBand: Band | null;
  loading: boolean;
  error: string | null;
  profile: Profile | null;
  // Actions
  fetchBands: () => Promise<void>;
  createBand: (name: string) => Promise<Band>;
  updateBand: (bandId: string, name: string) => Promise<Band>;
  deleteBand: (bandId: string) => Promise<void>;
  selectBand: (bandId: string) => void;
  checkCanCreateBand: () => Promise<{ canCreate: boolean; reason?: string }>;
  fetchProfile: () => Promise<void>;
}

const useBandStore = create<BandState>((set, get) => ({
  bands: [],
  activeBand: null,
  loading: false,
  error: null,
  profile: null,

  fetchBands: async () => {
    set({ loading: true, error: null });
    try {
      const bands = await getBands();
      set({ bands, loading: false });

      // Auto-select first band if no active band
      const { activeBand } = get();
      if (!activeBand && bands.length > 0) {
        set({ activeBand: bands[0] });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch bands',
        loading: false,
      });
    }
  },

  createBand: async (name: string) => {
    set({ loading: true, error: null });
    try {
      const newBand = await createBandService(name);
      const { bands } = get();
      set({
        bands: [newBand, ...bands],
        activeBand: newBand,
        loading: false,
      });
      return newBand;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create band',
        loading: false,
      });
      throw error;
    }
  },

  updateBand: async (bandId: string, name: string) => {
    set({ loading: true, error: null });
    try {
      const updatedBand = await updateBandService(bandId, name);
      const { bands, activeBand } = get();
      const updatedBands = bands.map((band) =>
        band.id === bandId ? updatedBand : band,
      );
      set({
        bands: updatedBands,
        activeBand:
          activeBand?.id === bandId ? updatedBand : activeBand,
        loading: false,
      });
      return updatedBand;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update band',
        loading: false,
      });
      throw error;
    }
  },

  deleteBand: async (bandId: string) => {
    set({ loading: true, error: null });
    try {
      await deleteBandService(bandId);
      const { bands, activeBand } = get();
      const updatedBands = bands.filter((band) => band.id !== bandId);
      set({
        bands: updatedBands,
        activeBand: activeBand?.id === bandId ? updatedBands[0] || null : activeBand,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete band',
        loading: false,
      });
      throw error;
    }
  },

  selectBand: (bandId: string) => {
    const { bands } = get();
    const band = bands.find((b) => b.id === bandId);
    if (band) {
      set({ activeBand: band });
    }
  },

  checkCanCreateBand: async () => {
    return await canCreateBand();
  },

  fetchProfile: async () => {
    try {
      const profile = await getProfile();
      set({ profile });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  },
}));

const BandContext = createContext<BandState | undefined>(undefined);

export const BandProvider = ({ children }: { children: ReactNode }) => {
  const store = useBandStore();

  // Fetch bands and profile on mount
  useEffect(() => {
    store.fetchBands();
    store.fetchProfile();
  }, []);

  return <BandContext.Provider value={store}>{children}</BandContext.Provider>;
};

export const useBand = () => {
  const context = useContext(BandContext);
  if (!context) {
    throw new Error('useBand must be used within BandProvider');
  }
  return context;
};
