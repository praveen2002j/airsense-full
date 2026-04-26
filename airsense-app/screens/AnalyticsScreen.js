import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
  TouchableOpacity, Dimensions, Linking, Platform,
} from 'react-native';
import { useAppTheme } from '../styles/theme';
import SectionHeader from '../components/SectionHeader';
import Icon from '@expo/vector-icons/Ionicons';
import Svg, { Polyline, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import CardAccent from '../components/CardAccent';
import {
  getAnalyticsSummary, getAnalyticsTimeseries, getAnalyticsCorrelation,
  getAnalyticsExportUrl, getAnalyticsPdfUrl, getAnomalies,
} from '../services/api';

const RANGES = [
  { key: '24h', label: '24 hours' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
];

const screenWidth = Dimensions.get('window').width;
const CHART_W = screenWidth - 48;
const CHART_H = 216;
const PAD = { top: 16, right: 12, bottom: 32, left: 42 };

export default function AnalyticsScreen({ navigation }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const METRIC_META = {
    co2: { title: 'CO2', unit: 'ppm', color: theme.colors.yellow, icon: 'cloud-outline' },
    co: { title: 'CO', unit: 'ppm', color: theme.colors.red, icon: 'flame-outline' },
    temperature: { title: 'Temp', unit: '°C', color: theme.colors.blue, icon: 'thermometer-outline' },
    humidity: { title: 'Humidity', unit: '%', color: theme.colors.green, icon: 'water-outline' },
    occupancy: { title: 'Occupancy', unit: 'ppl', color: theme.colors.purple, icon: 'people-outline' },
  };

  const [range, setRange] = useState('24h');
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [corr, setCorr] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollRef = useRef(null);
  const chartYs = useRef({});

  const fetchData = useCallback(async () => {
    try {
      const [s, ts, c, a] = await Promise.all([
        getAnalyticsSummary(range),
        getAnalyticsTimeseries(range, 60),
        getAnalyticsCorrelation('co2', 'occupancy', range),
        getAnomalies('all'),
      ]);
      setSummary(s);
      setSeries(ts);
      setCorr(c);
      setAnomalies(a || []);
    } catch (err) {
      console.error('Analytics fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const onExport = () => {
    const url = getAnalyticsExportUrl(range);
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url);
  };

  const onExportPdf = () => {
    const url = getAnalyticsPdfUrl(range);
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.blue} />
      </View>
    );
  }

  const lineFor = (metric) =>
    series
      .filter((d) => d[metric] != null)
      .map((d) => ({ x: new Date(d.t), y: d[metric] }));

  const anomalyPointsFor = (metric) =>
    anomalies
      .filter((a) => a[metric] != null && a.timestamp)
      .map((a) => ({ x: new Date(a.timestamp), y: a[metric], score: a.score }));

  const scrollToChart = (key) => {
    const y = chartYs.current[key];
    if (y != null && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 18), animated: true });
    }
  };

  const onChartLayout = (key) => (e) => {
    chartYs.current[key] = e.nativeEvent.layout.y;
  };

  const scatterPoints = (corr?.points || []).map((p) => ({ x: p.x, y: p.y }));

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.blue} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>Visual analytics dashboard</Text>
        <Text style={styles.heroTitle}>From raw readings to analytical reasoning</Text>
        <Text style={styles.heroText}>
          Explore trends, compare ranges, inspect anomalies, and move from monitoring to decision support without leaving the dashboard.
        </Text>

        <View style={styles.toolbar}>
          <View style={styles.rangeGroup}>
            {RANGES.map((r) => (
              <TouchableOpacity
                key={r.key}
                onPress={() => setRange(r.key)}
                style={[styles.rangeBtn, range === r.key && styles.rangeBtnActive]}
              >
                <Text style={[styles.rangeText, range === r.key && styles.rangeTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.exportBtn} onPress={onExport}>
              <Icon name="download-outline" size={16} color={theme.colors.blue} />
              <Text style={styles.exportText}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtnSecondary} onPress={onExportPdf}>
              <Icon name="document-text-outline" size={16} color={theme.colors.red} />
              <Text style={styles.exportTextSecondary}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.storyBand}>
          <Text style={styles.storyBandLabel}>Analytical coverage</Text>
          <Text style={styles.storyBandText}>{summary?.count ?? 0} readings available in {range}</Text>
        </View>
      </View>

      <SectionHeader
        title="Overview metrics"
        subtitle="Tap a KPI to jump to the related chart."
      />
      <View style={styles.kpiGrid}>
        {['co2', 'co', 'temperature', 'humidity', 'occupancy'].map((key) => {
          const m = summary?.metrics?.[key];
          const meta = METRIC_META[key];
          return (
            <TouchableOpacity key={key} style={styles.kpiCard} activeOpacity={0.82} onPress={() => scrollToChart(key)}>
              <CardAccent color={meta.color} radius={theme.borderRadius.lg} />
              <View style={styles.kpiTop}>
                <View style={[styles.kpiIcon, { backgroundColor: meta.color + '20' }]}>
                  <Icon name={meta.icon} size={18} color={meta.color} />
                </View>
                <Icon name="arrow-down-circle-outline" size={18} color={theme.colors.textMuted} />
              </View>
              <Text style={styles.kpiTitle}>{meta.title}</Text>
              <Text style={styles.kpiValue}>
                {m?.avg ?? '—'}
                <Text style={styles.kpiUnit}> {meta.unit}</Text>
              </Text>
              <Text style={styles.kpiRange}>Range: {m?.min ?? '—'} to {m?.max ?? '—'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionHeader
        title="Time-based analysis"
        subtitle="Coordinated views support trend reading, comparison, and anomaly spotting."
      />
      <View onLayout={onChartLayout('co2')}>
        <LineCard theme={theme} styles={styles} title="CO2 concentration" data={lineFor('co2')} anomalies={anomalyPointsFor('co2')} color={METRIC_META.co2.color} label="ppm" />
      </View>
      <View onLayout={onChartLayout('co')}>
        <LineCard theme={theme} styles={styles} title="Carbon monoxide" data={lineFor('co')} anomalies={anomalyPointsFor('co')} color={METRIC_META.co.color} label="ppm" />
      </View>
      <View onLayout={onChartLayout('temperature')}>
        <LineCard theme={theme} styles={styles} title="Temperature" data={lineFor('temperature')} anomalies={anomalyPointsFor('temperature')} color={METRIC_META.temperature.color} label="°C" />
      </View>
      <View onLayout={onChartLayout('humidity')}>
        <LineCard theme={theme} styles={styles} title="Humidity" data={lineFor('humidity')} anomalies={anomalyPointsFor('humidity')} color={METRIC_META.humidity.color} label="%" />
      </View>
      <View onLayout={onChartLayout('occupancy')}>
        <LineCard theme={theme} styles={styles} title="Occupancy" data={lineFor('occupancy')} anomalies={anomalyPointsFor('occupancy')} color={METRIC_META.occupancy.color} label="people" />
      </View>

      <SectionHeader
        title="Relationship analysis"
        subtitle="Brings together occupancy and CO2 to support causal exploration."
      />
      <View style={styles.chartCard}>
        <CardAccent color={theme.colors.blue} radius={theme.borderRadius.lg} />
        <Text style={styles.corrText}>
          Pearson r = {corr?.pearson ?? '—'} ({corr?.count ?? 0} paired points)
        </Text>
        <ScatterChart
          theme={theme}
          points={scatterPoints.map((p) => ({ x: p.y, y: p.x }))}
          color={theme.colors.blue}
          xLabel="Occupancy (people)"
          yLabel="CO2 (ppm)"
        />
      </View>

      <TouchableOpacity style={styles.mlBtn} onPress={() => navigation.navigate('MLAnalytics')}>
        <Icon name="analytics-outline" size={18} color={theme.colors.white} />
        <Text style={styles.mlBtnText}>Open ML analytics</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.insightsLink} onPress={() => navigation.navigate('SmartInsights')}>
        <Text style={styles.insightsText}>View AI insights</Text>
        <Icon name="arrow-forward" size={16} color={theme.colors.blue} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function LineCard({ theme, styles, title, data, color, label, anomalies = [] }) {
  if (!data || data.length < 2) {
    return (
      <View style={styles.chartCard}>
        <CardAccent color={color} radius={theme.borderRadius.lg} />
        <EmptyState
          theme={theme}
          styles={styles}
          icon="analytics-outline"
          title={title}
          sub={data?.length === 1 ? 'Only 1 reading is available. Add more data to visualize a trend.' : 'No readings are available in this time range yet.'}
        />
      </View>
    );
  }

  const xs = data.map((d) => d.x.getTime());
  const ys = data.map((d) => d.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const yPad = (yMax - yMin) * 0.1 || 1;
  const yLo = yMin - yPad;
  const yHi = yMax + yPad;

  const sx = (x) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * (CHART_W - PAD.left - PAD.right);
  const sy = (y) => PAD.top + (1 - (y - yLo) / (yHi - yLo)) * (CHART_H - PAD.top - PAD.bottom);
  const pts = data.map((d) => `${sx(d.x.getTime())},${sy(d.y)}`).join(' ');

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = yLo + ((yHi - yLo) * i) / yTicks;
    return { val: val.toFixed(0), y: sy(val) };
  });

  const xTickCount = 4;
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => {
    const t = xMin + ((xMax - xMin) * i) / xTickCount;
    const d = new Date(t);
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, x: sx(t) };
  });

  return (
    <View style={styles.chartCard}>
      <CardAccent color={color} radius={theme.borderRadius.lg} />
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartMeta}>
          {anomalies.length > 0 ? `${anomalies.length} anomaly markers` : 'Stable range view'}
        </Text>
      </View>
      <Svg width={CHART_W} height={CHART_H}>
        {gridLines.map((g, i) => (
          <React.Fragment key={`g${i}`}>
            <SvgLine x1={PAD.left} x2={CHART_W - PAD.right} y1={g.y} y2={g.y} stroke={theme.colors.divider} strokeWidth={1} />
            <SvgText x={PAD.left - 6} y={g.y + 3} fontSize={9} fill={theme.colors.textMuted} textAnchor="end">{g.val}</SvgText>
          </React.Fragment>
        ))}
        {xTicks.map((t, i) => (
          <SvgText key={`x${i}`} x={t.x} y={CHART_H - 10} fontSize={9} fill={theme.colors.textMuted} textAnchor="middle">{t.label}</SvgText>
        ))}
        <Polyline points={pts} fill="none" stroke={color} strokeWidth={3} />
        {anomalies
          .filter((a) => {
            const t = a.x.getTime();
            return t >= xMin && t <= xMax;
          })
          .map((a, i) => {
            const critical = a.score >= 0.7;
            return (
              <Circle
                key={`anom-${i}`}
                cx={sx(a.x.getTime())}
                cy={sy(a.y)}
                r={critical ? 5 : 4}
                fill={theme.colors.red}
                fillOpacity={critical ? 0.95 : 0.72}
                stroke={theme.colors.white}
                strokeWidth={1}
              />
            );
          })}
      </Svg>
      <Text style={styles.chartLabel}>{label}</Text>
    </View>
  );
}

function ScatterChart({ theme, points, color, xLabel, yLabel }) {
  if (!points || points.length < 2) {
    return (
      <EmptyState
        theme={theme}
        styles={createStyles(theme)}
        icon="git-compare-outline"
        title="Correlation view unavailable"
        sub="At least 2 paired readings are required to compute a relationship."
      />
    );
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xPad = (xMax - xMin) * 0.1 || 1;
  const yPad = (yMax - yMin) * 0.1 || 1;
  const xLo = xMin - xPad;
  const xHi = xMax + xPad;
  const yLo = yMin - yPad;
  const yHi = yMax + yPad;

  const sx = (x) => PAD.left + ((x - xLo) / (xHi - xLo)) * (CHART_W - PAD.left - PAD.right);
  const sy = (y) => PAD.top + (1 - (y - yLo) / (yHi - yLo)) * (CHART_H - PAD.top - PAD.bottom);

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H}>
        <SvgLine x1={PAD.left} x2={CHART_W - PAD.right} y1={CHART_H - PAD.bottom} y2={CHART_H - PAD.bottom} stroke={theme.colors.divider} />
        <SvgLine x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={CHART_H - PAD.bottom} stroke={theme.colors.divider} />
        {points.map((p, i) => (
          <Circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3} fill={color} fillOpacity={0.65} />
        ))}
        <SvgText x={CHART_W / 2} y={CHART_H - 6} fontSize={9} fill={theme.colors.textMuted} textAnchor="middle">{xLabel}</SvgText>
        <SvgText x={10} y={CHART_H / 2} fontSize={9} fill={theme.colors.textMuted} textAnchor="middle" transform={`rotate(-90, 10, ${CHART_H / 2})`}>{yLabel}</SvgText>
      </Svg>
    </View>
  );
}

