import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BandsStackParamList } from '../../navigation/bandsStack.types';
import { useBand } from '../../context/BandContext';
import { EditBandModal } from '../../components/Modals/EditBandModal';

type Props = NativeStackScreenProps<BandsStackParamList, 'BandDetail'>;

type TabType = 'setlists' | 'library' | 'members' | 'calendar';

export const BandDetailScreen = ({ route, navigation }: Props) => {
  const { bandId } = route.params;
  const { theme } = useTheme();
  const { bands, deleteBand } = useBand();
  const [activeTab, setActiveTab] = useState<TabType>('setlists');
  const [showEditModal, setShowEditModal] = useState(false);

  const band = bands.find((b) => b.id === bandId);

  if (!band) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={theme.typography.body}>Band not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Band',
      `Are you sure you want to delete "${band.name}"? This will delete all songs and setlists in this band. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBand(band.id);
              Alert.alert('Success', 'Band deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete band',
              );
            }
          },
        },
      ],
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'setlists':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={64} color="#999" />
              <Text style={[theme.typography.title2, { color: '#999', marginTop: 16 }]}>
                No setlists yet
              </Text>
              <Text style={[theme.typography.body, { color: '#999', marginTop: 8 }]}>
                Create your first setlist
              </Text>
            </View>
          </View>
        );
      case 'library':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={64} color="#999" />
              <Text style={[theme.typography.title2, { color: '#999', marginTop: 16 }]}>
                No songs yet
              </Text>
              <Text style={[theme.typography.body, { color: '#999', marginTop: 8 }]}>
                Add songs to build your library
              </Text>
            </View>
          </View>
        );
      case 'members':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#999" />
              <Text style={[theme.typography.title2, { color: '#999', marginTop: 16 }]}>
                No members yet
              </Text>
              <Text style={[theme.typography.body, { color: '#999', marginTop: 8 }]}>
                Coming in Phase 3
              </Text>
            </View>
          </View>
        );
      case 'calendar':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#999" />
              <Text style={[theme.typography.title2, { color: '#999', marginTop: 16 }]}>
                No shows scheduled
              </Text>
              <Text style={[theme.typography.body, { color: '#999', marginTop: 8 }]}>
                Coming in Phase 4
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#123053' }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>
        <Text style={[theme.typography.title1, { color: '#ffffff', flex: 1, fontWeight: '700' }]}>
          {band.name}
        </Text>
        <Pressable style={styles.headerButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#ffffff" />
        </Pressable>
        <Pressable
          style={styles.headerButton}
          onPress={() => setShowEditModal(true)}
        >
          <Ionicons name="create-outline" size={22} color="#ffffff" />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>{renderTabContent()}</ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('setlists')}
        >
          <Ionicons
            name={activeTab === 'setlists' ? 'list' : 'list-outline'}
            size={24}
            color={activeTab === 'setlists' ? '#123053' : '#999'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'setlists' ? '#123053' : '#999' },
            ]}
          >
            Setlists
          </Text>
        </Pressable>

        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('library')}
        >
          <Ionicons
            name={activeTab === 'library' ? 'musical-notes' : 'musical-notes-outline'}
            size={24}
            color={activeTab === 'library' ? '#123053' : '#999'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'library' ? '#123053' : '#999' },
            ]}
          >
            Library
          </Text>
        </Pressable>

        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('members')}
        >
          <Ionicons
            name={activeTab === 'members' ? 'people' : 'people-outline'}
            size={24}
            color={activeTab === 'members' ? '#123053' : '#999'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'members' ? '#123053' : '#999' },
            ]}
          >
            Members
          </Text>
        </Pressable>

        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('calendar')}
        >
          <Ionicons
            name={activeTab === 'calendar' ? 'calendar' : 'calendar-outline'}
            size={24}
            color={activeTab === 'calendar' ? '#123053' : '#999'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'calendar' ? '#123053' : '#999' },
            ]}
          >
            Calendar
          </Text>
        </Pressable>
      </View>

      <EditBandModal
        visible={showEditModal}
        bandId={band.id}
        bandName={band.name}
        onClose={() => setShowEditModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    backgroundColor: '#ffffff',
    paddingBottom: 8,
    paddingTop: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});