// Member Management Service
// Handles CRUD operations for band members and invitations

import { supabase } from '../supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import {
  BandMember,
  BandInvitation,
  CreateBandMemberPayload,
  CreateBandInvitationPayload,
  UpdateBandMemberPayload,
  UpdateBandInvitationPayload,
  BandMemberWithDetails,
  BandInvitationWithDetails,
  MemberStats,
} from '../../types/member';

const BAND_MEMBERS_TABLE = 'band_members';
const BAND_INVITATIONS_TABLE = 'band_invitations';

// Error handling helper
const handleError = (error: PostgrestError | null, context: string) => {
  if (error) {
    console.error(context, error);
    throw new Error(`${context}: ${error.message}`);
  }
};

// ====================
// BAND MEMBERS
// ====================

/**
 * Get all members of a band with user details
 */
export async function getBandMembers(bandId: string): Promise<BandMemberWithDetails[]> {
  const { data, error } = await supabase
    .from(BAND_MEMBERS_TABLE)
    .select(`
      *,
      user:auth.users!user_id (
        id,
        email,
        user_metadata
      )
    `)
    .eq('band_id', bandId)
    .order('role', { ascending: false }) // owner first, then admin, then member
    .order('joined_at', { ascending: true });

  handleError(error, 'Error fetching band members');
  return data || [];
}

/**
 * Get a specific band member
 */
export async function getBandMember(memberId: string): Promise<BandMemberWithDetails | null> {
  const { data, error } = await supabase
    .from(BAND_MEMBERS_TABLE)
    .select(`
      *,
      user:auth.users!user_id (
        id,
        email,
        user_metadata
      )
    `)
    .eq('id', memberId)
    .single();

  handleError(error, 'Error fetching band member');
  return data;
}

/**
 * Get current user's membership in a band
 */
export async function getCurrentUserBandMembership(
  bandId: string,
  userId: string
): Promise<BandMember | null> {
  const { data, error } = await supabase
    .from(BAND_MEMBERS_TABLE)
    .select('*')
    .eq('band_id', bandId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found is OK
    handleError(error, 'Error fetching user band membership');
  }
  return data;
}

/**
 * Get member statistics for a band
 */
export async function getBandMemberStats(bandId: string): Promise<MemberStats> {
  const { data, error } = await supabase
    .from(BAND_MEMBERS_TABLE)
    .select('role')
    .eq('band_id', bandId);

  handleError(error, 'Error fetching member statistics');

  const roleCounts = {
    owner: 0,
    admin: 0,
    member: 0,
  };

  data?.forEach((member) => {
    roleCounts[member.role as keyof typeof roleCounts]++;
  });

  // Get pending invitations count
  const { count: pendingCount, error: pendingError } = await supabase
    .from(BAND_INVITATIONS_TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('band_id', bandId)
    .eq('status', 'pending');

  if (pendingError) {
    console.error('Error fetching pending invitations count', pendingError);
  }

  return {
    total_members: data?.length || 0,
    role_counts: roleCounts,
    pending_invitations: pendingCount || 0,
  };
}

/**
 * Add a member to a band (used for invitation acceptance)
 */
export async function addBandMember(payload: CreateBandMemberPayload): Promise<BandMember> {
  const { data, error } = await supabase
    .from(BAND_MEMBERS_TABLE)
    .insert(payload)
    .select()
    .single();

  handleError(error, 'Error adding band member');
  return data!;
}

/**
 * Update a band member (role changes)
 */
export async function updateBandMember(
  memberId: string,
  updates: UpdateBandMemberPayload
): Promise<BandMember> {
  const { data, error } = await supabase
    .from(BAND_MEMBERS_TABLE)
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();

  handleError(error, 'Error updating band member');
  return data!;
}

/**
 * Remove a member from a band
 */
export async function removeBandMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from(BAND_MEMBERS_TABLE)
    .delete()
    .eq('id', memberId);

  handleError(error, 'Error removing band member');
}

// ====================
// BAND INVITATIONS
// ====================

/**
 * Get all invitations for a band
 */
