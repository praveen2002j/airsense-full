import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAppTheme } from '../styles/theme';
import { getActiveAlerts } from '../services/api';
import AlertCard from '../components/AlertCard';
import SectionHeader from '../components/SectionHeader';
import CardAccent from '../components/CardAccent';

export default function AlertsScreen({ navigation }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const result = await getActiveAlerts();
      setAlerts(result);
    } catch (err) {
      console.error('Alerts fetch error:', err.message);
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

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.blue} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.blue} />}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>Alert center</Text>
        <Text style={styles.title}>Prioritize conditions that require action</Text>
        <Text style={styles.copy}>
          Alerts convert raw sensor readings into operational risk signals, helping users respond faster to safety and comfort issues.
        </Text>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryPillText}>{alerts.length} active alert{alerts.length === 1 ? '' : 's'}</Text>
        </View>
      </View>

      <SectionHeader title="Active alerts" subtitle="Ordered for clear review and rapid response." actionTitle="History" onActionPress={() => navigation.navigate('AlertHistory')} />

      {alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CardAccent color={theme.colors.green} radius={theme.borderRadius.lg} />
          <Text style={styles.emptyTitle}>No active alerts</Text>
          <Text style={styles.emptyText}>Current readings are within expected thresholds.</Text>
        </View>
      ) : (
        alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))
      )}
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
    color: theme.colors.red,
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
  summaryPill: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  summaryPillText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: theme.spacing.md,
    paddingLeft: theme.spacing.md + 8,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  emptyTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptyText: { color: theme.colors.textSecondary, fontSize: 14 },
});
