import { Pressable, PressableStateCallbackType, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface ThemedButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  backgroundColor?: string;
}

export const ThemedButton = ({
  label,
  onPress,
  disabled,
  style,
  textStyle,
  backgroundColor,
}: ThemedButtonProps) => {
  const { theme } = useTheme();

  const normalizedStyle = Array.isArray(style) ? style : style ? [style] : [];
  const buttonColor = backgroundColor ?? theme.colors.primary;

  const buttonStyle: PressableStateCallbackType = ({ pressed }) => [
    styles.button,
    {
      backgroundColor: buttonColor,
      opacity: disabled ? 0.85 : pressed ? 0.9 : 1,
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
