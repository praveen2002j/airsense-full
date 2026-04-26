import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAppTheme } from '../styles/theme';
import { getSystemHealth } from '../services/api';
import SectionHeader from '../components/SectionHeader';
import SensorStatusItem from '../components/SensorStatusItem';
import Badge from '../components/Badge';
import CardAccent from '../components/CardAccent';

export default function SystemHealthScreen({ navigation }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const result = await getSystemHealth();
      setData(result);
    } catch (err) {
      console.error('SystemHealth fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.blue} />}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>Operational health</Text>
        <Text style={styles.title}>System reliability at a glance</Text>
        <Text style={styles.copy}>
          Track data freshness, connectivity, and sensor availability to support trustworthy decision-making.
        </Text>

        <View style={styles.scoreRow}>
          <CardAccent color={theme.colors.green} radius={theme.borderRadius.lg} />
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{data.healthScore}<Text style={styles.scoreUnit}>%</Text></Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>Platform health</Text>
            <Badge label={data.status} status={data.status} />
            <Text style={styles.scoreSub}>Healthy monitoring systems improve confidence in all downstream analytics.</Text>
          </View>
        </View>
      </View>

      <SectionHeader title="Sensors" subtitle="Availability across the monitoring stack." actionTitle="Open Analytics" onActionPress={() => navigation.navigate('Analytics')} />
      <View style={styles.card}>
        <CardAccent color={theme.colors.green} radius={theme.borderRadius.lg} />
        {data.sensors.map((sensor) => (
          <View key={sensor.id}>
            <SensorStatusItem name={sensor.name} status={sensor.status} />
          </View>
        ))}
      </View>

      <SectionHeader title="Connectivity" subtitle="Critical integration points used by the system." />
      <View style={styles.card}>
        <CardAccent color={theme.colors.blue} radius={theme.borderRadius.lg} />
        {data.connectivity.map((conn, index) => (
          <View key={conn.id} style={[styles.connItem, index < data.connectivity.length - 1 && styles.borderBottom]}>
            <Text style={styles.connName}>{conn.name}</Text>
            <Text style={styles.connStatus}>{conn.status}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Operational statistics" subtitle="Core indicators for platform monitoring." />
      <View style={styles.statsGrid}>
        <View style={styles.statsCard}><CardAccent color={theme.colors.cyan} radius={theme.borderRadius.lg} /><Text style={styles.statsLabel}>Uptime</Text><Text style={styles.statsVal}>{data.statistics.uptime}</Text></View>
        <View style={styles.statsCard}><CardAccent color={theme.colors.blue} radius={theme.borderRadius.lg} /><Text style={styles.statsLabel}>Data points</Text><Text style={styles.statsVal}>{data.statistics.dataPoints}</Text></View>
        <View style={styles.statsCard}><CardAccent color={theme.colors.yellow} radius={theme.borderRadius.lg} /><Text style={styles.statsLabel}>Latency</Text><Text style={styles.statsVal}>{data.statistics.latency}</Text></View>
        <View style={styles.statsCard}><CardAccent color={theme.colors.red} radius={theme.borderRadius.lg} /><Text style={styles.statsLabel}>Errors</Text><Text style={styles.statsVal}>{data.statistics.errors}</Text></View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl + 96 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
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
  },
  copy: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.md + 8,
    gap: theme.spacing.md,
    overflow: 'hidden',
  },
  scoreCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 6,
    borderColor: theme.colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cardMuted,
  },
  scoreValue: { fontSize: 28, fontWeight: '900', color: theme.colors.textPrimary },
  scoreUnit: { fontSize: 16, color: theme.colors.textMuted },
  scoreInfo: { flex: 1 },
  scoreTitle: { fontSize: 18, color: theme.colors.textPrimary, marginBottom: 8, fontWeight: '800' },
  scoreSub: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 10 },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingLeft: theme.spacing.md + 8,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  connItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.md, gap: theme.spacing.md },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
  connName: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
  connStatus: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
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
  statsLabel: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 8, fontWeight: '700' },
  statsVal: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '800' },
});
