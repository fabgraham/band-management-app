import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BandsStackParamList } from '../../navigation/bandsStack.types';
import { useBand } from '../../context/BandContext';
import { EditBandModal } from '../../components/Modals/EditBandModal';
import { AddSongModal } from '../../components/Modals/AddSongModal';
import { CreateSetlistModal } from '../../components/Modals/CreateSetlistModal';
import { ThemedButton } from '../../components/Buttons/ThemedButton';
import { getSongs, deleteSong, searchSongs } from '../../services/data/songService';
import { getSetlists, deleteSetlist as deleteSetlistService } from '../../services/data/setlistService';
import { Song, SetlistDetail } from '../../types';
import MembersScreen from '../Members/MembersScreen';

type Props = NativeStackScreenProps<BandsStackParamList, 'BandDetail'>;

type TabType = 'overview' | 'library' | 'setlists' | 'calendar' | 'members';

export const BandDetailScreen = ({ route, navigation }: Props) => {
  const { bandId } = route.params;
  const { bands, deleteBand, selectBand, profile } = useBand();
  const { theme } = useTheme();

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSongModal, setShowAddSongModal] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Song management state
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [setlists, setSetlists] = useState<SetlistDetail[]>([]);
  const [loadingSetlists, setLoadingSetlists] = useState(false);
  const [setlistsRefreshing, setSetlistsRefreshing] = useState(false);
  const [setlistError, setSetlistError] = useState<string | null>(null);
  const [showCreateSetlistModal, setShowCreateSetlistModal] = useState(false);
  const [setlistEditing, setSetlistEditing] = useState<SetlistDetail | null>(null);

  const band = bands?.find((b) => b.id === bandId);

  // Set active band when entering screen
  useEffect(() => {
    if (band) {
      selectBand(bandId);
    }
  }, [bandId, selectBand, band]);

  // Load songs for this band
  const loadSongs = useCallback(async () => {
    try {
      setLoadingSongs(true);
      const data = await getSongs(bandId);
      // Sort songs alphabetically by title (case-insensitive)
      const sortedData = [...data].sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      );
      setSongs(sortedData);
      setFilteredSongs(sortedData);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load songs');
    } finally {
      setLoadingSongs(false);
    }
  }, [bandId]);

  const loadSetlists = useCallback(
    async (showSpinner: boolean = true) => {
      try {
        if (showSpinner) {
          setLoadingSetlists(true);
        }
        setSetlistError(null);
        const data = await getSetlists(bandId);
        setSetlists(data);
      } catch (error) {
        setSetlistError(error instanceof Error ? error.message : 'Failed to load setlists');
      } finally {
        if (showSpinner) {
          setLoadingSetlists(false);
        }
        setSetlistsRefreshing(false);
      }
    },
    [bandId],
  );

  // Load songs when tab changes to library
  useEffect(() => {
    if (activeTab === 'library') {
      loadSongs();
    }
  }, [activeTab, loadSongs]);

  useEffect(() => {
    if (activeTab === 'setlists') {
      loadSetlists();
    }
  }, [activeTab, loadSetlists]);

  // Refresh setlists when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'setlists') {
        loadSetlists(false);
      }
    }, [activeTab, loadSetlists])
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setFilteredSongs(songs);
        return;
      }
      try {
        const results = await searchSongs(query, bandId);
        // Sort search results alphabetically by title (case-insensitive)
        const sortedResults = [...results].sort((a, b) =>
          a.title.toLowerCase().localeCompare(b.title.toLowerCase())
        );
        setFilteredSongs(sortedResults);
      } catch (error) {
        console.error('Search error:', error);
      }
    },
    [songs, bandId]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSongs();
    setRefreshing(false);
  };

  const handleDeleteSong = async (songId: string, songTitle: string) => {
    Alert.alert(
      'Delete Song',
      `Are you sure you want to delete "${songTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSong(songId);
              Alert.alert('Success', 'Song deleted successfully');
              loadSongs();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete song'
              );
            }
          },
        },
      ]
    );
  };

  const handleSetlistsRefresh = async () => {
    setSetlistsRefreshing(true);
    await loadSetlists(false);
  };

  const canCreateMoreSetlists = () => {
    if (profile?.subscription_tier === 'pro') {
      return true;
    }
    return setlists.length < 2;
  };

  const handleOpenCreateSetlist = () => {
    if (!canCreateMoreSetlists()) {
      Alert.alert(
        'Upgrade Required',
        'Free users can create up to 2 setlists per band. Upgrade to Pro for unlimited setlists.',
      );
      return;
    }
    setSetlistEditing(null);
    setShowCreateSetlistModal(true);
  };

  const handleEditSetlist = (target: SetlistDetail) => {
    setSetlistEditing(target);
    setShowCreateSetlistModal(true);
  };

  const handleDeleteSetlist = (target: SetlistDetail) => {
    Alert.alert(
      'Delete Setlist',
      `Delete "${target.name}"? This will remove all songs from the setlist.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSetlistService(target.id);
              Alert.alert('Success', 'Setlist deleted successfully');
              loadSetlists();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete setlist',
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteSetlistFromModal = async (setlistId: string) => {
    const target = setlists.find(s => s.id === setlistId);
    if (!target) return;

    Alert.alert(
      'Delete Setlist',
      `Delete "${target.name}"? This will remove all songs from the setlist.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSetlistService(setlistId);
              Alert.alert('Success', 'Setlist deleted successfully');
              loadSetlists();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete setlist',
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteBand = () => {
    Alert.alert(
      'Delete Band',
      `Are you sure you want to delete "${band?.name}"? This will delete all songs and setlists in this band. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBand(bandId);
              Alert.alert('Success', 'Band deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete band'
              );
            }
          },
        },
      ]
    );
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!band) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[theme.typography.body, { marginTop: 12 }]}>Loading band...</Text>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ScrollView style={styles.tabContent}>
            <View style={styles.dashboardContainer}>
              {/* <Text style={styles.dashboardTitle}>What would you like to do?</Text> */}

              <View style={styles.cardGrid}>
                {/* Setlists Card */}
                <Pressable
                  style={styles.dashboardCard}
                  onPress={() => setActiveTab('setlists')}
                >
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="list" size={40} color="#123053" />
                  </View>
                  <Text style={styles.cardLabel}>Setlists</Text>
                </Pressable>

                {/* Library Card */}
                <Pressable
                  style={styles.dashboardCard}
                  onPress={() => setActiveTab('library')}
                >
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="musical-notes" size={40} color="#123053" />
                  </View>
                  <Text style={styles.cardLabel}>Library</Text>
                </Pressable>

                {/* Calendar Card */}
                <Pressable
                  style={styles.dashboardCard}
                  onPress={() => setActiveTab('calendar')}
                >
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="calendar" size={40} color="#123053" />
                  </View>
                  <Text style={styles.cardLabel}>Calendar</Text>
                </Pressable>

                {/* Members Card */}
                <Pressable
                  style={styles.dashboardCard}
                  onPress={() => setActiveTab('members')}
                >
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="people" size={40} color="#123053" />
                  </View>
                  <Text style={styles.cardLabel}>Members</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        );

      case 'library':
        return (
          <View style={styles.tabContent}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search songs..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </Pressable>
              )}
            </View>

            {/* Song List */}
            {loadingSongs ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[theme.typography.body, { marginTop: 12 }]}>
                  Loading songs...
                </Text>
              </View>
            ) : filteredSongs.length === 0 ? (
              <View style={styles.centerContainer}>
                <Ionicons
                  name={searchQuery ? 'search-outline' : 'musical-notes-outline'}
                  size={64}
                  color="#ccc"
                />
                <Text style={[theme.typography.title2, { marginTop: 16, color: '#999' }]}>
                  {searchQuery ? 'No songs found' : 'No songs yet'}
                </Text>
                <Text style={[theme.typography.body, { marginTop: 8, color: '#999' }]}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Add your first song to get started'}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.songList}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
              >
                {filteredSongs.map((song) => (
                  <Pressable
                    key={song.id}
                    style={[styles.songCard, { backgroundColor: theme.colors.card }]}
                    onPress={() => navigation.navigate('SongDetail', { songId: song.id })}
                  >
                    <View style={styles.songHeader}>
                      <Text style={[styles.songTitle, { color: theme.colors.text }]}>
                        {song.title}
                      </Text>
                      <Pressable onPress={() => handleDeleteSong(song.id, song.title)}>
                        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                      </Pressable>
                    </View>
                    <Text style={[styles.songArtist, { color: '#666' }]}>
                      {song.artist}
                    </Text>

                    <View style={styles.songMetadata}>
                      {song.key && (
                        <View style={styles.keyBadge}>
                          <Ionicons name="musical-note" size={12} color="#ffffff" />
                          <Text style={styles.keyText}>{song.key}</Text>
                        </View>
                      )}
                      {song.bpm && (
                        <View style={styles.metadataItem}>
                          <Ionicons
                            name="speedometer-outline"
                            size={14}
                            color="#666"
                          />
                          <Text
                            style={[
                              styles.metadataText,
                              { color: '#666' },
                            ]}
                          >
                            {song.bpm} BPM
                          </Text>
                        </View>
                      )}
                      {song.duration_seconds && (
                        <View style={styles.metadataItem}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="#666"
                          />
                          <Text
                            style={[
                              styles.metadataText,
                              { color: '#666' },
                            ]}
                          >
                            {formatDuration(song.duration_seconds)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        );

      case 'setlists':
        return (
          <View style={styles.tabContent}>
            {setlistError && (
              <Text style={[styles.errorText, { color: '#ff3b30' }]}>
                {setlistError}
              </Text>
            )}
            {loadingSetlists ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[theme.typography.body, { marginTop: 12, color: '#6e6e73' }]}>
                  Loading setlists...
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.setlistScroll}
                refreshControl={
                  <RefreshControl
                    refreshing={setlistsRefreshing}
                    onRefresh={handleSetlistsRefresh}
                  />
                }
              >
                {setlists.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <Ionicons name="list-outline" size={64} color="#ccc" />
                    <Text style={[theme.typography.title2, { marginTop: 16, color: '#999' }]}>
                      No setlists yet
                    </Text>
                    <Text style={[theme.typography.body, { marginTop: 8, color: '#999', textAlign: 'center' }]}>
                      Tap the plus button to create your first setlist.
                    </Text>
                  </View>
                ) : (
                  setlists.map((item) => {
                    const totalDuration = item.songs.reduce(
                      (sum, entry) => sum + (entry.song?.duration_seconds ?? 0),
                      0,
                    );
                    return (
                      <Pressable
                        key={item.id}
                        style={styles.setlistCard}
                        onPress={() => navigation.navigate('SetlistDetail', { setlistId: item.id })}
                      >
                        <View style={styles.setlistCardHeader}>
                          <Text style={styles.setlistName}>{item.name}</Text>
                        </View>
                        {item.show_date && (
                          <Text style={styles.setlistDate}>
                            {new Date(`${item.show_date}T00:00:00`).toLocaleDateString()}
                          </Text>
                        )}
                        <View style={styles.setlistStats}>
                          <View style={styles.setlistStat}>
                            <Text style={styles.setlistStatLabel}>Songs</Text>
                            <Text style={styles.setlistStatValue}>{item.songs.length}</Text>
                          </View>
                          <View style={styles.setlistStat}>
                            <Text style={styles.setlistStatLabel}>Duration</Text>
                            <Text style={styles.setlistStatValue}>
                              {formatDuration(totalDuration)}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        );

      case 'calendar':
        return (
          <View style={styles.tabContent}>
            <View style={styles.centerContainer}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={[theme.typography.title2, { marginTop: 16, color: '#999' }]}>
                Calendar Coming Soon
              </Text>
              <Text style={[theme.typography.body, { marginTop: 8, color: '#999' }]}>
                Track rehearsals and gigs
              </Text>
            </View>
          </View>
        );

      case 'members':
        return <MembersScreen bandId={bandId} />;

      default:
        return null;
    }
  };

  // Get header title based on active tab
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'overview':
        return band.name;
      case 'library':
        return 'Library';
      case 'setlists':
        return 'Setlists';
      case 'calendar':
        return 'Calendar';
      case 'members':
        return 'Members';
      default:
        return band.name;
    }
  };

  // Render header actions based on active tab
  const renderHeaderActions = () => {
    if (activeTab === 'library') {
      return (
        <Pressable onPress={() => setShowAddSongModal(true)} style={styles.headerButton}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </Pressable>
      );
    }

    if (activeTab === 'setlists') {
      return (
        <Pressable onPress={handleOpenCreateSetlist} style={styles.headerButton}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </Pressable>
      );
    }

    // For overview and other tabs, show edit and delete
    return (
      <>
        <Pressable onPress={() => setShowEditModal(true)} style={styles.headerButton}>
          <Ionicons name="create-outline" size={24} color="#ffffff" />
        </Pressable>
        <Pressable onPress={handleDeleteBand} style={styles.headerButton}>
          <Ionicons name="trash-outline" size={24} color="#ffffff" />
        </Pressable>
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.bandName}>{getHeaderTitle()}</Text>
        <View style={styles.headerActions}>
          {renderHeaderActions()}
        </View>
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={[
            styles.bottomTab,
            activeTab === 'setlists' && styles.bottomTabActive,
          ]}
          onPress={() => setActiveTab('setlists')}
        >
          <Ionicons
            name={activeTab === 'setlists' ? 'list' : 'list-outline'}
            size={28}
            color={activeTab === 'setlists' ? '#133053' : '#999'}
          />
        </Pressable>
        <Pressable
          style={[
            styles.bottomTab,
            activeTab === 'library' && styles.bottomTabActive,
          ]}
          onPress={() => setActiveTab('library')}
        >
          <Ionicons
            name={activeTab === 'library' ? 'musical-notes' : 'musical-notes-outline'}
            size={28}
            color={activeTab === 'library' ? '#133053' : '#999'}
          />
        </Pressable>
        <Pressable
          style={[
            styles.bottomTab,
            activeTab === 'calendar' && styles.bottomTabActive,
          ]}
          onPress={() => setActiveTab('calendar')}
        >
          <Ionicons
            name={activeTab === 'calendar' ? 'calendar' : 'calendar-outline'}
            size={28}
            color={activeTab === 'calendar' ? '#133053' : '#999'}
          />
        </Pressable>
        <Pressable
          style={[
            styles.bottomTab,
            activeTab === 'members' && styles.bottomTabActive,
          ]}
          onPress={() => setActiveTab('members')}
        >
          <Ionicons
            name={activeTab === 'members' ? 'people' : 'people-outline'}
            size={28}
            color={activeTab === 'members' ? '#133053' : '#999'}
          />
        </Pressable>
      </View>

      {/* Modals */}
      <EditBandModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        bandId={band.id}
        bandName={band.name}
      />

      <AddSongModal
        visible={showAddSongModal}
        onClose={() => setShowAddSongModal(false)}
        onSuccess={async () => {
          setShowAddSongModal(false);
          // Small delay to ensure modal closes before fetching
          // This prevents ERR_ABORTED network errors
          setTimeout(() => {
            loadSongs();
          }, 300);
        }}
      />

      <CreateSetlistModal
        visible={showCreateSetlistModal}
        onClose={() => {
          setShowCreateSetlistModal(false);
          // Clear editing state after modal animation completes (300ms)
          setTimeout(() => setSetlistEditing(null), 300);
        }}
        bandId={band.id}
        setlist={setlistEditing ?? undefined}
        onSuccess={async () => {
          setShowCreateSetlistModal(false);
          // Clear editing state after modal animation completes (300ms)
          setTimeout(() => setSetlistEditing(null), 300);
          await loadSetlists();
        }}
        onDelete={handleDeleteSetlistFromModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#133053',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  bottomTabActive: {
    backgroundColor: 'rgba(19, 48, 83, 0.1)',
  },
  bottomTabText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  infoCard: {
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    margin: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  songList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  songCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  songHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  songArtist: {
    fontSize: 14,
    marginBottom: 8,
  },
  songMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  keyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#133053',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  keyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#133053',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dashboardContainer: {
    padding: 20,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 24,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  dashboardCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  cardIconContainer: {
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#123053',
    textAlign: 'center',
  },
  errorText: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  setlistScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  setlistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginBottom: 12,
  },
  setlistCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setlistName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  setlistDate: {
    color: '#6e6e73',
    marginTop: 6,
  },
  setlistStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  setlistStat: {
    flex: 0,
    minWidth: '30%',
  },
  setlistStatLabel: {
    color: '#6e6e73',
    fontSize: 12,
  },
  setlistStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    marginTop: 4,
  },
});
