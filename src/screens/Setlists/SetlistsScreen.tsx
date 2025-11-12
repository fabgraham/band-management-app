import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { InfoCard } from '../../components/Cards/InfoCard';
import { useTheme } from '../../theme';
import { SetlistDetail } from '../../types';
import { getSetlists } from '../../services/data/setlistService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useBand } from '../../context/BandContext';

export const SetlistsScreen = () => {
  const { theme } = useTheme();
  const { activeBand } = useBand();
  const [setlists, setSetlists] = useState<SetlistDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSetlists = useCallback(async () => {
    if (!activeBand) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getSetlists(activeBand.id);
      setSetlists(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load setlists.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeBand]);

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadSetlists();
  }, [loadSetlists]);

  return (
  <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <Text style={[theme.typography.title1, { color: theme.colors.text, marginBottom: 12 }]}>
      Setlists
    </Text>

    {error && (
      <Text style={{ color: theme.colors.accent, marginBottom: 12 }}>
        {error} Try pulling to refresh.
      </Text>
    )}

    {loading ? (
      <ActivityIndicator color={theme.colors.primary} />
    ) : (
      <FlatList
        data={setlists}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSetlists} />}
        ListEmptyComponent={
          <InfoCard>
            <View style={styles.emptyStateIconContainer}>
              <Ionicons name="musical-notes" size={48} color="#999" />
            </View>
            <Text style={[theme.typography.title2, { color: '#999', marginTop: 16 }]}>
              No setlists yet
            </Text>
            <Text style={[theme.typography.body, { color: '#6e6e73', marginTop: 8, textAlign: 'center' }]}>
               Tap the + icon above to create your first setlist.
            </Text>
          </InfoCard>
        }
        renderItem={({ item }) => (
          <InfoCard>
            <Text style={[theme.typography.title2, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text style={[theme.typography.body, { color: '#6e6e73' }]}>
              {item.songs.length} songs • {formatDuration(item.songs.reduce((sum, entry) => sum + (entry.song?.duration_seconds ?? 0), 0))}
            </Text>
            <Text style={[theme.typography.body, { color: '#6e6e73', marginTop: 4 }]}>
              {item.show_date ? new Date(`${item.show_date}T00:00:00`).toLocaleDateString() : 'No date set'}
            </Text>
          </InfoCard>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
    )}
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  emptyStateIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
