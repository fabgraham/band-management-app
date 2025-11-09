import type { ReactNode } from 'react';
import { Controller, Control, FieldError } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme';

interface TextFieldProps extends TextInputProps {
  control: Control<any>;
  name: string;
  label: string;
  rules?: Record<string, unknown>;
  error?: FieldError;
  rightAction?: ReactNode;
}

export const TextField = ({
  control,
  name,
  label,
  rules,
  error,
  rightAction,
  ...textInputProps
}: TextFieldProps) => {
  const { theme } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, theme.typography.footnote]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: error ? theme.colors.accent : theme.colors.border,
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily,
                },
              ]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholderTextColor="#9b9ba1"
              {...textInputProps}
            />
            {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
          </View>
        )}
      />
      {error && <Text style={[styles.error, { color: theme.colors.accent }]}>{error.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  rightAction: {
    marginLeft: 8,
  },
  error: {
    marginTop: 4,
    fontSize: 13,
  },
});
