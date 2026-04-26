import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../styles/theme';
import Icon from '@expo/vector-icons/Ionicons';
import Badge from './Badge';

export default function SensorStatusItem({ name, status }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Icon name="hardware-chip-outline" size={18} color={theme.colors.blue} />
        </View>
        <Text style={styles.name}>{name}</Text>
      </View>
      <Badge label={status === 'Online' ? 'Active' : 'Offline'} status={status === 'Online' ? 'Excellent' : 'Critical'} />
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  name: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
});
