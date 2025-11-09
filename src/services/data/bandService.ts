import { supabase } from '../supabase/client';

export interface Band {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  subscription_tier: 'free' | 'pro';
  created_at: string;
  updated_at: string;
}

/**
 * Get all bands for the current user
 */
export const getBands = async (): Promise<Band[]> => {
  const { data, error } = await supabase
    .from('bands')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch bands: ${error.message}`);
  }

  return data || [];
};

/**
 * Get a single band by ID
 */
export const getBand = async (bandId: string): Promise<Band | null> => {
  const { data, error } = await supabase
    .from('bands')
    .select('*')
    .eq('id', bandId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch band: ${error.message}`);
  }

  return data;
};

/**
 * Create a new band
 */
export const createBand = async (name: string): Promise<Band> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('bands')
    .insert([
      {
        name,
        created_by: user.id,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create band: ${error.message}`);
  }

  return data;
};

/**
 * Update a band's name
 */
export const updateBand = async (
  bandId: string,
  name: string,
): Promise<Band> => {
  const { data, error } = await supabase
    .from('bands')
    .update({ name })
    .eq('id', bandId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update band: ${error.message}`);
  }

  return data;
};

/**
 * Delete a band
 */
export const deleteBand = async (bandId: string): Promise<void> => {
  const { error } = await supabase.from('bands').delete().eq('id', bandId);

  if (error) {
    throw new Error(`Failed to delete band: ${error.message}`);
  }
};

/**
 * Get the current user's profile (subscription tier)
 */
export const getProfile = async (): Promise<Profile | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // If profile doesn't exist, it will be created automatically by the trigger
    // but we can return a default profile here
    if (error.code === 'PGRST116') {
      return {
        id: user.id,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data;
};

/**
 * Check if user can create more bands (freemium limit)
 * Returns true if user can create more bands, false otherwise
 */
export const canCreateBand = async (): Promise<{
  canCreate: boolean;
  reason?: string;
}> => {
  const profile = await getProfile();

  if (!profile) {
    return { canCreate: false, reason: 'User profile not found' };
  }

  // Pro users have unlimited bands
  if (profile.subscription_tier === 'pro') {
    return { canCreate: true };
  }

  // Free users can only have 1 band
  const bands = await getBands();

  if (bands.length >= 1) {
    return {
      canCreate: false,
      reason: 'Free users can only create 1 band. Upgrade to Pro for unlimited bands.',
    };
  }

  return { canCreate: true };
};