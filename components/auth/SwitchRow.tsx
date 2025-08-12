import { StyleSheet, Switch, Text, View } from 'react-native';
import { Theme } from '@/constants/theme';

type Props = {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
};

export function SwitchRow({ label, value, onValueChange }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Theme.colors.switchTrack, true: Theme.colors.primary }}
        thumbColor={'#FFFFFF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: Theme.colors.textPrimary,
    marginRight: 12,
  },
});

