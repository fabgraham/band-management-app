import { Pressable, StyleSheet, Text } from 'react-native';

interface AuthSwitchButtonProps {
  text: string;
  onPress: () => void;
  width: number;
}

export const AuthSwitchButton = ({ text, onPress, width }: AuthSwitchButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        {
          width,
          borderColor: '#ffffff',
          backgroundColor: '#123053',
        },
      ]}
    >
      <Text style={[styles.text, { color: '#ffffff' }]}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    fontSize: 14,
  },
});
