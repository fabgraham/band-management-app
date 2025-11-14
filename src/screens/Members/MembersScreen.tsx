// Members Management Screen
// Displays band members and handles member invitations

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useBand } from '../../context/BandContext';
import {
  getBandMembers,
  getBandMemberStats,
  removeBandMember,
  updateBandMember,
} from '../../services/data/memberService';
import {
  BandMemberWithDetails,
  MemberStats,
  BandMemberRole,
  hasPermission,
  getRoleDisplayName,
  getRoleDescription,
  canManageMember,
} from '../../types/member';
import InviteMemberModal from '../../components/Modals/InviteMemberModal';
import ConfirmModal from '../../components/Modals/ConfirmModal';

interface MembersScreenProps {
  bandId: string;
}

const MembersScreen: React.FC<MembersScreenProps> = ({ bandId }) => {
  const { user } = useAuth();
  const { activeBand } = useBand();
  const [members, setMembers] = useState<BandMemberWithDetails[]>([]);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<BandMemberWithDetails | null>(null);

  // Get current user's role in the band
  const currentUserRole = activeBand?.current_user_role as BandMemberRole | undefined;
  const canInviteMembers = hasPermission(currentUserRole, 'can_invite_members');
  const canManageMembers = hasPermission(currentUserRole, 'can_manage_members');

  const loadMembers = useCallback(async () => {
    try {
      const [membersData, statsData] = await Promise.all([
        getBandMembers(bandId),
        getBandMemberStats(bandId),
      ]);
      setMembers(membersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'Failed to load band members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bandId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMembers();
  };

  const handleRemoveMember = async (member: BandMemberWithDetails) => {
    if (!canManageMembers) {
      Alert.alert('Permission Denied', 'You do not have permission to remove members');
      return;
    }

    if (member.role === 'owner') {
      Alert.alert('Cannot Remove Owner', 'You cannot remove the band owner');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.user?.user_metadata?.full_name || member.user?.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeBandMember(member.id);
              loadMembers();
              Alert.alert('Success', 'Member removed successfully');
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = (member: BandMemberWithDetails) => {
    if (!canManageMembers || !canManageMember(currentUserRole!, member.role)) {
      Alert.alert('Permission Denied', 'You do not have permission to change this member\'s role');
      return;
    }

    setSelectedMember(member);
    setShowRoleModal(true);
  };

  const handleRoleChange = async (newRole: BandMemberRole) => {
    if (!selectedMember) return;

    try {
      await updateBandMember(selectedMember.id, { role: newRole });
      loadMembers();
      setShowRoleModal(false);
      setSelectedMember(null);
      Alert.alert('Success', 'Member role updated successfully');
    } catch (error) {
      console.error('Error updating member role:', error);
      Alert.alert('Error', 'Failed to update member role');
    }
  };

  const renderMember = (member: BandMemberWithDetails) => {
    const userName = member.user?.user_metadata?.full_name || member.user?.email?.split('@')[0] || 'Unknown User';
    const userEmail = member.user?.email || '';
    const isCurrentUser = member.user_id === user?.id;

    return (
      <View key={member.id} style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberName} numberOfLines={1}>
              {userName}
              {isCurrentUser && <Text style={styles.youLabel}> (You)</Text>}
            </Text>
            <View style={[styles.roleBadge, styles[`${member.role}Badge`]]}>
              <Text style={[styles.roleText, styles[`${member.role}Text`]]}>
                {getRoleDisplayName(member.role)}
              </Text>
            </View>
          </View>
          <Text style={styles.memberEmail} numberOfLines={1}>
            {userEmail}
          </Text>
          <Text style={styles.memberJoined}>
            Joined {new Date(member.joined_at).toLocaleDateString()}
          </Text>
        </View>

        {canManageMembers && !isCurrentUser && (
          <View style={styles.memberActions}>
            <Pressable
              onPress={() => handleChangeRole(member)}
              style={styles.actionButton}
              disabled={!canManageMember(currentUserRole!, member.role)}
            >
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </Pressable>
            <Pressable
              onPress={() => handleRemoveMember(member)}
              style={styles.actionButton}
              disabled={member.role === 'owner'}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Member Statistics */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_members}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.role_counts.owner}</Text>
              <Text style={styles.statLabel}>Owners</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.role_counts.admin}</Text>
              <Text style={styles.statLabel}>Admins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.role_counts.member}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
          </View>
        )}

        {/* Members List */}
        <View style={styles.membersList}>
          <Text style={styles.sectionTitle}>Band Members</Text>
          {members.map(renderMember)}
        </View>

        {/* Empty State */}
        {members.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#999" />
            <Text style={styles.emptyTitle}>No members yet</Text>
            <Text style={styles.emptyText}>
              {canInviteMembers
                ? 'Invite members to join your band'
                : 'Ask an admin to invite members to your band'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Invite Members Button */}
      {canInviteMembers && (
        <Pressable style={styles.inviteButton} onPress={() => setShowInviteModal(true)}>
          <Ionicons name="person-add-outline" size={24} color="#FFFFFF" />
          <Text style={styles.inviteButtonText}>Invite Member</Text>
        </Pressable>
      )}

      {/* Modals */}
      <InviteMemberModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          setShowInviteModal(false);
          loadMembers();
        }}
        bandId={bandId}
      />

      <ConfirmModal
        visible={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedMember(null);
        }}
        title="Change Member Role"
        message={`Select a new role for ${selectedMember?.user?.user_metadata?.full_name || selectedMember?.user?.email}:`}
        confirmText="Save"
        onConfirm={() => {
          if (selectedMember) {
            // This will be handled by a role selection component
            // For now, we'll cycle through roles
            const roles: BandMemberRole[] = ['member', 'admin'];
            const currentIndex = roles.indexOf(selectedMember.role);
            const nextRole = roles[(currentIndex + 1) % roles.length];
            handleRoleChange(nextRole);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  membersList: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  youLabel: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  memberJoined: {
    fontSize: 12,
    color: '#999',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  ownerBadge: {
    backgroundColor: '#FFD60A',
  },
  adminBadge: {
    backgroundColor: '#34C759',
  },
  memberBadge: {
    backgroundColor: '#007AFF',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ownerText: {
    color: '#333',
  },
  adminText: {
    color: '#FFFFFF',
  },
  memberText: {
    color: '#FFFFFF',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
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
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MembersScreen;