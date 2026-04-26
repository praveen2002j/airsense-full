import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useAppTheme } from '../styles/theme';
import { getInsights } from '../services/api';
import InsightCard from '../components/InsightCard';
import SectionHeader from '../components/SectionHeader';
import CardAccent from '../components/CardAccent';

export default function SmartInsightsScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const insights = getInsights();
  const [fanEnabled, setFanEnabled] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>AI guidance</Text>
        <Text style={styles.title}>Translate patterns into recommendations</Text>
        <Text style={styles.copy}>
          This surface combines descriptive insight cards with conversational support to help users interpret trends and act with confidence.
        </Text>
      </View>

      <SectionHeader title="Ventilation control" subtitle="A lightweight action surface aligned with the monitoring context." />
      <View style={styles.controlCard}>
        <CardAccent color={theme.colors.cyan} radius={theme.borderRadius.lg} />
        <View style={styles.controlInfo}>
          <Text style={styles.controlTitle}>Ventilation system</Text>
          <Text style={styles.controlDesc}>{fanEnabled ? 'Running optimally to improve indoor conditions' : 'Currently offline and awaiting activation'}</Text>
        </View>
        <Switch
          value={fanEnabled}
          onValueChange={setFanEnabled}
          trackColor={{ false: theme.colors.divider, true: theme.colors.green }}
          thumbColor={theme.colors.white}
        />
      </View>

      <SectionHeader title="AI insights" subtitle="Short, decision-oriented summaries drawn from the current dashboard state." />
      {insights.map((item) => (
        <InsightCard key={item.id} insight={item} />
      ))}
    </ScrollView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl + 96,
  },
  hero: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.card,
  },
  kicker: {
    color: theme.colors.cyan,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 10,
    lineHeight: 32,
  },
  copy: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  controlCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.md + 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  controlInfo: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  controlTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '800',
    marginBottom: 4,
  },
  controlDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
});
