import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import Svg, { Rect, Line as SvgLine, Text as SvgText, Circle } from 'react-native-svg';
import { theme } from '../styles/theme';
import SectionHeader from '../components/SectionHeader';
import Icon from '@expo/vector-icons/Ionicons';
import { getMLInsights, getAnomalies, getMLMeta } from '../services/api';

const screenWidth = Dimensions.get('window').width;
const CHART_W = screenWidth - 48;
const CHART_H = 200;
const PAD = { top: 10, right: 10, bottom: 28, left: 40 };

export default function MLAnalyticsScreen() {
  const [insights, setInsights] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ml, a, m] = await Promise.all([
        getMLInsights(),
        getAnomalies('all'),
        getMLMeta(),
      ]);
      setInsights(ml);
      setAnomalies(a);
      setMeta(m);
    } catch (err) {
      console.error('ML fetch error:', err.message);
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

  const hourly = meta?.hourlyPattern || [];
  const clusters = meta?.clusters || [];
  const correlations = meta?.correlations || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.blue} />}
    >
      {/* Header summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{meta?.readingsAnalyzed ?? 0}</Text>
            <Text style={styles.summaryLabel}>Readings</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.red }]}>{meta?.anomalyCount ?? 0}</Text>
            <Text style={styles.summaryLabel}>Anomalies</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{correlations.length}</Text>
            <Text style={styles.summaryLabel}>Correlations</Text>
          </View>
        </View>
        {meta?.lastRun && (
          <Text style={styles.summarySub}>
            Last run: {new Date(meta.lastRun).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Models used */}
      <SectionHeader title="ML Models" />
      <View style={styles.modelCard}>
        <ModelBadge icon="alert-circle-outline" name="Isolation Forest" purpose="Anomaly detection (n_estimators=200)" color={theme.colors.red} />
        <ModelBadge icon="people-outline" name="K-Means (k=3)" purpose="Usage clustering on hour + CO₂" color={theme.colors.purple} />
        <ModelBadge icon="git-compare-outline" name="Pearson r" purpose="Sensor correlation" color={theme.colors.blue} />
        {meta?.training?.trainedAt && (
          <Text style={styles.trainNote}>
            Models trained {new Date(meta.training.trainedAt).toLocaleString()} on {meta.training.samples} samples
          </Text>
        )}
      </View>

      {/* Insights */}
      <SectionHeader title="Model Insights" />
      {insights.length === 0 ? (
        <Text style={styles.emptyText}>Run the ML pipeline to generate insights.</Text>
      ) : (
        insights.map((item) => (
          <View key={item.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Icon name={item.iconName || 'bulb-outline'} size={20} color={theme.colors.blue} />
              <Text style={styles.insightTitle}>{item.title}</Text>
              {item.model && <Text style={styles.insightModel}>{item.model}</Text>}
            </View>
            <Text style={styles.insightDesc}>{item.description}</Text>
          </View>
        ))
      )}

      {/* Hourly pattern bar chart */}
      <SectionHeader title="Avg CO₂ by Hour (24h)" />
      <View style={styles.chartCard}>
        {hourly.length >= 2 ? (
          <HourlyBarChart data={hourly} />
        ) : (
          <EmptyState
            icon="bar-chart-outline"
            title="Insufficient data"
            sub={`Only ${hourly.length} hour bucket${hourly.length === 1 ? '' : 's'} available — need readings spanning more hours.`}
          />
        )}
      </View>

      {/* Clusters */}
      <SectionHeader title="Behavior Clusters (K-Means)" />
      {clusters.length > 0 ? (
        <View style={styles.modelCard}>
            {clusters.map((c, i) => (
              <View key={i} style={styles.clusterRow}>
                <View style={[styles.clusterDot, {
                  backgroundColor: c.label === 'High' ? theme.colors.red :
                                    c.label === 'Medium' ? theme.colors.yellow :
                                    theme.colors.green
                }]} />
                <Text style={styles.clusterLabel}>{c.label}</Text>
                <Text style={styles.clusterText}>hour ~{Math.round(c.hour)} • {Math.round(c.co2)} ppm • n={c.n}</Text>
              </View>
            ))}
          </View>
      ) : (
        <EmptyState icon="people-outline" title="Insufficient data" sub="Need more readings for the K-Means model to find clusters." />
      )}

      {/* Correlations */}
      <SectionHeader title="Sensor Correlations" />
      {correlations.length > 0 ? (
        <View style={styles.modelCard}>
            {correlations.map((c, i) => {
              const abs = c.r != null ? Math.abs(c.r) : 0;
              const color = abs > 0.5 ? theme.colors.red : abs > 0.3 ? theme.colors.yellow : theme.colors.blue;
              return (
                <View key={i} style={styles.corrRow}>
                  <Text style={styles.corrPair}>{c.x} ↔ {c.y}</Text>
                  <View style={styles.corrBarTrack}>
                    <View style={[styles.corrBarFill, { width: `${Math.min(abs * 100, 100)}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.corrValue, { color }]}>
                    {c.r != null ? (c.r >= 0 ? '+' : '') + c.r.toFixed(2) : '—'}
                  </Text>
                </View>
              );
            })}
          </View>
      ) : (
        <EmptyState icon="git-compare-outline" title="Insufficient data" sub="Need at least 2 readings to compute correlations." />
      )}

      {/* Anomalies list */}
      <SectionHeader title={`Detected Anomalies (${anomalies.length})`} />
      {anomalies.length === 0 ? (
        <Text style={styles.emptyText}>No anomalies detected.</Text>
      ) : (
        anomalies.slice(0, 20).map((a, i) => {
          const critical = a.score >= 0.7;
          const sevColor = critical ? theme.colors.red : theme.colors.yellow;
          const sevLabel = critical ? 'CRITICAL' : 'BORDERLINE';
          return (
            <View key={i} style={[styles.anomalyCard, { borderLeftColor: sevColor }]}>
              <View style={styles.anomalyHeader}>
                <Icon name="warning" size={14} color={sevColor} />
                <Text style={styles.anomalyTime}>{new Date(a.timestamp).toLocaleString()}</Text>
                <View style={[styles.sevBadge, { backgroundColor: sevColor + '25', borderColor: sevColor }]}>
                  <Text style={[styles.sevBadgeText, { color: sevColor }]}>{sevLabel}</Text>
                </View>
                <Text style={[styles.anomalyScore, { color: sevColor }]}>{a.score?.toFixed(2)}</Text>
              </View>
              <Text style={styles.anomalyBody}>
                CO₂ {a.co2} ppm • CO {a.co} • {a.temperature}°C • {a.humidity}% • {a.occupancy} people
              </Text>
              {a.reason && <Text style={styles.anomalyReason}>Why: {a.reason}</Text>}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <View style={styles.emptyState}>
      <Icon name={icon} size={32} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

function ModelBadge({ icon, name, purpose, color }) {
  return (
    <View style={styles.modelRow}>
      <View style={[styles.modelIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.modelName}>{name}</Text>
        <Text style={styles.modelPurpose}>{purpose}</Text>
      </View>
    </View>
  );
}

function HourlyBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const vals = data.map((d) => d.co2_avg);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const hi = max * 1.05;
  const lo = Math.max(0, min * 0.95);
  const barW = (CHART_W - PAD.left - PAD.right) / data.length - 2;
  const sy = (y) => PAD.top + (1 - (y - lo) / (hi - lo)) * (CHART_H - PAD.top - PAD.bottom);
  const baseY = CHART_H - PAD.bottom;

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = lo + ((hi - lo) * i) / yTicks;
    return { val: val.toFixed(0), y: sy(val) };
  });

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {gridLines.map((g, i) => (
        <React.Fragment key={`g${i}`}>
          <SvgLine x1={PAD.left} x2={CHART_W - PAD.right} y1={g.y} y2={g.y} stroke={theme.colors.divider} strokeWidth={0.5} />
          <SvgText x={PAD.left - 6} y={g.y + 3} fontSize={9} fill={theme.colors.textSecondary} textAnchor="end">{g.val}</SvgText>
        </React.Fragment>
      ))}
      {data.map((d, i) => {
        const x = PAD.left + i * (barW + 2);
        const y = sy(d.co2_avg);
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={y} width={barW} height={baseY - y} fill={theme.colors.blue} rx={2} />
            {i % 3 === 0 && (
              <SvgText x={x + barW / 2} y={CHART_H - 10} fontSize={8} fill={theme.colors.textSecondary} textAnchor="middle">{d.hour}h</SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: '800' },
  summaryLabel: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  summarySub: { color: theme.colors.textSecondary, fontSize: 11, marginTop: theme.spacing.sm, textAlign: 'center' },
  modelCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  modelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  modelIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  modelName: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '600' },
  modelPurpose: { color: theme.colors.textSecondary, fontSize: 12 },
  trainNote: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 8, fontStyle: 'italic' },
  insightCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  insightTitle: { color: theme.colors.textPrimary, fontWeight: '700', fontSize: 14, marginLeft: 8, flex: 1 },
  insightModel: { color: theme.colors.textSecondary, fontSize: 10, fontStyle: 'italic' },
  insightDesc: { color: theme.colors.textSecondary, fontSize: 13, marginLeft: 28 },
  chartCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  clusterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  clusterDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  clusterLabel: { color: theme.colors.textPrimary, fontWeight: '600', fontSize: 13, width: 70 },
  clusterText: { color: theme.colors.textSecondary, fontSize: 12 },
  corrRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  corrPair: { color: theme.colors.textPrimary, fontSize: 13, width: 140 },
  corrBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.colors.divider, marginHorizontal: 8, overflow: 'hidden' },
  corrBarFill: { height: '100%', borderRadius: 3 },
  corrValue: { fontSize: 13, fontWeight: '600', width: 52, textAlign: 'right' },
  sevBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, marginRight: 6 },
  sevBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  anomalyCard: {
    backgroundColor: theme.colors.card,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.red,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  anomalyHeader: { flexDirection: 'row', alignItems: 'center' },
  anomalyTime: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '600', marginLeft: 6, flex: 1 },
  anomalyScore: { color: theme.colors.red, fontSize: 11 },
  anomalyBody: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  anomalyReason: { color: theme.colors.yellow, fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  emptyText: { color: theme.colors.textSecondary, padding: theme.spacing.md, fontSize: 13, textAlign: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.sm },
  emptyTitle: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 8 },
  emptySub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center' },
});