export async function getBandInvitations(bandId: string): Promise<BandInvitationWithDetails[]> {
  const { data, error } = await supabase
    .from(BAND_INVITATIONS_TABLE)
    .select(`
      *,
      band:public.bands!band_id (
        id,
        name
      ),
      inviter:auth.users!invited_by (
        id,
        email,
        user_metadata
      )
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: false });

  handleError(error, 'Error fetching band invitations');
  return data || [];
}

/**
 * Get pending invitations for current user
 */
export async function getUserPendingInvitations(userEmail: string): Promise<BandInvitationWithDetails[]> {
  const { data, error } = await supabase
    .from(BAND_INVITATIONS_TABLE)
    .select(`
      *,
      band:public.bands!band_id (
        id,
        name
      ),
      inviter:auth.users!invited_by (
        id,
        email,
        user_metadata
      )
    `)
    .eq('invited_email', userEmail)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  handleError(error, 'Error fetching user pending invitations');
  return data || [];
}

/**
 * Create a band invitation
 */
export async function createBandInvitation(
  payload: CreateBandInvitationPayload
): Promise<BandInvitation> {
  // Generate unique invitation token
  const invitationToken = generateInvitationToken();

  const { data, error } = await supabase
    .from(BAND_INVITATIONS_TABLE)
    .insert({
      ...payload,
      invitation_token: invitationToken,
      role: payload.role === 'owner' ? 'admin' : payload.role, // Cannot invite as owner
    })
    .select()
    .single();

  handleError(error, 'Error creating band invitation');
  return data!;
}

/**
 * Accept or decline a band invitation
 */
export async function respondToInvitation(
  invitationId: string,
  status: 'accepted' | 'declined',
  userId: string
): Promise<BandInvitation> {
  // First, get the invitation to verify it belongs to the user
  const { data: invitation, error: fetchError } = await supabase
    .from(BAND_INVITATIONS_TABLE)
    .select('*')
    .eq('id', invitationId)
    .eq('status', 'pending')
    .single();

  handleError(fetchError, 'Error fetching invitation');

  if (!invitation) {
    throw new Error('Invitation not found or already processed');
  }

  // Check if invitation belongs to current user
  const { data: currentUser } = await supabase.auth.getUser();
  if (currentUser.user?.email !== invitation.invited_email) {
    throw new Error('This invitation is not for you');
  }

  // Update invitation status
  const { data: updatedInvitation, error: updateError } = await supabase
    .from(BAND_INVITATIONS_TABLE)
    .update({
      status,
      accepted_at: status === 'accepted' ? new Date().toISOString() : null,
    })
    .eq('id', invitationId)
    .select()
    .single();

  handleError(updateError, 'Error updating invitation status');

  // If accepted, add user to band
  if (status === 'accepted') {
    await addBandMember({
      band_id: invitation.band_id,
      user_id: userId,
      role: invitation.role,
    });
  }

  return updatedInvitation!;
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from(BAND_INVITATIONS_TABLE)
    .update({ status: 'declined' })
    .eq('id', invitationId)
    .eq('status', 'pending');

  handleError(error, 'Error canceling invitation');
}

/**
 * Clean up expired invitations (can be called periodically)
 */
export async function cleanupExpiredInvitations(): Promise<number> {
  const { data, error } = await supabase
    .from(BAND_INVITATIONS_TABLE)
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    console.error('Error cleaning up expired invitations', error);
    return 0;
  }

  return data?.length || 0;
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Generate a unique invitation token
 */
function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Check if user can invite members to a band
 */
export async function canInviteMembers(bandId: string, userId: string): Promise<boolean> {
  const membership = await getCurrentUserBandMembership(bandId, userId);
  return membership?.role === 'owner' || membership?.role === 'admin' || false;
}

/**
 * Check if user can manage members in a band
 */
export async function canManageMembers(bandId: string, userId: string): Promise<boolean> {
  const membership = await getCurrentUserBandMembership(bandId, userId);
  return membership?.role === 'owner' || membership?.role === 'admin' || false;
}