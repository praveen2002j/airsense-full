import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../styles/theme';
import { getAlertHistory } from '../services/api';
import AlertCard from '../components/AlertCard';
import SectionHeader from '../components/SectionHeader';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';

export default function AlertHistoryScreen() {
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

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.blue} />
      </View>
    );
  }

  if (!data) return null;

  const formattedChartData = (data.chartData || []).map((d) => ({ x: d.day, y: d.alerts }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.blue} />}
    >
      <SectionHeader title="7-Day Summary" />
      <View style={styles.statsGrid}>
        <View style={styles.statsCard}><Text style={styles.statsLabel}>Total</Text><Text style={styles.statsVal}>{data.statistics.total}</Text></View>
        <View style={styles.statsCard}><Text style={styles.statsLabel}>Critical</Text><Text style={[styles.statsVal, { color: theme.colors.red }]}>{data.statistics.critical}</Text></View>
        <View style={styles.statsCard}><Text style={styles.statsLabel}>Warning</Text><Text style={[styles.statsVal, { color: theme.colors.yellow }]}>{data.statistics.warning}</Text></View>
        <View style={styles.statsCard}><Text style={styles.statsLabel}>Safe</Text><Text style={[styles.statsVal, { color: theme.colors.green }]}>{data.statistics.safe}</Text></View>
      </View>

      {formattedChartData.length > 0 && (
        <View style={styles.chartContainer}>
          <VictoryChart theme={VictoryTheme.material} height={250} padding={{ top: 20, bottom: 40, left: 40, right: 30 }}>
            <VictoryAxis style={{ tickLabels: { fill: theme.colors.textSecondary, fontSize: 12 }, axis: { stroke: theme.colors.divider } }} />
            <VictoryAxis dependentAxis style={{ tickLabels: { fill: theme.colors.textSecondary, fontSize: 12 }, axis: { stroke: 'transparent' }, grid: { stroke: theme.colors.divider } }} />
            <VictoryBar
              data={formattedChartData}
              style={{ data: { fill: theme.colors.blue, width: 20 } }}
              cornerRadius={{ top: 4 }}
            />
          </VictoryChart>
        </View>
      )}

      <SectionHeader title="Recent Alerts" />
      {(data.recent || []).map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  statsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    width: '23%', padding: theme.spacing.sm, alignItems: 'center',
  },
  statsLabel: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 4 },
  statsVal: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' },
  chartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: theme.spacing.md, marginBottom: theme.spacing.lg,
  },
});
