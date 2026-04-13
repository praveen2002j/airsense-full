import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';
import Icon from '@expo/vector-icons/Ionicons';
import Badge from './Badge';

export default function SensorStatusItem({ name, status }) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Icon name="hardware-chip-outline" size={24} color={theme.colors.textSecondary} style={styles.icon} />
        <Text style={styles.name}>{name}</Text>
      </View>
      <Badge label={status === 'Online' ? 'Active' : 'Offline'} status={status === 'Online' ? 'Excellent' : 'Critical'} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  icon: {
    marginRight: theme.spacing.md,
  },
  name: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
});
