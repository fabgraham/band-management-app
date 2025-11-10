import { StatusBar } from 'expo-status-bar';
import { Pressable } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeProvider, useTheme } from './src/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BandProvider } from './src/context/BandContext';
import { LoginScreen } from './src/screens/Auth/LoginScreen';
import { SignUpScreen } from './src/screens/Auth/SignUpScreen';
import { ForgotPasswordScreen } from './src/screens/Auth/ForgotPasswordScreen';
import { BandsScreen } from './src/screens/Bands/BandsScreen';
import { BandDetailScreen } from './src/screens/Bands/BandDetailScreen';
import { ProfileScreen } from './src/screens/Profile/ProfileScreen';
import { SongDetailScreen } from './src/screens/Library/SongDetailScreen';
import { SetlistDetailScreen } from './src/screens/Setlists/SetlistDetailScreen';
import { AuthStackParamList } from './src/navigation/authStack.types';
import { BandsStackParamList } from './src/navigation/bandsStack.types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const BandsStack = createNativeStackNavigator<BandsStackParamList>();

const getNavigationTheme = (
  mode: 'light' | 'dark',
  background: string,
  card: string,
  border: string,
  primary: string,
  text: string,
) => {
  const baseTheme = mode === 'light' ? DefaultTheme : DarkTheme;
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background,
      card,
      border,
      primary,
      text,
    },
  };
};

const BandsStackNavigator = () => (
  <BandsStack.Navigator>
    <BandsStack.Screen name="BandsHome" component={BandsScreen} options={{ headerShown: false }} />
    <BandsStack.Screen name="BandDetail" component={BandDetailScreen} options={{ headerShown: false }} />
    <BandsStack.Screen name="SongDetail" component={SongDetailScreen} options={{ headerShown: false }} />
    <BandsStack.Screen name="SetlistDetail" component={SetlistDetailScreen} options={{ headerShown: false }} />
    <BandsStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={({ navigation }) => ({
        title: 'Profile Settings',
        headerStyle: {
          backgroundColor: '#123053',
        },
        headerShadowVisible: false,
        headerTitleStyle: { color: '#ffffff', fontWeight: '700', fontSize: 28 },
        headerLeftContainerStyle: { paddingLeft: 16, paddingRight: 10 },
        headerRightContainerStyle: { paddingRight: 16 },
        headerStatusBarHeight: 10,
        headerLeft: () => (
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
        ),
      })}
    />
  </BandsStack.Navigator>
);

const AppContent = () => {
  const { theme, mode } = useTheme();
  const { user } = useAuth();
  const navigationTheme = getNavigationTheme(
    mode,
    theme.colors.background,
    theme.colors.card,
    theme.colors.border,
    theme.colors.primary,
    theme.colors.text,
  );

  return (
    <>
      <NavigationContainer theme={navigationTheme}>
        {user ? (
          <BandsStackNavigator />
        ) : (
          <AuthStack.Navigator
            initialRouteName="SignUp"
            screenOptions={{
              contentStyle: { backgroundColor: theme.colors.background },
              headerStyle: { backgroundColor: theme.colors.card },
              headerTitleStyle: { color: theme.colors.text },
            }}
          >
            <AuthStack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ headerShown: false }}
            />
            <AuthStack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <AuthStack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ title: 'Reset password' }}
            />
          </AuthStack.Navigator>
        )}
      </NavigationContainer>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BandProvider>
          <AppContent />
        </BandProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
