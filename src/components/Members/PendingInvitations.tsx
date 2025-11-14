// Pending Invitations Component
// Displays and manages pending band invitations for the current user

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
  getUserPendingInvitations,
  respondToInvitation,
} from '../../services/data/memberService';
import { BandInvitationWithDetails } from '../../types/member';

interface PendingInvitationsProps {
  onInvitationAccepted?: () => void;
}

const PendingInvitations: React.FC<PendingInvitationsProps> = ({ onInvitationAccepted }) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<BandInvitationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    if (!user?.email) return;

    try {
      const data = await getUserPendingInvitations(user.email);
      setInvitations(data);
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Error', 'Failed to load pending invitations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadInvitations();
  };

  const handleRespondToInvitation = async (
    invitation: BandInvitationWithDetails,
    accept: boolean
  ) => {
    if (!user) return;

    setProcessingId(invitation.id);

    try {
      const status = accept ? 'accepted' : 'declined';
      await respondToInvitation(invitation.id, status, user.id);

      if (accept) {
        Alert.alert(
          'Success',
          `You have joined ${invitation.band.name}`,
          [{ text: 'OK', onPress: () => onInvitationAccepted?.() }]
        );
      }

      // Remove the processed invitation from the list
      setInvitations(invitations.filter((inv) => inv.id !== invitation.id));
    } catch (error) {
      console.error('Error responding to invitation:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to process invitation'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const renderInvitation = (invitation: BandInvitationWithDetails) => {
    const inviterName = invitation.inviter?.user_metadata?.full_name || invitation.inviter?.email || 'Someone';
    const isProcessing = processingId === invitation.id;

    return (
      <View key={invitation.id} style={styles.invitationCard}>
        <View style={styles.invitationHeader}>
          <Ionicons name="mail-outline" size={24} color="#007AFF" />
          <View style={styles.invitationInfo}>
            <Text style={styles.bandName} numberOfLines={1}>
              {invitation.band.name}
            </Text>
            <Text style={styles.inviterText}>
              Invited by {inviterName}
            </Text>
            <Text style={styles.roleText}>
              As {invitation.role}
            </Text>
          </View>
        </View>

        <View style={styles.invitationActions}>
          <Pressable
            style={[styles.actionButton, styles.declineButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleRespondToInvitation(invitation, false)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <Text style={styles.declineButtonText}>Decline</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.acceptButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleRespondToInvitation(invitation, true)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading invitations...</Text>
      </View>
    );
  }

  if (invitations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="mail-open-outline" size={48} color="#999" />
        <Text style={styles.emptyTitle}>No pending invitations</Text>
        <Text style={styles.emptyText}>
          When someone invites you to join their band, you'll see it here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Band Invitations</Text>
        <Text style={styles.headerSubtitle}>
          You have {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.invitationsList}>
        {invitations.map(renderInvitation)}
      </View>

      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
        <Text style={styles.footerText}>
          Invitations expire after 7 days if not accepted
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  invitationsList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  invitationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  invitationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bandName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  inviterText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});

export default PendingInvitations;