import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';

interface ActionMenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionMenuModalProps {
  visible: boolean;
  onClose: () => void;
  items: ActionMenuItem[];
}

export const ActionMenuModal = ({
  visible,
  onClose,
  items,
}: ActionMenuModalProps) => {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.menuContainer, { backgroundColor: theme.colors.card }]}>
          {items.map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.menuItem,
                index < items.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={item.destructive ? '#FF3B30' : theme.colors.text}
                style={styles.menuIcon}
              />
              <Text
                style={[
                  styles.menuText,
                  { color: item.destructive ? '#FF3B30' : theme.colors.text },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuContainer: {
    width: '60%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
