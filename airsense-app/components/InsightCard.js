import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import Icon from '@expo/vector-icons/Ionicons';

export default function InsightCard({ insight }) {
  const { title, description, trend, iconName, type, actionLabel, onAction } = insight;
  
  const isRecommendation = type === 'recommendation';
  const color = isRecommendation ? theme.colors.blue : theme.colors.purple;

  return (
    <View style={[styles.card, isRecommendation && styles.recommendationCard]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon name={iconName || 'bulb-outline'} size={20} color={color} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {trend && (
          <Icon 
            name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'} 
            size={20} 
            color={trend === 'up' ? theme.colors.red : theme.colors.green} 
          />
        )}
      </View>
      <Text style={styles.description}>{description}</Text>
      
      {isRecommendation && actionLabel && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  recommendationCard: {
    borderWidth: 1,
    borderColor: theme.colors.blue + '40',
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
    fontWeight: '600',
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
    backgroundColor: theme.colors.blue + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  actionText: {
    color: theme.colors.blue,
    fontWeight: '600',
    fontSize: 14,
  },
});
