import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../styles/theme';
import Icon from '@expo/vector-icons/Ionicons';
import CardAccent from './CardAccent';

export default function InsightCard({ insight }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { title, description, trend, iconName, type, actionLabel, onAction } = insight;

  const isRecommendation = type === 'recommendation';
  const color = isRecommendation ? theme.colors.cyan : theme.colors.purple;

  return (
    <View style={[styles.card, isRecommendation && styles.recommendationCard]}>
      <CardAccent color={color} radius={theme.borderRadius.lg} />
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon name={iconName || 'bulb-outline'} size={20} color={color} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {trend ? (
          <Icon
            name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
            size={20}
            color={trend === 'up' ? theme.colors.red : theme.colors.green}
          />
        ) : null}
      </View>
      <Text style={styles.description}>{description}</Text>

      {isRecommendation && actionLabel ? (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.md + 8,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  recommendationCard: {
    borderColor: theme.colors.cyan + '55',
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginLeft: 44,
  },
  actionButton: {
    marginTop: theme.spacing.md,
    marginLeft: 44,
    backgroundColor: theme.colors.cyan + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.pill,
    alignSelf: 'flex-start',
  },
  actionText: {
    color: theme.colors.cyan,
    fontWeight: '700',
    fontSize: 13,
  },
});
