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

type SignUpFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

const ACTION_BUTTON_WIDTH = 180;
const LINK_BUTTON_WIDTH = ACTION_BUTTON_WIDTH * 2;
type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const { control, handleSubmit, formState } = useForm<SignUpFormValues>({
    mode: 'onChange',
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });
  const { errors, isValid } = formState;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { signUp, loading } = useAuth();

  const onSubmit = handleSubmit(async (values) => {
    if (values.password !== values.confirmPassword) {
      setServerError('Passwords must match.');
      return;
    }

    if (!acceptedTerms) {
      setServerError('You must accept the Terms of Service.');
      return;
    }

    setServerError(null);
    try {
      await signUp(values.email, values.password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account.';
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
            Create an account to keep your band synced, even offline.
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

          <TextField
            control={control}
            name="confirmPassword"
            label="Confirm Password"
            secureTextEntry={!showConfirm}
            rules={{ required: 'Confirming your password helps prevent typos' }}
            error={errors.confirmPassword}
            rightAction={
              <Pressable onPress={() => setShowConfirm((prev) => !prev)}>
                <Text style={[styles.showText, { color: theme.colors.primary }]}>
                  {showConfirm ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            }
          />

          <Pressable
            style={styles.termsToggle}
            onPress={() => setAcceptedTerms((prev) => !prev)}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
              {acceptedTerms && <View style={styles.checkboxDot} />}
            </View>
            <Text style={[styles.termsText, { color: '#6e6e73' }]}>
              I agree to the{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Terms of Service</Text>{' '}
              and{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Privacy Policy</Text>
              .
            </Text>
          </Pressable>

          {serverError && <Text style={[styles.error, { color: theme.colors.accent }]}>{serverError}</Text>}

          <ThemedButton
            label={loading ? 'Creating account…' : 'Sign up'}
            onPress={onSubmit}
            disabled={!isValid || !acceptedTerms || loading}
            style={[styles.actionButton, styles.primaryAction]}
            textStyle={styles.actionText}
          />
        </AuthCard>
        <AuthSwitchButton
          text="Already have an account? Log in."
          onPress={() => navigation.navigate('Login')}
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
  showText: {
    fontSize: 14,
    fontWeight: '600',
  },
  termsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c6c6c8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxDot: {
    width: 10,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    marginBottom: 12,
  },
  actionButton: {
    width: ACTION_BUTTON_WIDTH,
    alignSelf: 'center',
  },
  primaryAction: {
    backgroundColor: '#123053',
  },
  actionText: {
    color: '#ffffff',
  },
});
