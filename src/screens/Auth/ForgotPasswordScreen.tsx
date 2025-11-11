import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthCard } from '../../components/Auth/AuthCard';
import { AuthSwitchButton } from '../../components/Forms/AuthSwitchButton';
import { TextField } from '../../components/Forms/TextField';
import { ThemedButton } from '../../components/Buttons/ThemedButton';
import { useTheme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/authStack.types';

type ForgotPasswordFormValues = {
  email: string;
};

const ACTION_BUTTON_WIDTH = 180;
const LINK_BUTTON_WIDTH = ACTION_BUTTON_WIDTH * 2;
type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = ({ navigation }: ForgotPasswordScreenProps) => {
  const { control, handleSubmit, formState } = useForm<ForgotPasswordFormValues>({
    mode: 'onChange',
    defaultValues: { email: '' },
  });
  const { errors, isValid } = formState;
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { resetPassword, loading } = useAuth();

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setServerMessage(null);
    try {
      await resetPassword(values.email);
      setServerMessage('Check your inbox for a password reset link.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset link.';
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
            Forgot something? Enter your email to receive a reset link.
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

          {serverError && <Text style={[styles.error, { color: theme.colors.accent }]}>{serverError}</Text>}
          {serverMessage && <Text style={[styles.error, { color: theme.colors.primary }]}>{serverMessage}</Text>}

          <ThemedButton
            label={loading ? 'Sending link…' : 'Send reset link'}
            onPress={onSubmit}
            disabled={!isValid || loading}
            style={styles.actionButton}
            textStyle={styles.actionText}
            backgroundColor="#133053"
          />
        </AuthCard>
        <AuthSwitchButton
          text="Back to Sign In"
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
    backgroundColor: '#133053',
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
  error: {
    marginBottom: 12,
  },
  actionButton: {
    width: ACTION_BUTTON_WIDTH,
    alignSelf: 'center',
  },
  actionText: {
    color: '#ffffff',
  },
});
