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
import { showConfirm } from '../../utils/helpers/confirm';

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

  // Delete Setlist Handler
  const handleDeleteSetlist = async () => {
    if (!setlist) return;

    const confirmed = await showConfirm(
      'Delete Setlist',
      `Are you sure you want to delete "${setlist.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSetlist(setlist.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to delete setlist.'
      );
    }
  };

  // Remove Song Handler
  const handleRemoveSong = async (entryId: string, songTitle: string) => {
    const confirmed = await showConfirm(
      'Remove Song',
      `Are you sure you want to remove "${songTitle}" from this setlist?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await removeSongFromSetlist(entryId);
      await loadSetlist();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to remove song.'
      );
    }
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

  const renderItem = ({ item, drag, isActive }: RenderItemParams<SetlistSongEntry>) => (
    <Pressable
      onLongPress={drag}
      disabled={isActive}
      style={[styles.songCard, isActive && { opacity: 0.9 }]}
    >
      <View style={styles.songHeader}>
        <View style={styles.songTitleWrapper}>
          <View style={styles.songIndexBadge}>
            <Text style={styles.songIndexText}>{item.order_index}</Text>
          </View>
          <View>
            <Text style={styles.songTitle} numberOfLines={1}>
              {item.song.title}
            </Text>
            <Text style={styles.songMeta} numberOfLines={1}>
              {item.song.artist}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.songDeleteButton}
          onPress={() => handleRemoveSong(item.id, item.song.title)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
        </Pressable>
      </View>
      {/* optional meta row if you were using it before */}
      {/* <View style={styles.songMetaRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>Key: {item.song.key}</Text>
        </View>
      </View> */}
    </Pressable>
  );

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
        <Pressable
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]} numberOfLines={1}>
          {setlist.name}
        </Text>
        <View style={styles.headerActions} pointerEvents="box-none">
          <Pressable
            style={styles.headerButton}
            onPress={() => setShowAddSongsModal(true)}
            hitSlop={8}
          >
            <Ionicons name="add" size={22} color="#ffffff" />
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={() => setShowEditModal(true)}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={22} color="#ffffff" />
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={handleDeleteSetlist}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={22} color="#ff3b30" />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {songs.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
              No songs yet in this setlist
            </Text>
            <Text style={styles.emptyStateBody}>
              Tap the + icon above to add songs.
            </Text>
          </View>
        ) : (
          <DraggableFlatList
            data={songs}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            onDragBegin={handleDragBegin}
            onDragEnd={handleDragEnd}
            contentContainerStyle={styles.listContent}
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
    padding: 20,
  },
  listContent: {
    paddingBottom: 16,
  },
  // Song rows: same clean, card-like feel as InfoCard
  songCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginBottom: 12,
  },
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  songMeta: {
    marginTop: 2,
    fontSize: 13,
    color: '#6e6e73',
  },
  songDeleteButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  // Empty state visually aligned with main SetlistsScreen empty state
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyStateBody: {
    fontSize: 15,
    color: '#6e6e73',
    marginTop: 4,
    textAlign: 'center',
  },
});
