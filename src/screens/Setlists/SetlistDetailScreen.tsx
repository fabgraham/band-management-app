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
import { AddSetlistSongsModal } from '../../components/Modals/AddSetlistSongsModal';
import { ConfirmModal } from '../../components/Modals/ConfirmModal';
import { ActionMenuModal } from '../../components/Modals/ActionMenuModal';
import { CreateSetlistModal } from '../../components/Modals/CreateSetlistModal';

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
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteSetlistModal, setShowDeleteSetlistModal] = useState(false);
  const [showDeleteSongModal, setShowDeleteSongModal] = useState(false);
  const [songToDelete, setSongToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showSetlistMenu, setShowSetlistMenu] = useState(false);
  const [showEditSetlistModal, setShowEditSetlistModal] = useState(false);

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
  const handleDeleteSetlist = () => {
    console.log('🗑️ handleDeleteSetlist called');
    if (!setlist) return;
    console.log('✅ Setlist exists, showing delete confirmation modal...');
    setShowDeleteSetlistModal(true);
  };

  const confirmDeleteSetlist = async () => {
    console.log('💥 Delete confirmed, deleting setlist...');
    if (!setlist) return;

    try {
      setShowDeleteSetlistModal(false);
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
  const handleRemoveSong = useCallback((entryId: string, songTitle: string) => {
    console.log('🗑️ Remove song button clicked for:', songTitle);
    setSongToDelete({ id: entryId, title: songTitle });
    setShowDeleteSongModal(true);
  }, []);

  const confirmDeleteSong = async () => {
    console.log('💥 Delete song confirmed, removing...');
    if (!songToDelete) return;

    try {
      setShowDeleteSongModal(false);
      await removeSongFromSetlist(songToDelete.id);
      setSongToDelete(null);
      await loadSetlist();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to remove song.'
      );
    }
  };

  const handleDragEnd = async ({ data }: { data: SetlistSongEntry[] }) => {
    console.log('🎯 handleDragEnd called with', data.length, 'songs');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedSongs = data.map((entry, index) => ({
      ...entry,
      order_index: index + 1,
    }));
    setSongs(updatedSongs);
    try {
      await reorderSetlistSongs(
        updatedSongs.map((entry) => ({
          id: entry.id,
          order_index: entry.order_index,
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
    console.log('🚀 handleDragBegin called - drag started');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSongPress = useCallback((songIndex: number) => {
    if (!isEditMode && setlist) {
      console.log('🎵 Song tapped, navigating to performance mode:', songIndex);
      navigation.navigate('PerformanceMode', {
        setlistId: setlist.id,
        songIndex,
      });
    }
  }, [isEditMode, setlist, navigation]);

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<SetlistSongEntry>) => {
    console.log('🎨 Rendering song:', item.song?.title, 'isEditMode:', isEditMode);
    const songIndex = songs.findIndex((s) => s.id === item.id);

    return (
      <View>
        <Pressable
          onPress={() => handleSongPress(songIndex)}
          disabled={isEditMode}
          style={[styles.songRow, isActive && { opacity: 0.9, backgroundColor: '#f5f5f5' }]}
        >
          {/* Hamburger icon - always visible for drag */}
          <Pressable
            onLongPress={drag}
            delayLongPress={200}
            style={styles.dragHandle}
            hitSlop={8}
          >
            <Ionicons name="reorder-three-outline" size={24} color="#6e6e73" />
          </Pressable>

          {/* Song info */}
          <View style={styles.songInfo}>
            <View style={styles.songTitleRow}>
              <Text style={styles.songNumber}>{item.order_index}.</Text>
              <Text style={styles.songTitle} numberOfLines={1}>
                {item.song?.title || 'Unknown Song'}
              </Text>
            </View>
            <Text style={styles.songMeta} numberOfLines={1}>
              {item.song?.artist || 'Unknown Artist'}
              {item.song?.key && ` · ${item.song.key}`}
              {item.song?.duration_seconds && ` · ${Math.floor(item.song.duration_seconds / 60)}:${(item.song.duration_seconds % 60).toString().padStart(2, '0')}`}
            </Text>
          </View>

          {/* Delete button - only visible in edit mode */}
          {isEditMode && (
            <Pressable
              style={styles.songDeleteButton}
              onPress={() => {
                console.log('🗑️ Delete song button pressed:', item.song?.title);
                handleRemoveSong(item.id, item.song?.title || 'Unknown Song');
              }}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={20} color="#ff3b30" />
            </Pressable>
          )}
        </Pressable>
        {/* Divider line */}
        <View style={styles.divider} />
      </View>
    );
  }, [isEditMode, handleRemoveSong, handleSongPress, songs]);

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
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerButton}
            onPress={() => {
              console.log('➕ Add songs button pressed');
              setShowAddSongsModal(true);
            }}
            hitSlop={8}
          >
            <Ionicons name="add" size={22} color="#ffffff" />
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={() => {
              console.log('✏️ Edit mode toggle pressed, current:', isEditMode);
              setIsEditMode(!isEditMode);
            }}
            hitSlop={8}
          >
            {isEditMode ? (
              <Ionicons name="checkmark" size={22} color="#ffffff" />
            ) : (
              <Ionicons name="create-outline" size={22} color="#ffffff" />
            )}
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={() => setShowSetlistMenu(true)}
            hitSlop={8}
          >
            <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {songs.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIconContainer}>
              <Ionicons name="musical-notes" size={48} color="#999" />
            </View>
            <Text style={[theme.typography.title2, { color: '#999', marginTop: 16 }]}>
              No songs yet
            </Text>
            <Text style={[theme.typography.body, { color: '#6e6e73', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }]}>
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
            activationDistance={10}
            extraData={isEditMode}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

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

      <ConfirmModal
        visible={showDeleteSetlistModal}
        title="Delete Setlist"
        message={`Are you sure you want to delete "${setlist.name}"? This will remove all songs from the setlist.`}
        confirmText="Delete"
        destructive={true}
        showCancelButton={false}
        onConfirm={confirmDeleteSetlist}
        onCancel={() => setShowDeleteSetlistModal(false)}
      />

      <ConfirmModal
        visible={showDeleteSongModal}
        title="Remove Song"
        message={`Are you sure you want to remove "${songToDelete?.title}" from this setlist?`}
        confirmText="Remove"
        destructive={true}
        showCancelButton={false}
        onConfirm={confirmDeleteSong}
        onCancel={() => setShowDeleteSongModal(false)}
      />

      <ActionMenuModal
        visible={showSetlistMenu}
        onClose={() => setShowSetlistMenu(false)}
        items={[
          {
            label: 'Edit Setlist',
            icon: 'create-outline',
            onPress: () => {
              setShowEditSetlistModal(true);
            },
          },
          {
            label: 'Delete Setlist',
            icon: 'trash-outline',
            destructive: true,
            onPress: () => {
              handleDeleteSetlist();
            },
          },
        ]}
      />

      <CreateSetlistModal
        visible={showEditSetlistModal}
        onClose={() => setShowEditSetlistModal(false)}
        bandId={setlist.band_id}
        setlist={setlist}
        onSuccess={async () => {
          setShowEditSetlistModal(false);
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
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  listContent: {
    paddingBottom: 16,
  },
  // New song row design with dividers
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  dragHandle: {
    paddingRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  songNumber: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    flex: 1,
  },
  songMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#6e6e73',
  },
  songDeleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5ea',
    marginLeft: 52, // Align with song title (hamburger + padding)
  },
  // Empty state visually aligned with main SetlistsScreen empty state
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
  },
  emptyStateBody: {
    fontSize: 15,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
