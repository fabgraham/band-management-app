import { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../theme';
import { ThemedButton } from '../Buttons/ThemedButton';
import { useBand } from '../../context/BandContext';
import { createSong, updateSong, getSongCount } from '../../services/data/songService';
import { CreateSongPayload, Song } from '../../types';

interface AddSongModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  song?: Song; // Optional: if provided, modal is in edit mode
}

const MUSICAL_KEYS = [
  '',
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm',
];

export const AddSongModal = ({
  visible,
  onClose,
  onSuccess,
  song,
}: AddSongModalProps) => {
  const { theme } = useTheme();
  const { activeBand } = useBand();
  const isEditMode = !!song;

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist);
      setSelectedKey(song.key || '');
      setBpm(song.bpm ? song.bpm.toString() : '');

      // Convert duration_seconds to MM:SS
      if (song.duration_seconds) {
        const mins = Math.floor(song.duration_seconds / 60);
        const secs = song.duration_seconds % 60;
        setDurationMinutes(mins.toString());
        setDurationSeconds(secs.toString());
      } else {
        setDurationMinutes('');
        setDurationSeconds('');
      }

      setLyrics(song.lyrics || '');
      setNotes(song.notes || '');
    }
  }, [song]);

  const handleAddSong = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a song title');
      return;
    }

    if (!artist.trim()) {
      Alert.alert('Error', 'Please enter an artist name');
      return;
    }

    if (!activeBand) {
      Alert.alert('Error', 'No active band selected');
      return;
    }

    if (title.trim().length > 100) {
      Alert.alert('Error', 'Song title must be 100 characters or less');
      return;
    }

    if (artist.trim().length > 100) {
      Alert.alert('Error', 'Artist name must be 100 characters or less');
      return;
    }

    // Validate BPM if provided
    const bpmNum = bpm ? parseInt(bpm, 10) : null;
    if (bpm && (isNaN(bpmNum as number) || (bpmNum as number) <= 0 || (bpmNum as number) > 300)) {
      Alert.alert('Error', 'BPM must be between 1 and 300');
      return;
    }

    // Calculate duration in seconds
    let durationInSeconds: number | null = null;
    if (durationMinutes || durationSeconds) {
      const mins = durationMinutes ? parseInt(durationMinutes, 10) : 0;
      const secs = durationSeconds ? parseInt(durationSeconds, 10) : 0;

      if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs >= 60) {
        Alert.alert('Error', 'Invalid duration format');
        return;
      }

      durationInSeconds = mins * 60 + secs;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && song) {
        // Update existing song
        const payload = {
          title: title.trim(),
          artist: artist.trim(),
          key: selectedKey || null,
          bpm: bpmNum,
          duration_seconds: durationInSeconds,
          lyrics: lyrics.trim() || null,
          notes: notes.trim() || null,
        };

        await updateSong(song.id, payload);
        Alert.alert('Success', 'Song updated successfully');
      } else {
        // Check freemium limit (10 songs for free users) only when creating
        const songCount = await getSongCount(activeBand.id);

        // TODO: Check user subscription tier
        // For now, we'll allow creation if under 10 songs
        if (songCount >= 10) {
          Alert.alert(
            'Upgrade Required',
            'Free users can create up to 10 songs per band. Upgrade to Pro for unlimited songs.',
          );
          setIsSubmitting(false);
          return;
        }

        // Create new song
        const payload: CreateSongPayload = {
          title: title.trim(),
          artist: artist.trim(),
          band_id: activeBand.id,
          key: selectedKey || null,
          bpm: bpmNum,
          duration_seconds: durationInSeconds,
          lyrics: lyrics.trim() || null,
          notes: notes.trim() || null,
        };

        await createSong(payload);
        Alert.alert('Success', 'Song added successfully');
      }

      // Success - reset form
      setTitle('');
      setArtist('');
      setSelectedKey('');
      setBpm('');
      setDurationMinutes('');
      setDurationSeconds('');
      setLyrics('');
      setNotes('');

      onClose();
      onSuccess?.();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add song',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setArtist('');
    setSelectedKey('');
    setBpm('');
    setDurationMinutes('');
    setDurationSeconds('');
    setLyrics('');
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlayCentered}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.modalCard, { backgroundColor: '#ffffff' }]}>
          <View style={styles.header}>
            <Text style={[theme.typography.title1, { color: '#1c1c1e', textAlign: 'center' }]}>
              {isEditMode ? 'Edit Song' : 'Add Song'}
            </Text>
            <Text style={[theme.typography.body, { color: '#6b6b71', marginTop: 4, textAlign: 'center' }]}>
              {isEditMode ? `Update "${song?.title}"` : `Add a new song to ${activeBand?.name}`}
            </Text>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            {/* Artist */}
            <Text style={[styles.label, theme.typography.subheadline, { color: '#1c1c1e' }]}>
              Artist <Text style={{ color: '#ff3b30' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#f2f2f7', color: '#1c1c1e' }, theme.typography.body]}
              placeholder="Artist name"
              placeholderTextColor="#999999"
              value={artist}
              onChangeText={setArtist}
              maxLength={100}
              returnKeyType="next"
            />

            {/* Title */}
            <Text style={[styles.label, theme.typography.subheadline, { color: '#1c1c1e' }]}>
              Title <Text style={{ color: '#ff3b30' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#f2f2f7', color: '#1c1c1e' }, theme.typography.body]}
              placeholder="Song title"
              placeholderTextColor="#999999"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              returnKeyType="next"
            />

            {/* Lyrics */}
            <Text style={[styles.label, theme.typography.subheadline, { color: '#1c1c1e' }]}>
              Lyrics
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: '#f2f2f7', color: '#1c1c1e' }, theme.typography.body]}
              placeholder="Enter lyrics here..."
              placeholderTextColor="#999999"
              value={lyrics}
              onChangeText={setLyrics}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            {/* Duration */}
            <Text style={[styles.label, theme.typography.subheadline, { color: '#1c1c1e' }]}>
              Duration
            </Text>
            <View style={styles.durationContainer}>
              <TextInput
                style={[styles.durationInput, { backgroundColor: '#f2f2f7', color: '#1c1c1e' }, theme.typography.body]}
                placeholder="MM"
                placeholderTextColor="#999999"
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[theme.typography.body, { color: '#1c1c1e', marginHorizontal: 8 }]}>:</Text>
              <TextInput
                style={[styles.durationInput, { backgroundColor: '#f2f2f7', color: '#1c1c1e' }, theme.typography.body]}
                placeholder="SS"
                placeholderTextColor="#999999"
                value={durationSeconds}
                onChangeText={setDurationSeconds}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            {/* Key */}
            <Text style={[styles.label, theme.typography.subheadline, { color: '#1c1c1e' }]}>
              Key
            </Text>
            <View style={[styles.pickerContainer, { backgroundColor: '#f2f2f7' }]}>
              <Picker
                selectedValue={selectedKey}
                onValueChange={(itemValue) => setSelectedKey(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select key (optional)" value="" />
                {MUSICAL_KEYS.slice(1).map((key) => (
                  <Picker.Item key={key} label={key} value={key} />
                ))}
              </Picker>
            </View>

            {/* BPM */}
            <Text style={[styles.label, theme.typography.subheadline, { color: '#1c1c1e' }]}>
              BPM (Beats Per Minute)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#f2f2f7', color: '#1c1c1e' }, theme.typography.body]}
              placeholder="e.g., 120"
              placeholderTextColor="#999999"
              value={bpm}
              onChangeText={setBpm}
              keyboardType="number-pad"
              returnKeyType="next"
            />

            {/* Notes */}
            <Text style={[styles.label, theme.typography.subheadline, { color: '#1c1c1e' }]}>
              Notes
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: '#f2f2f7', color: '#1c1c1e' }, theme.typography.body]}
              placeholder="Add any notes (chords, tempo changes, etc.)"
              placeholderTextColor="#999999"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.footerRow}>
            <ThemedButton
              label={isSubmitting ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Song')}
              onPress={handleAddSong}
              style={styles.primaryButton}
              disabled={isSubmitting || !title.trim() || !artist.trim()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '80%',
    maxHeight: '80%',
    borderRadius: 18,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    marginBottom: 20,
  },
  scrollView: {
    marginBottom: 12,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: 70,
    textAlign: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
  },
});
