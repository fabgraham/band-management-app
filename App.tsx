import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeProvider, useTheme } from './src/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BandProvider } from './src/context/BandContext';
import { LoginScreen } from './src/screens/Auth/LoginScreen';
import { SignUpScreen } from './src/screens/Auth/SignUpScreen';
import { ForgotPasswordScreen } from './src/screens/Auth/ForgotPasswordScreen';
import { LibraryScreen } from './src/screens/Library/LibraryScreen';
import { SetlistsScreen } from './src/screens/Setlists/SetlistsScreen';
import { SettingsScreen } from './src/screens/Settings/SettingsScreen';
import { AuthStackParamList } from './src/navigation/authStack.types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator();

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

const AppTabs = () => {
  const { theme } = useTheme();

  const iconForRoute = (routeName: string) => {
    switch (routeName) {
      case 'Library':
        return 'musical-notes';
      case 'Setlists':
        return 'list';
      case 'Settings':
        return 'settings';
      default:
        return 'ellipse';
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconForRoute(route.name)} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Setlists" component={SetlistsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

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
          <AppTabs />
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
