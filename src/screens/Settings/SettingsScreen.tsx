import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { InfoCard } from '../../components/Cards/InfoCard';
import { ThemedButton } from '../../components/Buttons/ThemedButton';

export const SettingsScreen = () => {
  const { theme, mode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[theme.typography.title1, { color: theme.colors.text }]}>Settings</Text>
      <InfoCard>
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>
          Signed in as
        </Text>
        <Text style={[theme.typography.title2, { color: theme.colors.text, marginTop: 4 }]}>
          {user?.email ?? 'Guest user'}
        </Text>
      </InfoCard>

      <Pressable style={[styles.settingRow, { backgroundColor: theme.colors.card }]} onPress={toggleTheme}>
        <Text style={[styles.rowLabel, theme.typography.body, { color: theme.colors.text }]}>
          Switch to {mode === 'light' ? 'Dark' : 'Light'} Mode
        </Text>
        <Text style={[styles.rowHint, theme.typography.footnote, { color: theme.colors.accent }]}>
          {mode === 'light' ? 'Dark mode dims the stage lighting' : 'Light mode keeps the view bright'}
        </Text>
      </Pressable>
      <ThemedButton label="Sign out" onPress={signOut} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  settingRow: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rowLabel: {
    marginBottom: 4,
  },
  rowHint: {
    opacity: 0.75,
  },
});
