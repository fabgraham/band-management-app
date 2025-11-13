import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BandsStackParamList } from '../../navigation/bandsStack.types';
import { getSetlistWithSongs } from '../../services/data/setlistService';
import { SetlistDetail, Song } from '../../types';
import { ActionMenuModal } from '../../components/Modals/ActionMenuModal';
import { AddSongModal } from '../../components/Modals/AddSongModal';

type NavigationProp = NativeStackNavigationProp<BandsStackParamList, 'PerformanceMode'>;
type RouteProps = RouteProp<BandsStackParamList, 'PerformanceMode'>;

const FONT_SIZE_KEY = '@performance_font_size';
const DEFAULT_FONT_SIZE = 18;
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 32;

export const PerformanceModeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { setlistId, songIndex } = route.params;

  const [setlist, setSetlist] = useState<SetlistDetail | null>(null);
  const [currentIndex, setCurrentIndex] = useState(songIndex);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSongMenu, setShowSongMenu] = useState(false);
  const [showEditSongModal, setShowEditSongModal] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Load font size preference
  useEffect(() => {
    const loadFontSize = async () => {
      try {
        const saved = await AsyncStorage.getItem(FONT_SIZE_KEY);
        if (saved) {
          setFontSize(parseInt(saved, 10));
        }
      } catch (error) {
        console.log('Failed to load font size preference:', error);
      }
    };
    loadFontSize();
  }, []);

  // Load setlist data
  const loadSetlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSetlistWithSongs(setlistId);
      setSetlist(data);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load setlist.',
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, setlistId]);

  useFocusEffect(
    useCallback(() => {
      loadSetlist();
    }, [loadSetlist]),
  );

  const currentSong = setlist?.songs[currentIndex]?.song;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      stopAutoScroll();
    }
  };

  const handleNext = () => {
    if (setlist && currentIndex < setlist.songs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      stopAutoScroll();
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  };

  const startAutoScroll = () => {
    if (!currentSong?.duration_seconds || !currentSong?.lyrics) {
      Alert.alert('Cannot Auto-Scroll', 'Song duration or lyrics not available.');
      return;
    }

    setIsPlaying(true);

    // Calculate scroll distance based on content height
    // We'll need to estimate content height based on lyrics length
    const linesCount = currentSong.lyrics.split('\n').length;
    const lineHeight = fontSize * 1.6; // Approximate line height
    const totalHeight = linesCount * lineHeight;
    const scrollDuration = currentSong.duration_seconds * 1000; // Convert to ms

    scrollY.setValue(0);

    animationRef.current = Animated.timing(scrollY, {
      toValue: totalHeight,
      duration: scrollDuration,
      useNativeDriver: true,
    });

    animationRef.current.start(({ finished }) => {
      if (finished) {
        setIsPlaying(false);
      }
    });
  };

  const stopAutoScroll = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleFontSizeIncrease = async () => {
    if (fontSize < MAX_FONT_SIZE) {
      const newSize = fontSize + 2;
      setFontSize(newSize);
      try {
        await AsyncStorage.setItem(FONT_SIZE_KEY, newSize.toString());
      } catch (error) {
        console.log('Failed to save font size:', error);
      }
    }
  };

  const handleFontSizeDecrease = async () => {
    if (fontSize > MIN_FONT_SIZE) {
      const newSize = fontSize - 2;
      setFontSize(newSize);
      try {
        await AsyncStorage.setItem(FONT_SIZE_KEY, newSize.toString());
      } catch (error) {
        console.log('Failed to save font size:', error);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading performance mode...</Text>
      </View>
    );
  }

  if (!setlist || !currentSong) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => {
            stopAutoScroll();
            navigation.goBack();
          }}
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.songTitle} numberOfLines={1}>
          {currentSong.title}
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerButton}
            onPress={handleFontSizeDecrease}
            disabled={fontSize <= MIN_FONT_SIZE}
            hitSlop={8}
          >
            <Ionicons
              name="remove-circle-outline"
              size={24}
              color={fontSize <= MIN_FONT_SIZE ? '#666' : '#ffffff'}
            />
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={handleFontSizeIncrease}
            disabled={fontSize >= MAX_FONT_SIZE}
            hitSlop={8}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={fontSize >= MAX_FONT_SIZE ? '#666' : '#ffffff'}
            />
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={() => setShowSongMenu(true)}
            hitSlop={8}
          >
            <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Song Info */}
      <View style={styles.songInfo}>
        <Text style={styles.artistName}>{currentSong.artist}</Text>
        <View style={styles.songMeta}>
          {currentSong.key && <Text style={styles.metaText}>Key: {currentSong.key}</Text>}
          {currentSong.bpm && <Text style={styles.metaText}>BPM: {currentSong.bpm}</Text>}
          {currentSong.duration_seconds && (
            <Text style={styles.metaText}>
              Duration: {Math.floor(currentSong.duration_seconds / 60)}:
              {(currentSong.duration_seconds % 60).toString().padStart(2, '0')}
            </Text>
          )}
        </View>
      </View>

      {/* Lyrics */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.lyricsContainer}
        contentContainerStyle={styles.lyricsContent}
        showsVerticalScrollIndicator={true}
      >
        {currentSong.lyrics ? (
          <Text style={[styles.lyricsText, { fontSize, lineHeight: fontSize * 1.6 }]}>
            {currentSong.lyrics}
          </Text>
        ) : (
          <View style={styles.emptyLyrics}>
            <Ionicons name="musical-notes-outline" size={48} color="#666" />
            <Text style={styles.emptyLyricsText}>No lyrics available</Text>
            <Text style={styles.emptyLyricsHint}>
              Tap the menu to add lyrics to this song
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Pressable
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
          hitSlop={8}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={currentIndex === 0 ? '#666' : '#ffffff'}
          />
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </Pressable>

        <Pressable
          style={styles.playButton}
          onPress={handlePlayPause}
          disabled={!currentSong.duration_seconds || !currentSong.lyrics}
          hitSlop={8}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color={!currentSong.duration_seconds || !currentSong.lyrics ? '#666' : '#ffffff'}
          />
        </Pressable>

        <Pressable
          style={[
            styles.navButton,
            currentIndex === setlist.songs.length - 1 && styles.navButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={currentIndex === setlist.songs.length - 1}
          hitSlop={8}
        >
          <Ionicons
            name="arrow-forward"
            size={24}
            color={currentIndex === setlist.songs.length - 1 ? '#666' : '#ffffff'}
          />
          <Text
            style={[
              styles.navButtonText,
              currentIndex === setlist.songs.length - 1 && styles.navButtonTextDisabled,
            ]}
          >
            Next
          </Text>
        </Pressable>
      </View>

      {/* Song Settings Menu */}
      <ActionMenuModal
        visible={showSongMenu}
        onClose={() => setShowSongMenu(false)}
        items={[
          {
            label: 'Edit Song',
            icon: 'create-outline',
            onPress: () => {
              setShowEditSongModal(true);
            },
          },
        ]}
      />

      {/* Edit Song Modal */}
      <AddSongModal
        visible={showEditSongModal}
        onClose={() => setShowEditSongModal(false)}
        song={currentSong}
        onSuccess={async () => {
          setShowEditSongModal(false);
          await loadSetlist();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#133053',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginHorizontal: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  songInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  artistName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  songMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 14,
    color: '#999',
  },
  lyricsContainer: {
    flex: 1,
  },
  lyricsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  lyricsText: {
    color: '#ffffff',
    fontWeight: '400',
  },
  emptyLyrics: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyLyricsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyLyricsHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  navButtonTextDisabled: {
    color: '#666',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#133053',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
