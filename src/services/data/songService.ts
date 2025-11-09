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
    .from<Song>(SONG_TABLE)
    .insert(payload)
    .select()
    .single();

  handleError(error, 'Failed to create song');

  if (!data) {
    throw new Error('Failed to create song – no response body.');
  }

  return data;
};

export const getSongs = async (): Promise<Song[]> => {
  const { data, error } = await supabase
    .from<Song>(SONG_TABLE)
    .select('*')
    .order('title', { ascending: true });

  handleError(error, 'Failed to load songs');

  return data ?? [];
};

export const updateSong = async (songId: string, updates: UpdateSongPayload): Promise<Song> => {
  const { data, error } = await supabase
    .from<Song>(SONG_TABLE)
    .update(updates)
    .eq('id', songId)
    .select()
    .single();

  handleError(error, 'Failed to update song');

  if (!data) {
    throw new Error('Failed to update song – no response body.');
  }

  return data;
};

export const deleteSong = async (songId: string): Promise<void> => {
  const { error } = await supabase.from(SONG_TABLE).delete().eq('id', songId);

  handleError(error, 'Failed to delete song');
};

export const searchSongs = async (term: string): Promise<Song[]> => {
  const trimmedTerm = term.trim();

  if (!trimmedTerm) {
    return [];
  }

  const likePattern = `%${trimmedTerm}%`;
  const { data, error } = await supabase
    .from<Song>(SONG_TABLE)
    .select('*')
    .or(`title.ilike.${likePattern},artist.ilike.${likePattern}`)
    .order('title', { ascending: true })
    .limit(50);

  handleError(error, 'Failed to search songs');

  return data ?? [];
};
