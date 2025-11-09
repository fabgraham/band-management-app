export interface Song {
  id: string;
  title: string;
  artist: string;
  key?: string | null;
  bpm?: number | null;
  durationSeconds?: number | null;
  lyrics?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface CreateSongPayload {
  title: string;
  artist: string;
  key?: string | null;
  bpm?: number | null;
  durationSeconds?: number | null;
  lyrics?: string | null;
  notes?: string | null;
}

export type UpdateSongPayload = Partial<CreateSongPayload>;
