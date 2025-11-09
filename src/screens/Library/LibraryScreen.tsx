import { StyleSheet, Text, View } from 'react-native';
import { InfoCard } from '../../components/Cards/InfoCard';
import { ThemedButton } from '../../components/Buttons/ThemedButton';
import { useBand } from '../../context/BandContext';
import { useTheme } from '../../theme';

export const LibraryScreen = () => {
  const { theme, toggleTheme, mode } = useTheme();
  const { bandName, members, upcomingShows, activeSetlist } = useBand();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.heading, theme.typography.largeTitle, { color: theme.colors.text }]}>
        Library
      </Text>

      <InfoCard>
        <Text style={[theme.typography.title2, { color: theme.colors.text }]}>{bandName}</Text>
        <Text style={[styles.caption, theme.typography.body, { color: '#6e6e73' }]}>
          {members.length} members • {upcomingShows} upcoming shows
        </Text>
        <Text style={[styles.caption, theme.typography.body, { color: theme.colors.text }]}>
          Active setlist: {activeSetlist ?? 'None yet'}
        </Text>
      </InfoCard>

      <ThemedButton
        label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
        onPress={toggleTheme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  heading: {
    marginBottom: 8,
  },
  caption: {
    marginTop: 6,
  },
});
