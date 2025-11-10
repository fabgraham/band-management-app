import { PostgrestError } from '@supabase/supabase-js';
import { Song, CreateSongPayload, UpdateSongPayload } from '../../types';
import { supabase } from '../supabase/client';

const SONG_TABLE = 'songs';

const handleError = (error: PostgrestError | null, context: string) => {
  if (error) {
    console.error(context, error);
    throw new Error(`${context}: ${error.message}`);
  }
};

export const createSong = async (payload: CreateSongPayload): Promise<Song> => {
  const { data, error } = await supabase
    .from(SONG_TABLE)
    .insert(payload)
    .select()
    .single();

  handleError(error, 'Failed to create song');

  if (!data) {
    throw new Error('Failed to create song – no response body.');
  }

  return data as Song;
};

/**
 * Get a single song by ID
 */
export const getSongById = async (songId: string): Promise<Song> => {
  const { data, error } = await supabase
    .from(SONG_TABLE)
    .select('*')
    .eq('id', songId)
    .single();

  handleError(error, 'Failed to load song');

  if (!data) {
    throw new Error('Song not found');
  }

  return data as Song;
};

/**
 * Get all songs, optionally filtered by band
 */
export const getSongs = async (bandId?: string): Promise<Song[]> => {
  let query = supabase
    .from(SONG_TABLE)
    .select('*');

  if (bandId) {
    query = query.eq('band_id', bandId);
  }

  const { data, error } = await query.order('title', { ascending: true });

  handleError(error, 'Failed to load songs');

  return (data as Song[]) ?? [];
};

/**
 * Get song count for a band (for freemium limit checking)
 */
export const getSongCount = async (bandId: string): Promise<number> => {
  const { count, error } = await supabase
    .from(SONG_TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('band_id', bandId);

  handleError(error, 'Failed to count songs');

  return count ?? 0;
};

export const updateSong = async (songId: string, updates: UpdateSongPayload): Promise<Song> => {
  const { data, error } = await supabase
    .from(SONG_TABLE)
    .update(updates)
    .eq('id', songId)
    .select()
    .single();

  handleError(error, 'Failed to update song');

  if (!data) {
    throw new Error('Failed to update song – no response body.');
  }

  return data as Song;
};

export const deleteSong = async (songId: string): Promise<void> => {
  const { error } = await supabase.from(SONG_TABLE).delete().eq('id', songId);

  handleError(error, 'Failed to delete song');
};

/**
 * Search songs by title or artist, optionally filtered by band
 */
export const searchSongs = async (term: string, bandId?: string): Promise<Song[]> => {
  const trimmedTerm = term.trim();

  if (!trimmedTerm) {
    return [];
  }

  const likePattern = `%${trimmedTerm}%`;
  let query = supabase
    .from(SONG_TABLE)
    .select('*')
    .or(`title.ilike.${likePattern},artist.ilike.${likePattern}`);

  if (bandId) {
    query = query.eq('band_id', bandId);
  }

  const { data, error } = await query
    .order('title', { ascending: true })
    .limit(50);

  handleError(error, 'Failed to search songs');

  return (data as Song[]) ?? [];
};
