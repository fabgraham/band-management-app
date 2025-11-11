import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { AddSongModal } from '../../components/Modals/AddSongModal';
import { getSongById, deleteSong } from '../../services/data/songService';
import { Song } from '../../types';
import { LibraryStackParamList } from '../../navigation/libraryStack.types';

type SongDetailRouteProp = RouteProp<LibraryStackParamList, 'SongDetail'>;
type SongDetailNavigationProp = NativeStackNavigationProp<LibraryStackParamList, 'SongDetail'>;

export const SongDetailScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<SongDetailNavigationProp>();
  const route = useRoute<SongDetailRouteProp>();
  const { songId } = route.params;

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load song details
  const loadSong = useCallback(async () => {
    try {
      setLoading(true);
      const foundSong = await getSongById(songId);
      setSong(foundSong);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load song',
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [songId, navigation]);

  useEffect(() => {
    loadSong();
  }, [loadSong]);

  // Handle delete
  const handleDelete = () => {
    if (!song) return;

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
              navigation.goBack();
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
    if (!seconds) return 'Not set';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#123053" />
          <Text style={[theme.typography.body, { color: '#6b6b71', marginTop: 16 }]}>
            Loading song...
          </Text>
        </View>
      </View>
    );
  }

  if (!song) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton} onPress={() => setShowEditModal(true)}>
            <Ionicons name="create-outline" size={22} color="#ffffff" />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Song Title & Artist */}
        <View style={styles.titleSection}>
          <Text style={[theme.typography.largeTitle, { color: '#1c1c1e', marginBottom: 8 }]}>
            {song.title}
          </Text>
          <Text style={[theme.typography.title2, { color: '#6b6b71' }]}>
            {song.artist}
          </Text>
        </View>

        {/* Song Metadata */}
        <View style={styles.metadataSection}>
          <View style={styles.metadataRow}>
            {song.key && (
              <View style={styles.metadataItem}>
                <Ionicons name="musical-note" size={20} color="#123053" />
                <Text style={[theme.typography.callout, { color: '#1c1c1e', marginLeft: 8 }]}>
                  Key: {song.key}
                </Text>
              </View>
            )}
            {song.bpm && (
              <View style={styles.metadataItem}>
                <Ionicons name="speedometer-outline" size={20} color="#123053" />
                <Text style={[theme.typography.callout, { color: '#1c1c1e', marginLeft: 8 }]}>
                  {song.bpm} BPM
                </Text>
              </View>
            )}
          </View>

          {song.duration_seconds && (
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={20} color="#123053" />
              <Text style={[theme.typography.callout, { color: '#1c1c1e', marginLeft: 8 }]}>
                Duration: {formatDuration(song.duration_seconds)}
              </Text>
            </View>
          )}
        </View>

        {/* Lyrics Section */}
        {song.lyrics && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={24} color="#123053" />
              <Text style={[theme.typography.title2, { color: '#1c1c1e', marginLeft: 8 }]}>
                Lyrics
              </Text>
            </View>
            <View style={[styles.contentBox, { backgroundColor: '#ffffff', borderColor: '#e5e5ea' }]}>
              <Text style={[theme.typography.body, { color: '#1c1c1e', lineHeight: 24 }]}>
                {song.lyrics}
              </Text>
            </View>
          </View>
        )}

        {/* Notes Section */}
        {song.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="clipboard-outline" size={24} color="#123053" />
              <Text style={[theme.typography.title2, { color: '#1c1c1e', marginLeft: 8 }]}>
                Notes
              </Text>
            </View>
            <View style={[styles.contentBox, { backgroundColor: '#ffffff', borderColor: '#e5e5ea' }]}>
              <Text style={[theme.typography.body, { color: '#1c1c1e', lineHeight: 24 }]}>
                {song.notes}
              </Text>
            </View>
          </View>
        )}

        {/* Empty state for no lyrics or notes */}
        {!song.lyrics && !song.notes && (
          <View style={styles.emptyContent}>
            <Ionicons name="document-outline" size={48} color="#c7c7cc" />
            <Text style={[theme.typography.body, { color: '#6b6b71', marginTop: 12, textAlign: 'center' }]}>
              No lyrics or notes added yet.{'\n'}
              Tap the edit button to add them.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Song Modal */}
      {showEditModal && song && (
        <AddSongModal
          visible={showEditModal}
          song={song}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            loadSong();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#133053',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  metadataSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 48,
  },
});
