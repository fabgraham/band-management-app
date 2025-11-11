import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBand } from '../../context/BandContext';
import { useTheme } from '../../theme';
import { AddSongModal } from '../../components/Modals/AddSongModal';
import { getSongs, searchSongs as searchSongsService, deleteSong } from '../../services/data/songService';
import { Song } from '../../types';

type RootStackParamList = {
  SongDetail: { songId: string };
};

export const LibraryScreen = () => {
  const { theme } = useTheme();
  const { activeBand } = useBand();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load songs
  const loadSongs = useCallback(async () => {
    if (!activeBand) {
      setSongs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getSongs(activeBand.id);
      setSongs(data);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load songs',
      );
    } finally {
      setLoading(false);
    }
  }, [activeBand]);

  // Handle search with debounce
  useEffect(() => {
    if (!activeBand) return;

    if (searchQuery.trim() === '') {
      // Clear search - reload all songs
      loadSongs();
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchSongsService(searchQuery, activeBand.id);
        setSongs(results);
      } catch (error) {
        Alert.alert('Error', 'Failed to search songs');
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeBand, loadSongs]);

  // Initial load
  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSongs();
    setRefreshing(false);
  };

  // Handle song press
  const handleSongPress = (songId: string) => {
    navigation.navigate('SongDetail', { songId });
  };

  // Handle delete
  const handleDelete = (song: Song) => {
    Alert.alert(
      'Delete Song',
      `Are you sure you want to delete "${song.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSong(song.id);
              Alert.alert('Success', 'Song deleted successfully');
              loadSongs();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete song',
              );
            }
          },
        },
      ],
    );
  };

  // Format duration
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render song item
  const renderSongItem = ({ item }: { item: Song }) => (
    <Pressable
      style={[styles.songCard, { backgroundColor: '#ffffff', borderColor: '#e5e5ea' }]}
      onPress={() => handleSongPress(item.id)}
    >
      <View style={styles.songInfo}>
        <Text style={[theme.typography.callout, { color: '#1c1c1e' }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[theme.typography.body, { color: '#6b6b71', marginTop: 4 }]} numberOfLines={1}>
          {item.artist}
        </Text>
        <View style={styles.songMeta}>
          {item.key && (
        <View style={[styles.keyBadge, { backgroundColor: '#133053' }]}>
              <Text style={[theme.typography.footnote, { color: '#ffffff', fontWeight: '600' }]}>
                {item.key}
              </Text>
            </View>
          )}
          {item.bpm && (
            <Text style={[theme.typography.footnote, { color: '#6b6b71' }]}>
              {item.bpm} BPM
            </Text>
          )}
          {item.duration_seconds && (
            <Text style={[theme.typography.footnote, { color: '#6b6b71' }]}>
              {formatDuration(item.duration_seconds)}
            </Text>
          )}
        </View>
      </View>

      <Pressable
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
      </Pressable>
    </Pressable>
  );

  // Empty state
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="musical-notes-outline" size={64} color="#c7c7cc" />
        <Text style={[theme.typography.title2, { color: '#1c1c1e', marginTop: 16 }]}>
          {searchQuery ? 'No songs found' : 'No songs yet'}
        </Text>
        <Text style={[theme.typography.body, { color: '#6b6b71', marginTop: 8, textAlign: 'center' }]}>
          {searchQuery
            ? 'Try searching with different keywords'
            : activeBand
            ? 'Tap the + button to add your first song'
            : 'Select or create a band to get started'}
        </Text>
      </View>
    );
  };

  if (!activeBand) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={64} color="#c7c7cc" />
          <Text style={[theme.typography.title2, { color: '#1c1c1e', marginTop: 16 }]}>
            No Active Band
          </Text>
          <Text style={[theme.typography.body, { color: '#6b6b71', marginTop: 8, textAlign: 'center' }]}>
            Select or create a band to view its song library
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.heading, theme.typography.largeTitle, { color: theme.colors.text }]}>
          Library
        </Text>
        <Text style={[theme.typography.body, { color: '#6b6b71' }]}>
          {songs.length} {songs.length === 1 ? 'song' : 'songs'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: '#f2f2f7' }]}>
        <Ionicons name="search" size={20} color="#6b6b71" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, theme.typography.body, { color: '#1c1c1e' }]}
          placeholder="Search songs..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {(searchQuery || isSearching) && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            {isSearching ? (
              <ActivityIndicator size="small" color="#6b6b71" />
            ) : (
              <Ionicons name="close-circle" size={20} color="#6b6b71" />
            )}
          </Pressable>
        )}
      </View>

      {/* Songs List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#123053" />
          <Text style={[theme.typography.body, { color: '#6b6b71', marginTop: 16 }]}>
            Loading songs...
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#123053"
            />
          }
        />
      )}

      {/* Add Button */}
      <Pressable
        style={[styles.fab, { backgroundColor: '#133053' }]}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      {/* Add Song Modal */}
      <AddSongModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadSongs}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heading: {
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  keyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
});
