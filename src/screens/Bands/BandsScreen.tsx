import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BandsStackParamList } from '../../navigation/bandsStack.types';
import { useBand } from '../../context/BandContext';
import { CreateBandModal } from '../../components/Modals/CreateBandModal';

export const BandsScreen = () => {
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<BandsStackParamList>>();
  const { bands, loading, error, fetchBands } = useBand();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBands();
    setRefreshing(false);
  };

  const handleCreateSuccess = () => {
    Alert.alert('Success', 'Band created successfully!');
  };

  const handleBandPress = (bandId: string) => {
    navigation.navigate('BandDetail', { bandId });
  };

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: '#123053' }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[theme.typography.largeTitle, { color: '#ffffff' }]}>
            Bands
          </Text>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.addButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </Pressable>
            <Pressable
              style={styles.profileChip}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-outline" size={22} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.bandSection}>
          {loading && (!bands || bands.length === 0) ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text
                style={[
                  theme.typography.body,
                  { color: '#ffffff', marginTop: 12 },
                ]}
              >
                Loading bands...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ffffff" />
              <Text
                style={[
                  theme.typography.body,
                  { color: '#ffffff', marginTop: 12, textAlign: 'center' },
                ]}
              >
                {error}
              </Text>
            </View>
          ) : !bands || bands.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="musical-notes-outline" size={64} color="#ffffff" />
              <Text
                style={[
                  theme.typography.title2,
                  { color: '#ffffff', marginTop: 16 },
                ]}
              >
                No bands yet
              </Text>
              <Text
                style={[
                  theme.typography.body,
                  { color: 'rgba(255,255,255,0.7)', marginTop: 8 },
                ]}
              >
                Create your first band to get started
              </Text>
            </View>
          ) : (
            bands.map((band) => (
              <Pressable
                key={band.id}
                style={styles.bandCard}
                onPress={() => handleBandPress(band.id)}
              >
                <View style={styles.ribbon}>
                  <Text style={styles.ribbonText}>{band.name}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Setlists</Text>
                  <Text style={styles.cardValue}>No setlists yet</Text>
                  <Text style={[styles.cardLabel, { marginTop: 12 }]}>
                    Created
                  </Text>
                  <Text style={styles.cardValue}>
                    {new Date(band.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <CreateBandModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

    </>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileChip: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  bandCard: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  ribbon: {
    backgroundColor: '#e5e5ea',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ribbonText: {
    color: '#1c1c1e',
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardContent: {
    padding: 16,
  },
  cardLabel: {
    color: '#6b6b71',
    fontSize: 14,
    marginBottom: 4,
    textTransform: 'none',
  },
  cardValue: {
    color: '#1c1c1e',
    fontSize: 16,
  },
});
