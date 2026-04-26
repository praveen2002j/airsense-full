import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAppTheme } from '../styles/theme';
import { getAlertHistory } from '../services/api';
import AlertCard from '../components/AlertCard';
import SectionHeader from '../components/SectionHeader';
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';
import CardAccent from '../components/CardAccent';

export default function AlertHistoryScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const result = await getAlertHistory();
      setData(result);
    } catch (err) {
      console.error('AlertHistory fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.blue} />
      </View>
    );
  }

  if (!data) return null;

  const formattedChartData = (data.chartData || []).map((d) => ({ x: d.day.slice(5), y: d.alerts }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.blue} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>Alert history</Text>
        <Text style={styles.heroTitle}>Historical context for alert-driven decisions</Text>
        <Text style={styles.heroText}>
          Understand alert volume, severity mix, and recent patterns so users can move from reactive monitoring to informed action.
        </Text>
      </View>

      <SectionHeader title="7-day summary" subtitle="Quick signal on frequency and severity of recent events." />
      <View style={styles.statsGrid}>
        <StatCard theme={theme} label="Total" value={data.statistics.total} />
        <StatCard theme={theme} label="Critical" value={data.statistics.critical} tone={theme.colors.red} />
        <StatCard theme={theme} label="Warning" value={data.statistics.warning} tone={theme.colors.yellow} />
        <StatCard theme={theme} label="Safe" value={data.statistics.safe} tone={theme.colors.green} />
      </View>

      <SectionHeader title="Alert volume" subtitle="Daily distribution of recent alert activity." />
      <View style={styles.chartContainer}>
        <CardAccent color={theme.colors.blue} radius={theme.borderRadius.lg} />
        {formattedChartData.length > 0 ? (
          <VictoryChart
            height={260}
            padding={{ top: 24, bottom: 44, left: 44, right: 24 }}
            domainPadding={{ x: 18 }}
          >
            <VictoryAxis
              style={{
                tickLabels: { fill: theme.colors.textMuted, fontSize: 11 },
                axis: { stroke: theme.colors.divider },
                grid: { stroke: 'transparent' },
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                tickLabels: { fill: theme.colors.textMuted, fontSize: 11 },
                axis: { stroke: 'transparent' },
                grid: { stroke: theme.colors.divider, opacity: 0.6 },
              }}
            />
            <VictoryBar
              data={formattedChartData}
              style={{ data: { fill: theme.colors.blue, width: 18 } }}
              cornerRadius={{ top: 6 }}
            />
          </VictoryChart>
        ) : (
          <Text style={styles.emptyText}>No historical alert data available yet.</Text>
        )}
      </View>

      <SectionHeader title="Recent alerts" subtitle="Latest events for detailed review." />
      {(data.recent || []).map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </ScrollView>
  );
}

function StatCard({ theme, label, value, tone }) {
  const styles = createStyles(theme);
  return (
    <View style={styles.statsCard}>
      <CardAccent color={tone || theme.colors.blue} radius={theme.borderRadius.lg} />
      <Text style={styles.statsLabel}>{label}</Text>
      <Text style={[styles.statsVal, tone ? { color: tone } : null]}>{value}</Text>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl + 110 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  hero: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.card,
  },
  heroKicker: {
    color: theme.colors.blue,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 10,
    lineHeight: 32,
  },
  heroText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    width: '48%',
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.md + 8,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  statsLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '700',
  },
  statsVal: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  chartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingLeft: theme.spacing.xs + 8,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    padding: theme.spacing.lg,
    fontSize: 13,
    textAlign: 'center',
  },
});
