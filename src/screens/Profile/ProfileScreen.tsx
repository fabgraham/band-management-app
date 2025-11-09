import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAuth } from '../../context/AuthContext';
import { ThemedButton } from '../../components/Buttons/ThemedButton';
import { useTheme } from '../../theme';

const availableFonts = ['System', 'Georgia', 'Courier New'];

export const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const defaultName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '';
  const [savedState, setSavedState] = useState({
    name: defaultName,
    font: availableFonts[0],
    size: 18,
  });
  const [name, setName] = useState(savedState.name);
  const [selectedFont, setSelectedFont] = useState(savedState.font);
  const [fontSize, setFontSize] = useState(savedState.size);
  const [feedback, setFeedback] = useState<string | null>(null);

  const hasChanges = useMemo(
    () => name !== savedState.name || selectedFont !== savedState.font || fontSize !== savedState.size,
    [fontSize, name, savedState, selectedFont],
  );

  const handleSave = () => {
    setFeedback('Preferences saved!');
    setSavedState({ name, font: selectedFont, size: fontSize });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.screen}>

      <View style={styles.card}>
        <View style={styles.ribbon}>
          <Text style={styles.ribbonText}>NAME</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardSubtitle}>
            The name you would like to be displayed to you and your band mates
          </Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              setFeedback(null);
            }}
            placeholder="Your Name"
            placeholderTextColor="#9b9ba1"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.ribbon}>
          <Text style={styles.ribbonText}>FONT</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardSubtitle}>Set the font for the lyrics</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontPicker}>
            {availableFonts.map((font) => (
              <Pressable
                key={font}
                onPress={() => {
                  setSelectedFont(font);
                  setFeedback(null);
                }}
                style={[styles.fontChip, selectedFont === font && styles.fontChipActive]}
              >
                <Text style={[styles.fontChipText, { fontFamily: font as any }]}>{font}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={[styles.preview, { fontFamily: selectedFont as any }]}>
            “We’ll keep the groove steady.”
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.ribbon}>
          <Text style={styles.ribbonText}>LYRICS FONT SIZE</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardSubtitle}>Set the size of the font for the lyrics</Text>
          <Text style={styles.sliderValue}>{fontSize.toFixed(0)}pt</Text>
          <Slider
            minimumValue={12}
            maximumValue={36}
            step={1}
            value={fontSize}
            minimumTrackTintColor="#123053"
            maximumTrackTintColor="#d1d1d6"
            thumbTintColor="#123053"
            onValueChange={(value) => {
              setFontSize(value);
              setFeedback(null);
            }}
          />
          <View style={styles.previewCard}>
            <Text style={[styles.previewHeading, { fontFamily: selectedFont as any }]}>Preview</Text>
            <Text
              style={[
                styles.previewLyrics,
                { fontSize: fontSize, fontFamily: selectedFont as any },
              ]}
            >
              Meet me at the chorus, count us in on four.
            </Text>
          </View>
        </View>
      </View>

      {feedback && <Text style={styles.feedback}>{feedback}</Text>}

      <ThemedButton
        label="Log out"
        onPress={signOut}
        style={styles.logoutButton}
        backgroundColor="rgba(255,255,255,0.15)"
        textStyle={{ color: '#ffffff' }}
      />

      {hasChanges && (
        <ThemedButton
          label="Save changes"
          onPress={handleSave}
          style={styles.saveButton}
          backgroundColor="#123053"
          textStyle={{ color: '#ffffff' }}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#123053',
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 16,
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
  cardBody: {
    padding: 16,
  },
  cardSubtitle: {
    color: '#6b6b71',
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1c1c1e',
    backgroundColor: '#ffffff',
  },
  fontPicker: {
    marginBottom: 12,
  },
  fontChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  fontChipActive: {
    backgroundColor: '#e5e5ea',
  },
  fontChipText: {
    color: '#1c1c1e',
    fontSize: 13,
  },
  feedback: {
    fontSize: 12,
    color: '#34c759',
    marginBottom: 16,
  },
  preview: {
    color: '#1c1c1e',
    fontSize: 16,
  },
  sliderValue: {
    color: '#1c1c1e',
    fontWeight: '600',
    marginBottom: 8,
  },
  previewCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  previewHeading: {
    color: '#6b6b71',
    fontSize: 13,
    marginBottom: 6,
  },
  previewLyrics: {
    color: '#1c1c1e',
  },
  logoutButton: {
    alignSelf: 'center',
    width: 220,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  saveButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
});
