import { useState } from 'react';
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
import { useBand } from '../../context/BandContext';

interface CreateBandModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateBandModal = ({
  visible,
  onClose,
  onSuccess,
}: CreateBandModalProps) => {
  const { theme } = useTheme();
  const { createBand, checkCanCreateBand, loading } = useBand();
  const [bandName, setBandName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBand = async () => {
    // Validation
    if (!bandName.trim()) {
      Alert.alert('Error', 'Please enter a band name');
      return;
    }

    if (bandName.trim().length > 50) {
      Alert.alert('Error', 'Band name must be 50 characters or less');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check freemium limit
      const { canCreate, reason } = await checkCanCreateBand();

      if (!canCreate) {
        Alert.alert('Upgrade Required', reason || 'Cannot create more bands');
        setIsSubmitting(false);
        return;
      }

      // Create the band
      await createBand(bandName.trim());

      // Success
      setBandName('');
      onClose();
      onSuccess?.();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create band',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setBandName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: '#ffffff' },
            ]}
          >
            <Text style={[theme.typography.title1, { marginBottom: 8, color: '#1c1c1e' }]}>
              Create a Band
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: '#6b6b71', marginBottom: 24 },
              ]}
            >
              What's the name of your new band?
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: '#f2f2f7',
                  color: '#1c1c1e',
                  borderColor: '#e5e5ea',
                },
                theme.typography.body,
              ]}
              placeholder="Band name"
              placeholderTextColor="#999999"
              value={bandName}
              onChangeText={setBandName}
              maxLength={50}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateBand}
            />

            <Text
              style={[
                theme.typography.footnote,
                { color: '#999999', marginBottom: 24 },
              ]}
            >
              {bandName.length}/50 characters
            </Text>

            <View style={styles.buttonContainer}>
              <ThemedButton
                label="Cancel"
                onPress={handleClose}
                backgroundColor="transparent"
                style={[styles.button, { borderWidth: 1, borderColor: '#123053' }]}
                textStyle={{ color: '#123053' }}
                disabled={isSubmitting || loading}
              />
              <ThemedButton
                label={isSubmitting ? 'Creating...' : 'Create'}
                onPress={handleCreateBand}
                backgroundColor="#123053"
                style={styles.button}
                disabled={isSubmitting || loading || !bandName.trim()}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});