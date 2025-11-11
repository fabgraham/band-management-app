import { PostgrestError } from '@supabase/supabase-js';
import {
  CreateSetlistPayload,
  Setlist,
  SetlistDetail,
  SetlistSongEntry,
  UpdateSetlistPayload,
  ReorderPayload,
} from '../../types';
import { supabase } from '../supabase/client';

const SETLISTS_TABLE = 'setlists';
const SETLIST_SONGS_TABLE = 'setlist_songs';

const SONG_FIELDS =
  'id,title,artist,key,bpm,duration_seconds,lyrics,notes,band_id,created_at,updated_at';

const SETLIST_SONG_FIELDS = `
  id,
  setlist_id,
  song_id,
  position,
  created_at,
  song:songs (${SONG_FIELDS})
`;

const handleError = (error: PostgrestError | null, context: string) => {
  if (error) {
    console.error(context, error);
    throw new Error(`${context}: ${error.message}`);
  }
};

const mapSetlistRows = (rows: any[]): SetlistDetail[] =>
  rows.map((row) => ({
    id: row.id,
    name: row.name,
    band_id: row.band_id,
    show_date: row.show_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    songs: ((row.setlist_songs ?? []) as any[])
      .map((entry) => ({
        id: entry.id,
        setlist_id: entry.setlist_id,
        song_id: entry.song_id,
        order_index: entry.position,
        created_at: entry.created_at,
        song: entry.song,
      }))
      .sort((a, b) => a.order_index - b.order_index) as SetlistSongEntry[],
  }));

export const getSetlists = async (bandId: string): Promise<SetlistDetail[]> => {
  const { data, error } = await supabase
    .from(SETLISTS_TABLE)
    .select(
      `
        *,
        setlist_songs (
          ${SETLIST_SONG_FIELDS}
        )
      `,
    )
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })
    ;

  handleError(error, 'Failed to fetch setlists');

  if (!data) {
    return [];
  }

  return mapSetlistRows(data);
};

export const getSetlistWithSongs = async (setlistId: string): Promise<SetlistDetail> => {
  const { data, error } = await supabase
    .from(SETLISTS_TABLE)
    .select(
      `
        *,
        setlist_songs (
          ${SETLIST_SONG_FIELDS}
        )
      `,
    )
    .eq('id', setlistId)
    .single();

  handleError(error, 'Failed to fetch setlist details');

  if (!data) {
    throw new Error('Setlist not found');
  }

  return mapSetlistRows([data])[0];
};

export const createSetlist = async (payload: CreateSetlistPayload): Promise<Setlist> => {
  const { data, error } = await supabase
    .from(SETLISTS_TABLE)
    .insert(payload)
    .select()
    .single();

  handleError(error, 'Failed to create setlist');

  if (!data) {
    throw new Error('Failed to create setlist – no response body.');
  }

  return data as Setlist;
};

export const updateSetlist = async (
  setlistId: string,
  updates: UpdateSetlistPayload,
): Promise<Setlist> => {
  const { data, error } = await supabase
    .from(SETLISTS_TABLE)
    .update(updates)
    .eq('id', setlistId)
    .select()
    .single();

  handleError(error, 'Failed to update setlist');

  if (!data) {
    throw new Error('Failed to update setlist – no response body.');
  }

  return data as Setlist;
};

export const deleteSetlist = async (setlistId: string): Promise<void> => {
  console.log('[setlistService] deleteSetlist start', { setlistId });
  const { data, error } = await supabase
    .from(SETLISTS_TABLE)
    .delete()
    .eq('id', setlistId)
    .select('id');

  handleError(error, 'Failed to delete setlist');

  const deletedCount = (data?.length ?? 0);
  console.log('[setlistService] deleteSetlist result', { deletedCount });

  if (deletedCount === 0) {
    throw new Error('No setlist was deleted. It may not exist or you may not have permission.');
  }
};

export const getSetlistCount = async (bandId: string): Promise<number> => {
  const { count, error } = await supabase
    .from(SETLISTS_TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('band_id', bandId);

  handleError(error, 'Failed to count setlists');

  return count ?? 0;
};

const getNextOrderIndex = async (setlistId: string): Promise<number> => {
  const { data, error } = await supabase
    .from(SETLIST_SONGS_TABLE)
    .select('position')
    .eq('setlist_id', setlistId)
    .order('position', { ascending: false })
    .limit(1);

  handleError(error, 'Failed to determine next order index');

  if (!data || data.length === 0) {
    return 1; // Start at 1, not 0
  }

  return (data[0].position ?? 0) + 1; // Return next available position
};

export const addSongsToSetlist = async (
  setlistId: string,
  songIds: string[],
): Promise<{ insertedCount: number; skippedCount: number }> => {
  console.log('[setlistService] addSongsToSetlist start', { setlistId, requestedCount: songIds.length });
  if (!songIds.length) return { insertedCount: 0, skippedCount: 0 };

  const { data: existingRows, error: existingError } = await supabase
    .from(SETLIST_SONGS_TABLE)
    .select('song_id')
    .eq('setlist_id', setlistId)
    .in('song_id', songIds);

  handleError(existingError, 'Failed to validate duplicate songs');

  const existingSongIds = new Set((existingRows ?? []).map((row) => row.song_id));
  const filteredSongIds = songIds.filter((id) => !existingSongIds.has(id));
  const skippedCount = songIds.length - filteredSongIds.length;

  if (!filteredSongIds.length) {
    console.log('[setlistService] addSongsToSetlist no-op: all duplicates', { skippedCount });
    return { insertedCount: 0, skippedCount };
  }

  const startingIndex = await getNextOrderIndex(setlistId);

  const payload = filteredSongIds.map((songId, idx) => ({
    setlist_id: setlistId,
    song_id: songId,
    position: startingIndex + idx,
  }));

  const { data, error } = await supabase
    .from(SETLIST_SONGS_TABLE)
    .insert(payload)
    .select('id');

  handleError(error, 'Failed to add song to setlist');

  const insertedCount = (data?.length ?? 0);
  console.log('[setlistService] addSongsToSetlist result', { insertedCount, skippedCount });
  return { insertedCount, skippedCount };
};

export const removeSongFromSetlist = async (entryId: string): Promise<void> => {
  const { error } = await supabase.from(SETLIST_SONGS_TABLE).delete().eq('id', entryId);

  handleError(error, 'Failed to remove song from setlist');
};

export const reorderSetlistSongs = async (updates: ReorderPayload[]): Promise<void> => {
  if (!updates.length) return;

  const { error } = await supabase.from(SETLIST_SONGS_TABLE).upsert(
    updates.map((item) => ({
      id: item.id,
      position: item.order_index,
    })),
    { onConflict: 'id' },
  );

  handleError(error, 'Failed to reorder setlist');
};
