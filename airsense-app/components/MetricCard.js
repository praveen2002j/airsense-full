import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../styles/theme';
import Icon from '@expo/vector-icons/Ionicons';
import CardAccent from './CardAccent';

export default function MetricCard({ title, value, unit, iconName, color }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const tone = color || theme.colors.blue;

  return (
    <View style={styles.card}>
      <CardAccent color={tone} radius={theme.borderRadius.lg} />
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: tone + '1F' }]}>
          <Icon name={iconName} size={18} color={tone} />
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value ?? '—'}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.md + 6,
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    flex: 1,
    marginLeft: theme.spacing.sm,
    lineHeight: 18,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingRight: theme.spacing.md,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  unit: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginLeft: 6,
    fontWeight: '700',
  },
});
