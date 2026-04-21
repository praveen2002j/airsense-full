import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../styles/theme';
import { getSystemHealth } from '../services/api';
import SectionHeader from '../components/SectionHeader';
import SensorStatusItem from '../components/SensorStatusItem';
import Badge from '../components/Badge';

export default function SystemHealthScreen({ navigation }) {
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

  const onRefresh = () => { setRefreshing(true); fetchData(); };

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
      {/* Health Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>{data.healthScore}<Text style={styles.scoreUnit}>%</Text></Text>
        </View>
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreTitle}>System Health</Text>
          <Badge label={data.status} status={data.status} />
        </View>
      </View>

      {/* Sensor Status */}
      <SectionHeader title="Sensors" actionTitle="Analytics >" onActionPress={() => navigation.navigate('Analytics')} />
      <View style={styles.card}>
        {data.sensors.map((sensor) => (
          <View key={sensor.id}>
            <SensorStatusItem name={sensor.name} status={sensor.status} />
          </View>
        ))}
      </View>

      {/* Connectivity */}
      <SectionHeader title="Connectivity" />
      <View style={styles.card}>
        {data.connectivity.map((conn, index) => (
          <View key={conn.id} style={[styles.connItem, index < data.connectivity.length - 1 && styles.borderBottom]}>
            <Text style={styles.connName}>{conn.name}</Text>
            <Text style={styles.connStatus}>{conn.status}</Text>
          </View>
        ))}
      </View>

      {/* Statistics */}
      <SectionHeader title="Statistics" />
      <View style={styles.statsGrid}>
        <View style={styles.statsCard}><Text style={styles.statsLabel}>Uptime</Text><Text style={styles.statsVal}>{data.statistics.uptime}</Text></View>
        <View style={styles.statsCard}><Text style={styles.statsLabel}>Data Points</Text><Text style={styles.statsVal}>{data.statistics.dataPoints}</Text></View>
        <View style={styles.statsCard}><Text style={styles.statsLabel}>Latency</Text><Text style={styles.statsVal}>{data.statistics.latency}</Text></View>
        <View style={styles.statsCard}><Text style={styles.statsLabel}>Errors</Text><Text style={styles.statsVal}>{data.statistics.errors}</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  scoreCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: theme.colors.green,
    justifyContent: 'center', alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  scoreValue: { fontSize: 28, fontWeight: '800', color: theme.colors.textPrimary },
  scoreUnit: { fontSize: 16, color: theme.colors.textSecondary },
  scoreInfo: { flex: 1 },
  scoreTitle: { fontSize: 18, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: '600' },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  connItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.md },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
  connName: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '500' },
  connStatus: { color: theme.colors.textSecondary, fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    width: '48%', padding: theme.spacing.md, marginBottom: theme.spacing.sm,
  },
  statsLabel: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 8 },
  statsVal: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '700' },
});
