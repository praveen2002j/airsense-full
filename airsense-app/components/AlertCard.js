import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../styles/theme';
import Icon from '@expo/vector-icons/Ionicons';
import Badge from './Badge';
import CardAccent from './CardAccent';

export default function AlertCard({ alert }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { title, room, time, severity, value, iconName } = alert;

  let iconColor = theme.colors.green;
  if (severity === 'Critical') iconColor = theme.colors.red;
  else if (severity === 'Warning') iconColor = theme.colors.yellow;

  return (
    <View style={styles.card}>
      <CardAccent color={iconColor} radius={theme.borderRadius.lg} />
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Icon name={iconName || 'alert-circle'} size={24} color={iconColor} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{room} • {time}</Text>
        <Text style={styles.valueText}>{value}</Text>
      </View>

      <View style={styles.badgeContainer}>
        <Badge label={severity} status={severity} />
      </View>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.md + 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  badgeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
