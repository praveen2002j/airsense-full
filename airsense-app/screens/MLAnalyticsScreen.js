import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import Svg, { Rect, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import Icon from '@expo/vector-icons/Ionicons';
import SectionHeader from '../components/SectionHeader';
import { useAppTheme } from '../styles/theme';
import { getMLInsights, getAnomalies, getMLMeta } from '../services/api';
import CardAccent from '../components/CardAccent';

const screenWidth = Dimensions.get('window').width;
const CHART_W = screenWidth - 48;
const CHART_H = 220;
const PAD = { top: 14, right: 10, bottom: 30, left: 40 };

export default function MLAnalyticsScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
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

  const hourly = meta?.hourlyPattern || [];
  const clusters = meta?.clusters || [];
  const correlations = meta?.correlations || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.blue} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>Machine learning workspace</Text>
        <Text style={styles.heroTitle}>Model-driven insight for deeper decision support</Text>
        <Text style={styles.heroText}>
          This view explains detected anomalies, behavior patterns, and correlations so the analytics story extends beyond descriptive dashboards.
        </Text>

        <View style={styles.summaryRow}>
          <SummaryStat label="Readings" value={meta?.readingsAnalyzed ?? 0} styles={styles} />
          <SummaryStat label="Anomalies" value={meta?.anomalyCount ?? 0} tone={theme.colors.red} styles={styles} />
          <SummaryStat label="Correlations" value={correlations.length} styles={styles} />
        </View>

        {meta?.lastRun ? (
          <Text style={styles.summarySub}>Last model run: {new Date(meta.lastRun).toLocaleString()}</Text>
        ) : null}
      </View>

      <SectionHeader title="Models used" subtitle="Transparent model framing helps make AI features understandable and defensible." />
      <View style={styles.modelCard}>
        <CardAccent color={theme.colors.purple} radius={theme.borderRadius.lg} />
        <ModelBadge icon="alert-circle-outline" name="Isolation Forest" purpose="Anomaly detection across sensor readings" color={theme.colors.red} styles={styles} />
        <ModelBadge icon="people-outline" name="K-Means (k=3)" purpose="Behavior clustering using time and CO2 patterns" color={theme.colors.purple} styles={styles} />
        <ModelBadge icon="git-compare-outline" name="Pearson correlation" purpose="Relationship strength between sensor variables" color={theme.colors.blue} styles={styles} />
        {meta?.training?.trainedAt ? (
          <Text style={styles.trainNote}>
            Trained {new Date(meta.training.trainedAt).toLocaleString()} on {meta.training.samples} samples
          </Text>
        ) : null}
      </View>

      <SectionHeader title="Model insights" subtitle="Short interpretations generated from the current analytical context." />
      {insights.length === 0 ? (
        <EmptyState icon="bulb-outline" title="No insights available" sub="Run the ML workflow to generate model-based insights." styles={styles} theme={theme} />
      ) : (
        insights.map((item) => (
          <View key={item.id} style={styles.insightCard}>
            <CardAccent color={theme.colors.blue} radius={theme.borderRadius.lg} />
            <View style={styles.insightHeader}>
              <View style={styles.insightIcon}>
                <Icon name={item.iconName || 'bulb-outline'} size={18} color={theme.colors.blue} />
              </View>
              <View style={styles.insightTextWrap}>
                <Text style={styles.insightTitle}>{item.title}</Text>
                {item.model ? <Text style={styles.insightModel}>{item.model}</Text> : null}
              </View>
            </View>
            <Text style={styles.insightDesc}>{item.description}</Text>
          </View>
        ))
      )}

      <SectionHeader title="Hourly CO2 pattern" subtitle="Shows how average CO2 changes over the course of the day." />
      <View style={styles.chartCard}>
        <CardAccent color={theme.colors.yellow} radius={theme.borderRadius.lg} />
        {hourly.length >= 2 ? (
          <HourlyBarChart data={hourly} theme={theme} />
        ) : (
          <EmptyState
            icon="bar-chart-outline"
            title="Insufficient data"
            sub={`Only ${hourly.length} hourly bucket${hourly.length === 1 ? '' : 's'} available right now.`}
            styles={styles}
            theme={theme}
          />
        )}
      </View>

      <SectionHeader title="Behavior clusters" subtitle="Cluster summaries highlight broad operating modes." />
      {clusters.length > 0 ? (
        <View style={styles.modelCard}>
          <CardAccent color={theme.colors.green} radius={theme.borderRadius.lg} />
          {clusters.map((c, i) => (
            <View key={i} style={styles.clusterRow}>
              <View style={[styles.clusterDot, {
                backgroundColor:
                  c.label === 'High' ? theme.colors.red :
                  c.label === 'Medium' ? theme.colors.yellow :
                  theme.colors.green,
              }]}
              />
              <View style={styles.clusterBody}>
                <Text style={styles.clusterLabel}>{c.label}</Text>
                <Text style={styles.clusterText}>{`Typical hour ${Math.round(c.hour)} • Avg CO2 ${Math.round(c.co2)} ppm • n=${c.n}`}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState icon="people-outline" title="Insufficient data" sub="More readings are needed for stable clustering output." styles={styles} theme={theme} />
      )}

      <SectionHeader title="Sensor correlations" subtitle="A quick view of variable relationships for analytical reasoning." />
      {correlations.length > 0 ? (
        <View style={styles.modelCard}>
          <CardAccent color={theme.colors.blue} radius={theme.borderRadius.lg} />
          {correlations.map((c, i) => {
            const abs = c.r != null ? Math.abs(c.r) : 0;
            const color = abs > 0.5 ? theme.colors.red : abs > 0.3 ? theme.colors.yellow : theme.colors.blue;
            return (
              <View key={i} style={styles.corrRow}>
                <Text style={styles.corrPair}>{`${c.x} ↔ ${c.y}`}</Text>
                <View style={styles.corrBarTrack}>
                  <View style={[styles.corrBarFill, { width: `${Math.min(abs * 100, 100)}%`, backgroundColor: color }]} />
                </View>
                <Text style={[styles.corrValue, { color }]}>
                  {c.r != null ? `${c.r >= 0 ? '+' : ''}${c.r.toFixed(2)}` : '—'}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <EmptyState icon="git-compare-outline" title="Insufficient data" sub="At least two readings are needed to compute correlations." styles={styles} theme={theme} />
      )}

      <SectionHeader title={`Detected anomalies (${anomalies.length})`} subtitle="Detected outliers are surfaced here for rapid review." />
      {anomalies.length === 0 ? (
        <EmptyState icon="checkmark-done-circle-outline" title="No anomalies detected" sub="The model has not flagged unusual readings in the selected dataset." styles={styles} theme={theme} />
      ) : (
        anomalies.slice(0, 20).map((a, i) => {
          const critical = a.score >= 0.7;
          const sevColor = critical ? theme.colors.red : theme.colors.yellow;
          const sevLabel = critical ? 'Critical' : 'Borderline';
          return (
            <View key={i} style={styles.anomalyCard}>
              <View style={[styles.anomalyRail, { backgroundColor: sevColor }]} />
              <View style={styles.anomalyHeader}>
                <View style={[styles.anomalyBadge, { backgroundColor: `${sevColor}18`, borderColor: `${sevColor}45` }]}>
                  <Text style={[styles.anomalyBadgeText, { color: sevColor }]}>{sevLabel}</Text>
                </View>
                <Text style={styles.anomalyScore}>{a.score?.toFixed(2)}</Text>
              </View>
              <Text style={styles.anomalyTime}>{new Date(a.timestamp).toLocaleString()}</Text>
              <Text style={styles.anomalyBody}>
                {`CO2 ${a.co2} ppm • CO ${a.co} • ${a.temperature}°C • ${a.humidity}% • ${a.occupancy} people`}
              </Text>
              {a.reason ? <Text style={styles.anomalyReason}>{`Why: ${a.reason}`}</Text> : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function SummaryStat({ label, value, tone, styles }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, tone ? { color: tone } : null]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ icon, title, sub, styles, theme }) {
  return (
    <View style={styles.emptyState}>
      <CardAccent color={theme.colors.textMuted} radius={theme.borderRadius.lg} />
      <Icon name={icon} size={32} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

function ModelBadge({ icon, name, purpose, color, styles }) {
  return (
    <View style={styles.modelRow}>
      <View style={[styles.modelIcon, { backgroundColor: `${color}18` }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <View style={styles.modelTextWrap}>
        <Text style={styles.modelName}>{name}</Text>
        <Text style={styles.modelPurpose}>{purpose}</Text>
      </View>
    </View>
  );
}

function HourlyBarChart({ data, theme }) {
  if (!data || data.length === 0) return null;
  const vals = data.map((d) => d.co2_avg);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const hi = max * 1.05;
  const lo = Math.max(0, min * 0.95);
  const barW = (CHART_W - PAD.left - PAD.right) / data.length - 2;
  const sy = (y) => PAD.top + (1 - (y - lo) / (hi - lo || 1)) * (CHART_H - PAD.top - PAD.bottom);
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
          <SvgLine x1={PAD.left} x2={CHART_W - PAD.right} y1={g.y} y2={g.y} stroke={theme.colors.divider} strokeWidth={0.7} />
          <SvgText x={PAD.left - 6} y={g.y + 3} fontSize={9} fill={theme.colors.textMuted} textAnchor="end">{g.val}</SvgText>
        </React.Fragment>
      ))}
      {data.map((d, i) => {
        const x = PAD.left + i * (barW + 2);
        const y = sy(d.co2_avg);
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={y} width={barW} height={baseY - y} fill={theme.colors.blue} rx={3} />
            {i % 3 === 0 ? (
              <SvgText x={x + barW / 2} y={CHART_H - 10} fontSize={8} fill={theme.colors.textMuted} textAnchor="middle">{`${d.hour}h`}</SvgText>
            ) : null}
          </React.Fragment>
        );
      })}
    </Svg>
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
    color: theme.colors.purple,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  summarySub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: theme.spacing.md, textAlign: 'center' },
  modelCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.md + 8,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  modelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  modelIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  modelTextWrap: { flex: 1 },
  modelName: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700' },
  modelPurpose: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 18 },
  trainNote: { color: theme.colors.textMuted, fontSize: 11, marginTop: 10 },
  insightCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.md + 8,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightTextWrap: { flex: 1 },
  insightTitle: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: 14 },
  insightModel: { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  insightDesc: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20, marginLeft: 48 },
  chartCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    paddingLeft: theme.spacing.sm + 8,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  clusterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  clusterDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  clusterBody: { flex: 1 },
  clusterLabel: { color: theme.colors.textPrimary, fontWeight: '700', fontSize: 13 },
  clusterText: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  corrRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  corrPair: { color: theme.colors.textPrimary, fontSize: 13, width: 138, fontWeight: '600' },
  corrBarTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: theme.colors.divider, marginHorizontal: 8, overflow: 'hidden' },
  corrBarFill: { height: '100%', borderRadius: 4 },
  corrValue: { fontSize: 13, fontWeight: '700', width: 54, textAlign: 'right' },
  anomalyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.lg + 4,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    position: 'relative',
    ...theme.shadows.soft,
  },
  anomalyRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.borderRadius.lg,
  },
  anomalyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  anomalyBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: theme.borderRadius.pill, borderWidth: 1 },
  anomalyBadgeText: { fontSize: 11, fontWeight: '800' },
  anomalyScore: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  anomalyTime: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '700' },
  anomalyBody: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 18 },
  anomalyReason: { color: theme.colors.textMuted, fontSize: 12, marginTop: 8, lineHeight: 18, fontStyle: 'italic' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    paddingLeft: theme.spacing.xl + 8,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: 'hidden',
  },
  emptyTitle: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 10 },
  emptySub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18 },
});
