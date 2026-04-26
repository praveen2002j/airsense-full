import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../styles/theme';
import { getActiveAlerts } from '../services/api';
import CardAccent from '../components/CardAccent';

const formatTime = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
};

const metricLabel = (metric) => {
  if (metric === 'co2') return 'CO2';
  if (metric === 'co') return 'CO';
  if (metric === 'temperature') return 'Temperature';
  if (metric === 'humidity') return 'Humidity';
  if (metric === 'occupancy') return 'Occupancy';
  return 'Sensor';
};

const severityMeta = (severity, theme) => {
  if (severity === 'Critical') {
    return {
      color: theme.colors.red,
      tint: `${theme.colors.red}12`,
      icon: 'alert-circle',
      label: 'Critical',
    };
  }

  return {
    color: theme.colors.yellow,
    tint: `${theme.colors.yellow}12`,
    icon: 'warning',
    label: severity || 'Warning',
  };
};

export default function NotificationsScreen({ navigation }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const result = await getActiveAlerts();
      setAlerts(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Notifications fetch error:', err.message);
      setAlerts([]);
      setError('Unable to load notifications right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const criticalCount = alerts.filter((item) => item.severity === 'Critical').length;
  const warningCount = alerts.length - criticalCount;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton}>
          <Icon name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={fetchAlerts} style={styles.navButton}>
          <Icon name="refresh-outline" size={18} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.blue} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <Icon name="notifications" size={22} color={theme.colors.white} />
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{`${alerts.length} active`}</Text>
            </View>
          </View>
          <Text style={styles.heroKicker}>Alert inbox</Text>
          <Text style={styles.heroTitle}>Keep critical events visible and actionable</Text>
          <Text style={styles.heroText}>
            Review threshold breaches and recent air-quality warnings in one focused view designed for quick scanning and response.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <CardAccent color={theme.colors.red} radius={theme.borderRadius.lg} />
            <Text style={styles.summaryLabel}>Critical</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.red }]}>{criticalCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <CardAccent color={theme.colors.yellow} radius={theme.borderRadius.lg} />
            <Text style={styles.summaryLabel}>Warnings</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.yellow }]}>{warningCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <CardAccent color={theme.colors.blue} radius={theme.borderRadius.lg} />
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{alerts.length}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today</Text>
          <Text style={styles.sectionCaption}>Newest first</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.blue} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <CardAccent color={theme.colors.red} radius={theme.borderRadius.lg} />
            <View style={styles.stateIcon}>
              <Icon name="cloud-offline-outline" size={24} color={theme.colors.red} />
            </View>
            <Text style={styles.stateTitle}>Notifications unavailable</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchAlerts}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : alerts.length === 0 ? (
          <View style={styles.stateCard}>
            <CardAccent color={theme.colors.green} radius={theme.borderRadius.lg} />
            <View style={styles.stateIcon}>
              <Icon name="checkmark-done-circle-outline" size={24} color={theme.colors.green} />
            </View>
            <Text style={styles.stateTitle}>No notifications right now</Text>
            <Text style={styles.stateText}>Everything looks stable. New alerts will appear here when a threshold is exceeded.</Text>
          </View>
        ) : (
          alerts.map((item) => {
            const severity = severityMeta(item.severity, theme);

            return (
              <View key={String(item.id)} style={styles.notificationItem}>
                <View style={[styles.alertRail, { backgroundColor: severity.color }]} />
                <View style={[styles.notifIcon, { backgroundColor: severity.tint }]}>
                  <Icon name={severity.icon} size={20} color={severity.color} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifTopRow}>
                    <Text style={styles.notifTitle}>{item.title || 'System alert'}</Text>
                    <View style={[styles.severityBadge, { backgroundColor: severity.tint, borderColor: `${severity.color}40` }]}>
                      <Text style={[styles.severityText, { color: severity.color }]}>{severity.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.notifSubtitle}>{`${metricLabel(item.metric)} • ${item.value || 'No value available'}`}</Text>
                  <View style={styles.metaRow}>
                    <Icon name="time-outline" size={13} color={theme.colors.textMuted} />
                    <Text style={styles.notifTime}>{formatTime(item.time)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    backgroundColor: theme.colors.backgroundAlt,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  headerTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '800' },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl + 96 },
  hero: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  heroGlowLarge: {
    position: 'absolute',
    top: -70,
    right: -30,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: theme.isDark ? 'rgba(71, 138, 255, 0.16)' : 'rgba(24, 119, 201, 0.12)',
  },
  heroGlowSmall: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.isDark ? 'rgba(50, 211, 196, 0.10)' : 'rgba(23, 156, 150, 0.08)',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.blueDeep,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  heroPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  heroPillText: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '700' },
  heroKicker: { color: theme.colors.blue, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: theme.colors.textPrimary, fontSize: 25, fontWeight: '900', marginTop: 10, lineHeight: 30, maxWidth: 280 },
  heroText: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 300 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.lg },
  summaryCard: {
    width: '31.5%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    paddingVertical: 14,
    paddingHorizontal: 12,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  summaryLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  summaryValue: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '900' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: 17, fontWeight: '800' },
  sectionCaption: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  centered: { paddingVertical: 56, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 12 },
  stateCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xl,
    paddingLeft: theme.spacing.xl + 8,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    alignItems: 'center',
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  stateIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  stateTitle: { color: theme.colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  stateText: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retryBtn: {
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  retryText: { color: theme.colors.blue, fontWeight: '700' },
  notificationItem: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.lg + 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    ...theme.shadows.soft,
  },
  alertRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.borderRadius.lg,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  notifContent: { flex: 1 },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: 6,
  },
  notifTitle: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '800', flex: 1, lineHeight: 20 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: theme.borderRadius.pill, borderWidth: 1 },
  severityText: { fontSize: 11, fontWeight: '800' },
  notifSubtitle: { color: theme.colors.textSecondary, fontSize: 13, marginBottom: 8, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  notifTime: { color: theme.colors.textMuted, fontSize: 12, marginLeft: 6 },
});
