import { StyleSheet, Text, View } from 'react-native';
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

      <ThemedButton
        label={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}
        onPress={toggleTheme}
      />
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
});