function EmptyState({ theme, styles, icon, title, sub }) {
  return (
    <View style={styles.emptyState}>
      <Icon name={icon} size={30} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
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
  heroKicker: {
    color: theme.colors.cyan,
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
  toolbar: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  rangeGroup: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.pill,
    padding: 4,
    alignSelf: 'flex-start',
  },
  rangeBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.pill,
  },
  rangeBtnActive: { backgroundColor: theme.colors.blue },
  rangeText: { color: theme.colors.textSecondary, fontWeight: '700', fontSize: 12 },
  rangeTextActive: { color: theme.colors.white },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  exportBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  exportText: { color: theme.colors.blue, fontWeight: '700', marginLeft: 5, fontSize: 12 },
  exportTextSecondary: { color: theme.colors.red, fontWeight: '700', marginLeft: 5, fontSize: 12 },
  storyBand: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  storyBandLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  storyBandText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.md + 8,
    width: '48%',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  kpiValue: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 6 },
  kpiUnit: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' },
  kpiRange: { color: theme.colors.textMuted, fontSize: 11, marginTop: 6 },
  chartCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    paddingLeft: theme.spacing.sm + 8,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.soft,
    overflow: 'hidden',
  },
  chartHeader: {
    width: '100%',
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: 6,
  },
  chartTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  chartMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  chartLabel: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4, marginBottom: 8 },
  corrText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg, width: '100%' },
  emptyTitle: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 8 },
  emptySub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center', lineHeight: 18 },
  insightsLink: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  insightsText: { color: theme.colors.blue, fontWeight: '700', fontSize: 14 },
  mlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.purple,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.pill,
    marginTop: theme.spacing.md,
    ...theme.shadows.soft,
  },
  mlBtnText: { color: theme.colors.white, fontWeight: '800', fontSize: 14, marginLeft: 8 },
});
