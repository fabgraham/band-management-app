import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { ThemedButton } from '../Buttons/ThemedButton';
import { Song } from '../../types';
import { getSongs } from '../../services/data/songService';
import { addSongsToSetlist } from '../../services/data/setlistService';

interface AddSetlistSongsModalProps {
  visible: boolean;
  onClose: () => void;
  bandId: string;
  setlistId: string;
  excludedSongIds?: string[];
  onSuccess?: () => void;
}

export const AddSetlistSongsModal = ({
  visible,
  onClose,
  bandId,
  setlistId,
  excludedSongIds = [],
  onSuccess,
}: AddSetlistSongsModalProps) => {
  const { theme } = useTheme();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const excludedSet = useMemo(() => new Set(excludedSongIds), [excludedSongIds]);

  const loadSongs = useCallback(async () => {
    if (!bandId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getSongs(bandId);
      setSongs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load songs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    if (visible) {
      loadSongs();
    } else {
      setSelectedSongIds([]);
      setSearchQuery('');
    }
  }, [visible, loadSongs]);

  const availableSongs = useMemo(
    () => songs.filter((song) => !excludedSet.has(song.id)),
    [songs, excludedSet],
  );

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableSongs;
    }
    const q = searchQuery.toLowerCase();
    return availableSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q),
    );
  }, [searchQuery, availableSongs]);

  const toggleSongSelection = (songId: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId],
    );
  };

  const handleAddSongs = async () => {
    if (!selectedSongIds.length) {
      Alert.alert('Select songs', 'Choose at least one song to add.');
      return;
    }

    try {
      const { insertedCount, skippedCount } = await addSongsToSetlist(setlistId, selectedSongIds);
      console.log('[AddSetlistSongsModal] add result', { insertedCount, skippedCount });

      if (insertedCount === 0 && skippedCount > 0) {
        Alert.alert('No changes', 'All selected songs are already in this setlist.');
      } else if (insertedCount > 0 && skippedCount > 0) {
        Alert.alert('Partial success', `${insertedCount} song(s) added. ${skippedCount} already present.`);
      } else if (insertedCount > 0) {
        Alert.alert('Success', `${insertedCount} song(s) added to setlist.`);
      } else {
        Alert.alert('No changes', 'No songs were added. You may not have permission.');
      }
      // Ensure parent refresh happens before closing
      await onSuccess?.();
      onClose();
      setSelectedSongIds([]);
      setSearchQuery('');
    } catch (err) {
      console.error('[AddSetlistSongsModal] add error', err);
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to add songs.',
      );
    }
  };

  const handleClose = () => {
    setSelectedSongIds([]);
    setSearchQuery('');
    onClose();
  };

  const renderItem = ({ item }: { item: Song }) => {
    const isSelected = selectedSongIds.includes(item.id);
    return (
      <Pressable
        style={[
          styles.songRow,
          {
            backgroundColor: isSelected ? 'rgba(19,48,83,0.08)' : '#ffffff',
            borderColor: isSelected ? theme.colors.primary : '#f2f2f7',
          },
        ]}
        onPress={() => toggleSongSelection(item.id)}
      >
        <View>
          <Text style={[theme.typography.callout, { color: '#1c1c1e' }]}>
            {item.title}
          </Text>
          <Text style={{ color: '#6e6e73', marginTop: 2 }}>{item.artist}</Text>
        </View>
        <Ionicons
          name={isSelected ? 'checkbox' : 'square-outline'}
          size={24}
          color={isSelected ? theme.colors.primary : '#c7c7cc'}
        />
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}> 
          <Text style={[styles.title, { color: theme.colors.text }]}>Add Songs</Text>
          <View style={styles.body}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9a9aa0" />
            <TextInput
              placeholder="Search songs..."
              placeholderTextColor="#9a9aa0"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9a9aa0" />
              </Pressable>
            )}
          </View>

          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ marginTop: 12, color: '#6e6e73' }}>Loading songs...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <Ionicons name="alert-circle-outline" size={40} color="#ff3b30" />
              <Text style={{ color: '#ff3b30', marginTop: 8, textAlign: 'center' }}>
                {error}
              </Text>
            </View>
          ) : filteredSongs.length === 0 ? (
            <View style={styles.centerContent}>
              <Ionicons name="musical-notes-outline" size={48} color="#c7c7cc" />
              <Text style={{ color: '#6e6e73', marginTop: 12, textAlign: 'center' }}>
                {availableSongs.length === 0
                  ? 'No songs available to add. Create more songs first.'
                  : 'No songs match your search.'}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, minHeight: 0 }}>
              <FlatList
                data={filteredSongs}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                contentContainerStyle={{ paddingBottom: 24 }}
              />
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={{ color: '#6e6e73' }}>Selected: {selectedSongIds.length}</Text>
          <ThemedButton
            label="Add to Setlist"
            onPress={handleAddSongs}
            disabled={selectedSongIds.length === 0 || loading}
          />
        </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '80%',
    maxHeight: '80%',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1c1c1e',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  footer: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
});
