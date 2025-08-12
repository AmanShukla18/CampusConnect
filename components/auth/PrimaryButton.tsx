import { Pressable, StyleSheet, Text } from 'react-native';
import { Theme } from '@/constants/theme';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ title, onPress, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        pressed && { backgroundColor: Theme.colors.primaryPressed },
        disabled && { opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

