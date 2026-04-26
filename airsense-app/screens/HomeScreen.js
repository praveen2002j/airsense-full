import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../styles/theme';
import { getDashboardData } from '../services/api';
import MetricCard from '../components/MetricCard';
import SectionHeader from '../components/SectionHeader';
import Icon from '@expo/vector-icons/Ionicons';
import Badge from '../components/Badge';
import CardAccent from '../components/CardAccent';

const getStatusTone = (theme, status) => {
  if (status === 'Critical') return theme.colors.red;
  if (status === 'Warning' || status === 'Moderate') return theme.colors.yellow;
  return theme.colors.green;
};

export default function HomeScreen({ navigation }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await getDashboardData();
      setData(result);
    } catch (err) {
      setError('Failed to load data');
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'No data'}</Text>
          <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusTone(theme, data.overview.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.blue} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>Indoor air intelligence</Text>
              <Text style={styles.appName}>AirSense Command Center</Text>
              <Text style={styles.heroText}>
                Monitor live conditions, surface risks quickly, and support faster decisions with data plus AI guidance.
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.headerAction}>
              <Icon name="notifications-outline" size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

        <View style={styles.statusPanel}>
          <CardAccent color={statusColor} radius={theme.borderRadius.lg} />
          <View style={styles.statusTop}>
              <View>
                <Text style={styles.statusLabel}>Current air quality</Text>
                <Text style={styles.statusValue}>{data.metrics.co2.value ?? '—'}</Text>
                <Text style={styles.statusUnit}>CO2 ppm</Text>
              </View>
              <Badge label={data.overview.status} status={data.overview.status} />
            </View>

            <View style={styles.scoreBand}>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreTitle}>Air score</Text>
                <Text style={styles.scoreValue}>{data.overview.score}%</Text>
              </View>
              <View style={styles.scoreDivider} />
              <View style={styles.scoreCard}>
                <Text style={styles.scoreTitle}>Occupancy</Text>
                <Text style={styles.scoreValue}>{data.occupancy.value ?? '—'}</Text>
              </View>
            </View>

            <View style={styles.storyStrip}>
              <View style={[styles.storyAccent, { backgroundColor: statusColor }]} />
              <Text style={styles.storyText}>
                Decision support: prioritize ventilation when CO2 rises, review humidity comfort bands, and validate risk with alert history.
              </Text>
            </View>
          </View>
        </View>

        <SectionHeader title="Live readings" subtitle="High-signal metrics for quick situational awareness." />
        <View style={styles.grid}>
          <View style={styles.row}>
            <MetricCard title="CO2 level" value={data.metrics.co2.value} unit={data.metrics.co2.unit} iconName={data.metrics.co2.icon} color={theme.colors.yellow} />
            <MetricCard title="Temperature" value={data.metrics.temperature.value} unit={data.metrics.temperature.unit} iconName={data.metrics.temperature.icon} color={theme.colors.blue} />
          </View>
          <View style={styles.row}>
            <MetricCard title="Humidity" value={data.metrics.humidity.value} unit={data.metrics.humidity.unit} iconName={data.metrics.humidity.icon} color={theme.colors.green} />
            <MetricCard title="Carbon monoxide" value={data.metrics.co.value} unit={data.metrics.co.unit} iconName={data.metrics.co.icon} color={theme.colors.red} />
          </View>
        </View>

        <SectionHeader title="Decision snapshot" subtitle="Contextual indicators that support operational response." />
        <View style={styles.snapshotCard}>
          <CardAccent color={theme.colors.blue} radius={theme.borderRadius.lg} />
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotLabel}>System health</Text>
            <Text style={styles.snapshotValue}>{data.overview.score}%</Text>
          </View>
          <View style={styles.snapshotDivider} />
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotLabel}>Status</Text>
            <Text style={styles.snapshotValue}>{data.overview.status}</Text>
          </View>
          <View style={styles.snapshotDivider} />
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotLabel}>People detected</Text>
            <Text style={styles.snapshotValue}>{data.occupancy.value ?? '—'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl + 96 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.blue + '20',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  appName: { color: theme.colors.textPrimary, fontSize: 30, fontWeight: '900', lineHeight: 34 },
  heroText: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 320 },
  headerAction: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1,
    borderColor: theme.colors.divider, justifyContent: 'center', alignItems: 'center',
  },
  statusPanel: {
    marginTop: theme.spacing.lg, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.divider,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, paddingLeft: theme.spacing.md + 8, ...theme.shadows.soft,
    overflow: 'hidden',
  },
  statusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md },
  statusLabel: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  statusValue: { color: theme.colors.textPrimary, fontSize: 44, fontWeight: '900', marginTop: 8 },
  statusUnit: { color: theme.colors.textSecondary, fontSize: 15, marginTop: 2 },
  scoreBand: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.borderRadius.lg,
    paddingVertical: 14, paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.md,
  },
  scoreCard: { flex: 1 },
  scoreTitle: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  scoreValue: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: '800' },
  scoreDivider: { width: 1, height: 34, backgroundColor: theme.colors.divider, marginHorizontal: theme.spacing.md },
  storyStrip: { marginTop: theme.spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  storyAccent: { width: 4, borderRadius: theme.borderRadius.pill, alignSelf: 'stretch' },
  storyText: { flex: 1, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
  errorText: { color: theme.colors.red, fontSize: 16, marginBottom: 12 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: theme.colors.blue, borderRadius: theme.borderRadius.pill },
  retryText: { color: theme.colors.white, fontWeight: '700' },
  grid: { marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  snapshotCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.divider,
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md, paddingLeft: theme.spacing.md + 8, flexDirection: 'row', alignItems: 'center', ...theme.shadows.soft,
    overflow: 'hidden',
  },
  snapshotItem: { flex: 1 },
  snapshotLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  snapshotValue: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '800' },
  snapshotDivider: { width: 1, height: 38, backgroundColor: theme.colors.divider, marginHorizontal: theme.spacing.sm },
});
