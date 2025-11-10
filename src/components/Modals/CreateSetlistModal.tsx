import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import { ThemedButton } from '../Buttons/ThemedButton';
import { createSetlist, updateSetlist } from '../../services/data/setlistService';
import { Setlist } from '../../types';

interface CreateSetlistModalProps {
  visible: boolean;
  onClose: () => void;
  bandId: string;
  onSuccess?: (setlist: Setlist) => void;
  setlist?: Setlist;
}

export const CreateSetlistModal = ({
  visible,
  onClose,
  bandId,
  onSuccess,
  setlist,
}: CreateSetlistModalProps) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!setlist;

  useEffect(() => {
    if (setlist) {
      setName(setlist.name);
    } else {
      setName('');
    }
  }, [setlist, visible]);

  const resetState = () => {
    setName('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Setlist name is required.');
      return;
    }

    if (name.trim().length > 100) {
      Alert.alert('Validation', 'Setlist name must be 100 characters or less.');
      return;
    }

    if (!bandId) {
      Alert.alert('Error', 'No active band selected.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && setlist) {
        const updated = await updateSetlist(setlist.id, {
          name: name.trim(),
        });
        Alert.alert('Success', 'Setlist updated successfully.');
        onSuccess?.(updated);
      } else {
        const created = await createSetlist({
          name: name.trim(),
          band_id: bandId,
        });
        Alert.alert('Success', 'Setlist created successfully.');
        onSuccess?.(created);
      }
      handleClose();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save setlist.',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {isEditMode ? 'Edit Setlist' : 'Add Setlist'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#f5f5f5' }]}
            placeholder="Setlist name"
            placeholderTextColor="#a1a1a6"
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
          <ThemedButton
            label={isEditMode ? 'Save Setlist' : 'Add Setlist'}
            onPress={handleSave}
            disabled={isSubmitting}
          />
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
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1c1c1e',
  },
});
