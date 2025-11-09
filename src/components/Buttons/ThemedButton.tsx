import { Pressable, PressableStateCallbackType, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface ThemedButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const ThemedButton = ({ label, onPress, disabled, style, textStyle }: ThemedButtonProps) => {
  const { theme } = useTheme();

  const normalizedStyle = Array.isArray(style) ? style : style ? [style] : [];

  const buttonStyle: PressableStateCallbackType = ({ pressed }) => [
    styles.button,
    {
      backgroundColor: theme.colors.primary,
      opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      borderRadius: theme.borderRadius.card,
    },
    ...normalizedStyle,
  ];

  return (
    <Pressable onPress={onPress} style={buttonStyle} disabled={disabled}>
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.textOnPrimary,
            fontSize: theme.typography.callout.fontSize,
            fontWeight: theme.typography.callout.fontWeight,
            fontFamily: theme.typography.fontFamily,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
