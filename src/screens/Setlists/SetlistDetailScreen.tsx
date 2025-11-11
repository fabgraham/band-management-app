import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import {
  deleteSetlist,
  getSetlistWithSongs,
  removeSongFromSetlist,
  reorderSetlistSongs,
} from '../../services/data/setlistService';
import { SetlistDetail, SetlistSongEntry } from '../../types';
import { BandsStackParamList } from '../../navigation/bandsStack.types';
// Removed in-card Add Songs button; using header + icon instead
import { CreateSetlistModal } from '../../components/Modals/CreateSetlistModal';
import { AddSetlistSongsModal } from '../../components/Modals/AddSetlistSongsModal';

type NavigationProp = NativeStackNavigationProp<BandsStackParamList, 'SetlistDetail'>;
type RouteProps = RouteProp<BandsStackParamList, 'SetlistDetail'>;

export const SetlistDetailScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { setlistId } = route.params;

  const [setlist, setSetlist] = useState<SetlistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<SetlistSongEntry[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);

  const loadSetlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSetlistWithSongs(setlistId);
      setSetlist(data);
      setSongs(data.songs);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load setlist.',
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, setlistId]);

  useFocusEffect(
    useCallback(() => {
      loadSetlist();
    }, [loadSetlist]),
  );

  const totalDuration = useMemo(() => {
    return songs.reduce((acc, entry) => acc + (entry.song?.duration_seconds ?? 0), 0);
  }, [songs]);

  const totalDurationLabel = useMemo(() => {
    if (!totalDuration) return '0:00';
    const mins = Math.floor(totalDuration / 60);
    const secs = totalDuration % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [totalDuration]);

  const formatDate = (value?: string | null) => {
    if (!value) return 'No date set';
    return new Date(`${value}T00:00:00`).toLocaleDateString();
  };

  const handleDeleteSetlist = () => {
    if (!setlist) return;

    Alert.alert(
      'Delete Setlist',
      `Delete "${setlist.name}"? This will remove all songs from this setlist.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSetlist(setlist.id);
              Alert.alert('Success', 'Setlist deleted successfully.');
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete setlist.',
              );
            }
          },
        },
      ],
    );
  };

  const handleRemoveSong = (entryId: string, songTitle: string) => {
    Alert.alert(
      'Remove Song',
      `Remove "${songTitle}" from this setlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSongFromSetlist(entryId);
              await loadSetlist();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to remove song.',
              );
            }
          },
        },
      ],
    );
  };

  const handleDragEnd = async ({ data }: { data: SetlistSongEntry[] }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSongs(data);
    try {
      await reorderSetlistSongs(
        data.map((entry, index) => ({
          id: entry.id,
          order_index: index + 1,
        })),
      );
      await loadSetlist();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to reorder songs.',
      );
    }
  };

  const handleDragBegin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<SetlistSongEntry>) => {
    const index = (getIndex?.() ?? 0) + 1;
    const duration = item.song?.duration_seconds;
    const minutes = duration ? Math.floor(duration / 60) : null;
    const seconds = duration ? duration % 60 : null;

    return (
      <Pressable
        style={[
          styles.songCard,
          { backgroundColor: theme.colors.card, borderColor: isActive ? theme.colors.primary : '#e5e5ea' },
        ]}
        onLongPress={drag}
        delayLongPress={80}
      >
        <View style={styles.songHeader}>
          <View style={styles.songTitleWrapper}>
            <View style={styles.songIndexBadge}>
              <Text style={styles.songIndexText}>{index}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[theme.typography.callout, { color: '#1c1c1e' }]}>
                {item.song?.title ?? 'Untitled'}
              </Text>
              <Text style={{ color: '#6e6e73', marginTop: 4 }}>
                {item.song?.artist ?? 'Unknown Artist'}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => handleRemoveSong(item.id, item.song?.title ?? 'this song')}>
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          </Pressable>
        </View>

        <View style={styles.songMetaRow}>
          {item.song?.key && (
            <View style={styles.metaChip}>
              <Ionicons name="musical-note" size={14} color={theme.colors.primary} />
              <Text style={styles.metaChipText}>{item.song.key}</Text>
            </View>
          )}
          {duration && (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.metaChipText}>
                {minutes}:{seconds?.toString().padStart(2, '0')}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: '#6e6e73' }}>Loading setlist...</Text>
      </View>
    );
  }

  if (!setlist) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]} numberOfLines={1}>
          {setlist.name}
        </Text>
        <View style={styles.headerActions}>
          {/* Add songs (+) icon */}
          <Pressable style={styles.headerButton} onPress={() => setShowAddSongsModal(true)}>
            <Ionicons name="add" size={22} color="#ffffff" />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={() => setShowEditModal(true)}>
            <Ionicons name="create-outline" size={22} color="#ffffff" />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={handleDeleteSetlist}>
            <Ionicons name="trash-outline" size={22} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={[theme.typography.title2, { color: '#1c1c1e' }]}>{setlist.name}</Text>
          <Text style={{ color: '#6e6e73', marginTop: 4 }}>{formatDate(setlist.show_date)}</Text>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>Songs</Text>
              <Text style={styles.statValue}>{songs.length}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{totalDurationLabel}</Text>
            </View>
          </View>
        </View>

        {songs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-circle-outline" size={72} color="#c7c7cc" />
            <Text style={[theme.typography.title2, { color: '#1c1c1e', marginTop: 16 }]}>
              You have no songs in this setlist yet.
            </Text>
            <Text style={{ color: '#6e6e73', marginTop: 8, textAlign: 'center' }}>
              Tap the + icon on the top menu to add songs.
            </Text>
          </View>
        ) : (
          <DraggableFlatList
            data={songs}
            keyExtractor={(item) => item.id}
            onDragEnd={handleDragEnd}
            onDragBegin={handleDragBegin}
            renderItem={renderItem}
            containerStyle={{ paddingBottom: 40 }}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>

      <CreateSetlistModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        bandId={setlist.band_id}
        setlist={setlist}
        onSuccess={async () => {
          setShowEditModal(false);
          await loadSetlist();
        }}
      />

      <AddSetlistSongsModal
        visible={showAddSongsModal}
        onClose={() => setShowAddSongsModal(false)}
        bandId={setlist.band_id}
        setlistId={setlist.id}
        excludedSongIds={songs.map((entry) => entry.song_id)}
        onSuccess={async () => {
          setShowAddSongsModal(false);
          await loadSetlist();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#133053',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 16,
  },
  statLabel: {
    color: '#6e6e73',
    fontSize: 13,
  },
  statValue: {
    color: '#1c1c1e',
    fontSize: 20,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  songCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  songTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  songIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(19,48,83,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songIndexText: {
    color: '#133053',
    fontWeight: '700',
  },
  songMetaRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19,48,83,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  metaChipText: {
    color: '#133053',
    fontWeight: '600',
  },
});
