import { Song } from './song';

export interface Setlist {
  id: string;
  name: string;
  band_id: string;
  show_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SetlistSongEntry {
  id: string;
  setlist_id: string;
  song_id: string;
  order_index: number;
  created_at?: string;
  song?: Song;
}

export interface SetlistDetail extends Setlist {
  songs: SetlistSongEntry[];
}

export interface CreateSetlistPayload {
  name: string;
  band_id: string;
  show_date?: string | null;
}

export type UpdateSetlistPayload = Partial<Omit<CreateSetlistPayload, 'band_id'>>;

export interface ReorderPayload {
  id: string;
  order_index: number;
}
