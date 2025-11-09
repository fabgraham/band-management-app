import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../../theme';

const THEME_MODE_KEY = 'band-manager-theme-mode';

export const persistThemeMode = async (mode: ThemeMode) => {
  try {
    await AsyncStorage.setItem(THEME_MODE_KEY, mode);
  } catch (error) {
    console.warn('Failed to persist theme mode', error);
  }
};

export const loadThemeMode = async (): Promise<ThemeMode | null> => {
  try {
    const stored = await AsyncStorage.getItem(THEME_MODE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return null;
  } catch (error) {
    console.warn('Failed to load persisted theme mode', error);
    return null;
  }
};
