// Member Management Types for Phase 5
// Defines TypeScript interfaces for band members and invitations

export type BandMemberRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface BandMember {
  id: string;
  band_id: string;
  user_id: string;
  role: BandMemberRole;
  joined_at: string;
  created_at: string;
  updated_at: string;
  // Joined user data (for display)
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface BandInvitation {
  id: string;
  band_id: string;
  invited_by: string;
  invited_email: string;
  role: BandMemberRole; // Only 'admin' or 'member' for invitations
  invitation_token: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data for display
  band?: {
    id: string;
    name: string;
  };
  inviter?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export interface CreateBandMemberPayload {
  band_id: string;
  user_id: string;
  role: BandMemberRole;
}

export interface CreateBandInvitationPayload {
  band_id: string;
  invited_email: string;
  role: BandMemberRole; // 'admin' or 'member' only
}

export interface UpdateBandMemberPayload {
  role?: BandMemberRole;
}

export interface UpdateBandInvitationPayload {
  status?: InvitationStatus; // Only for accepting/declining
}

export interface BandMemberWithDetails extends BandMember {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface BandInvitationWithDetails extends BandInvitation {
  band: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export interface MemberStats {
  total_members: number;
  role_counts: {
    owner: number;
    admin: number;
    member: number;
  };
  pending_invitations: number;
}

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  owner: {
    can_manage_members: true,
    can_invite_members: true,
    can_remove_members: true,
    can_change_roles: true,
    can_manage_band: true,
    can_manage_songs: true,
    can_manage_setlists: true,
    can_delete_band: true,
  },
  admin: {
    can_manage_members: true,
    can_invite_members: true,
    can_remove_members: true, // Can remove members and other admins, but not owners
    can_change_roles: false, // Cannot change owner roles
    can_manage_band: true, // Can edit band details
    can_manage_songs: true,
    can_manage_setlists: true,
    can_delete_band: false, // Cannot delete band
  },
  member: {
    can_manage_members: false,
    can_invite_members: false,
    can_remove_members: false,
    can_change_roles: false,
    can_manage_band: false,
    can_manage_songs: true, // Can add/edit/delete songs
    can_manage_setlists: true, // Can create/edit/delete setlists
    can_delete_band: false,
  },
} as const;

export type RolePermissions = typeof ROLE_PERMISSIONS[BandMemberRole];

// Helper function to check if user has permission
export function hasPermission(
  userRole: BandMemberRole | null | undefined,
  permission: keyof RolePermissions
): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.[permission] ?? false;
}

// Helper function to check if user can manage another member
export function canManageMember(
  currentUserRole: BandMemberRole,
  targetMemberRole: BandMemberRole
): boolean {
  if (currentUserRole === 'owner') return true;
  if (currentUserRole === 'admin') return targetMemberRole !== 'owner';
  return false;
}

// Helper function to get role display name
export function getRoleDisplayName(role: BandMemberRole): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'member':
      return 'Member';
    default:
      return role;
  }
}

// Helper function to get role description
export function getRoleDescription(role: BandMemberRole): string {
  switch (role) {
    case 'owner':
      return 'Full control of the band including member management and deletion';
    case 'admin':
      return 'Can manage members, songs, and setlists, but cannot delete the band';
    case 'member':
      return 'Can add and edit songs and setlists';
    default:
      return '';
  }
}

// Helper function to check if invitation is expired
export function isInvitationExpired(invitation: BandInvitation): boolean {
  return new Date(invitation.expires_at) < new Date();
}

// Helper function to format invitation status
export function getInvitationStatusDisplay(status: InvitationStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'declined':
      return 'Declined';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
}