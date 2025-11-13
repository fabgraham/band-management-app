export type BandsStackParamList = {
  BandsHome: undefined;
  BandDetail: { bandId: string };
  SongDetail: { songId: string };
  SetlistDetail: { setlistId: string };
  PerformanceMode: { setlistId: string; songIndex: number };
  Profile: undefined;
};
