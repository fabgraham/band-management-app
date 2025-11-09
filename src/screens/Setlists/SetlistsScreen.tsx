import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { InfoCard } from '../../components/Cards/InfoCard';
import { useTheme } from '../../theme';
import { Song } from '../../types';
import { getSongs } from '../../services/data/songService';

export const SetlistsScreen = () => {
  const { theme } = useTheme();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSongs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSongs();
      setSongs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load songs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

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
          data={songs}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSongs} />}
          ListEmptyComponent={
            <InfoCard>
              <Text style={[theme.typography.title2, { color: theme.colors.text }]}>
                No songs yet
              </Text>
              <Text style={[theme.typography.body, { color: '#6e6e73', marginTop: 4 }]}>
                Add your first song in Supabase and pull to refresh.
              </Text>
            </InfoCard>
          }
          renderItem={({ item }) => (
            <InfoCard>
              <Text style={[theme.typography.title2, { color: theme.colors.text }]}>
                {item.title}
              </Text>
              <Text style={[theme.typography.body, { color: '#6e6e73' }]}>{item.artist}</Text>
              {item.key && (
                <Text style={[theme.typography.body, { marginTop: 6 }]}>Key: {item.key}</Text>
              )}
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
});
