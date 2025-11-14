// Invite Member Modal
// Modal for inviting new members to a band

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { createBandInvitation } from '../../services/data/memberService';
import { BandMemberRole, getRoleDescription } from '../../types/member';

interface InviteMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bandId: string;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  visible,
  onClose,
  onSuccess,
  bandId,
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<BandMemberRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (visible) {
      setEmail('');
      setSelectedRole('member');
      setEmailError('');
      setIsSubmitting(false);
    }
  }, [visible]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text.toLowerCase().trim());
    if (emailError) {
      setEmailError('');
    }
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setEmailError('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (email === user?.email) {
      setEmailError('You cannot invite yourself');
      return;
    }

    setIsSubmitting(true);

    try {
      await createBandInvitation({
        band_id: bandId,
        invited_email: email,
        role: selectedRole,
      });

      Alert.alert('Success', `Invitation sent to ${email}`);
      onSuccess();
    } catch (error) {
      console.error('Error creating invitation:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('unique')) {
          setEmailError('This person is already a member or has a pending invitation');
        } else {
          Alert.alert('Error', error.message);
        }
      } else {
        Alert.alert('Error', 'Failed to send invitation');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions: { value: BandMemberRole; label: string }[] = [
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Invite Member</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                placeholder="Enter email address"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : (
                <Text style={styles.helpText}>
                  Enter the email address of the person you want to invite
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Role</Text>
              <Text style={styles.description}>
                Choose what this member can do in your band
              </Text>
              
              {roleOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.roleOption,
                    selectedRole === option.value && styles.roleOptionSelected,
                  ]}
                  onPress={() => setSelectedRole(option.value)}
                  disabled={isSubmitting}
                >
                  <View style={styles.roleOptionContent}>
                    <View style={styles.roleOptionHeader}>
                      <View style={styles.radioButton}>
                        {selectedRole === option.value && (
                          <View style={styles.radioButtonSelected} />
                        )}
                      </View>
                      <Text style={styles.roleOptionLabel}>{option.label}</Text>
                    </View>
                    <Text style={styles.roleOptionDescription}>
                      {getRoleDescription(option.value)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={styles.infoSection}>
              <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
              <Text style={styles.infoText}>
                The invited person will receive an email with instructions to join your band.
                Invitations expire after 7 days.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.submitButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Send Invitation</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  roleOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  roleOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  roleOptionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    marginRight: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default InviteMemberModal;