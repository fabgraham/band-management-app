import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthCard } from '../../components/Auth/AuthCard';
import { TextField } from '../../components/Forms/TextField';
import { AuthSwitchButton } from '../../components/Forms/AuthSwitchButton';
import { ThemedButton } from '../../components/Buttons/ThemedButton';
import { useTheme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/authStack.types';

type LoginFormValues = {
  email: string;
  password: string;
};

const ACTION_BUTTON_WIDTH = 180;
const LINK_BUTTON_WIDTH = ACTION_BUTTON_WIDTH * 2;

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });
  const { errors, isValid } = formState;
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { signIn, loading } = useAuth();

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await signIn(values.email, values.password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in';
      setServerError(message);
    }
  });

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <AuthCard>
          <View style={styles.logoWrapper}>
            <View style={styles.logoPlaceholder} />
            <Text style={[theme.typography.title1, { color: theme.colors.text }]}>BandMate</Text>
          </View>
          <Text style={[theme.typography.body, styles.description]}>
            Sign in to keep rehearsals, songs, and gigs synced with your bandmates.
          </Text>

          <TextField
            control={control}
            name="email"
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            rules={{ required: 'Email is required' }}
            error={errors.email}
          />

          <TextField
            control={control}
            name="password"
            label="Password"
            secureTextEntry={!showPassword}
            rules={{ required: 'Password is required' }}
            error={errors.password}
            rightAction={
              <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                <Text style={[styles.showText, { color: theme.colors.primary }]}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            }
          />

          {serverError && <Text style={[styles.error, { color: theme.colors.accent }]}>{serverError}</Text>}

          <ThemedButton
            label={loading ? 'Signing in…' : 'Sign in'}
            onPress={onSubmit}
            disabled={!isValid || loading}
            style={styles.actionButton}
            textStyle={styles.actionText}
            backgroundColor="#123053"
          />

          <Pressable style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={{ color: theme.colors.primary, fontWeight: '500' }}>Forgot password?</Text>
          </Pressable>
        </AuthCard>
        <AuthSwitchButton
          text="Don't have an account? Sign Up!"
          onPress={() => navigation.navigate('SignUp')}
          width={LINK_BUTTON_WIDTH}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#123053',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 6,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    marginBottom: 6,
  },
  description: {
    color: '#6e6e73',
    marginBottom: 16,
  },
  forgotLink: {
    alignSelf: 'center',
    marginTop: 8,
  },
  error: {
    marginBottom: 12,
  },
  showText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    width: ACTION_BUTTON_WIDTH,
    alignSelf: 'center',
  },
  actionText: {
    color: '#ffffff',
  },
});
