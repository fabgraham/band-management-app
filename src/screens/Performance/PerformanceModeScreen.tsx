import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
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
import { SetlistDetail } from '../../types';
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
  const [showEditSongModal, setShowEditSongModal] = useState(false);
  const [lyricsContentHeight, setLyricsContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Load font size preference
  useEffect(() => {
    const loadFontSize = async () => {
      try {
        const savedFontSize = await AsyncStorage.getItem(FONT_SIZE_KEY);
        if (savedFontSize) {
          setFontSize(parseInt(savedFontSize, 10));
        }
      } catch (error) {
        console.log('Failed to load font size:', error);
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

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (scrollListenerRef.current) {
        scrollY.removeListener(scrollListenerRef.current);
        scrollListenerRef.current = null;
      }
    };
  }, []);

  // Update scroll progress
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      if (lyricsContentHeight > scrollViewHeight) {
        const progress = value / (lyricsContentHeight - scrollViewHeight);
        setScrollProgress(Math.min(Math.max(progress, 0), 1));
      }
    });
    return () => scrollY.removeListener(listenerId);
  }, [lyricsContentHeight, scrollViewHeight]);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    scrollY.setValue(0);
  }, [currentIndex]);

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

  const scrollListenerRef = useRef<string | null>(null);

  const startAutoScroll = () => {
    if (!currentSong?.duration_seconds || !currentSong?.lyrics) {
      Alert.alert('Cannot Auto-Scroll', 'Song duration or lyrics not available.');
      return;
    }

    setIsPlaying(true);

    const lineHeight = fontSize * 1.6;
    const estimatedHeight = currentSong.lyrics.split('\n').length * lineHeight;
    const contentHeight = Math.max(lyricsContentHeight, estimatedHeight);
    const containerHeight = Math.max(scrollViewHeight, 1);
    const scrollDistance = Math.max(contentHeight - containerHeight, 0);
    const scrollDuration = currentSong.duration_seconds * 1000; // Convert to ms

    scrollY.setValue(0);
    if (scrollListenerRef.current) {
      scrollY.removeListener(scrollListenerRef.current);
      scrollListenerRef.current = null;
    }

    scrollListenerRef.current = scrollY.addListener(({ value }) => {
      scrollViewRef.current?.scrollTo({ y: value, animated: false });
    });

    animationRef.current = Animated.timing(scrollY, {
      toValue: scrollDistance,
      duration: scrollDuration,
      useNativeDriver: false,
      easing: Easing.linear,
    });

    animationRef.current.start(({ finished }) => {
      if (finished) {
        setIsPlaying(false);
        if (scrollListenerRef.current) {
          scrollY.removeListener(scrollListenerRef.current);
          scrollListenerRef.current = null;
        }
      }
    });
  };

  const stopAutoScroll = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    if (scrollListenerRef.current) {
      scrollY.removeListener(scrollListenerRef.current);
      scrollListenerRef.current = null;
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
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
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
            onPress={() => setShowEditSongModal(true)}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={24} color="#ffffff" />
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

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${scrollProgress * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(scrollProgress * 100)}%
        </Text>
      </View>

      {/* Lyrics */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.lyricsContainer}
        contentContainerStyle={styles.lyricsContent}
        showsVerticalScrollIndicator={true}
        onContentSizeChange={(_, height) => setLyricsContentHeight(height)}
        onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}
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
          </Pressable>
      </View>

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
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navButtonDisabled: {
    opacity: 0.3,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
});
