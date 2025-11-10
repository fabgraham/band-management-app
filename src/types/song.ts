export interface Song {
  id: string;
  title: string;
  artist: string;
  key?: string | null;
  bpm?: number | null;
  duration_seconds?: number | null;
  lyrics?: string | null;
  notes?: string | null;
  band_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSongPayload {
  title: string;
  artist: string;
  band_id: string;
  key?: string | null;
  bpm?: number | null;
  duration_seconds?: number | null;
  lyrics?: string | null;
  notes?: string | null;
}

export type UpdateSongPayload = Partial<CreateSongPayload>;
