import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { theme } from '../styles/theme';
import { getInsights } from '../services/api';
import InsightCard from '../components/InsightCard';
import SectionHeader from '../components/SectionHeader';

export default function SmartInsightsScreen() {
  const insights = getInsights();
  const [fanEnabled, setFanEnabled] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      <SectionHeader title="Ventilation Control" />
      <View style={styles.controlCard}>
        <View style={styles.controlInfo}>
          <Text style={styles.controlTitle}>Ventilation System</Text>
          <Text style={styles.controlDesc}>{fanEnabled ? 'Running optimally' : 'Currently offline'}</Text>
        </View>
        <Switch
          value={fanEnabled}
          onValueChange={setFanEnabled}
          trackColor={{ false: theme.colors.divider, true: theme.colors.green }}
          thumbColor={theme.colors.textPrimary}
        />
      </View>

      <SectionHeader title="AI Insights" />
      {insights.map(item => (
        <InsightCard key={item.id} insight={item} />
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  controlCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlInfo: {
    flex: 1,
  },
  controlTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  controlDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
