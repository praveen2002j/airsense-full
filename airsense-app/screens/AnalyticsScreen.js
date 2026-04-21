import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
  TouchableOpacity, Dimensions, Linking, Platform,
} from 'react-native';
import { theme } from '../styles/theme';
import SectionHeader from '../components/SectionHeader';
import Icon from '@expo/vector-icons/Ionicons';
import Svg, { Polyline, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import {
  getAnalyticsSummary, getAnalyticsTimeseries, getAnalyticsCorrelation,
  getAnalyticsExportUrl, getAnalyticsPdfUrl, getAnomalies,
} from '../services/api';

const RANGES = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
];

const METRIC_META = {
  co2: { title: 'CO₂', unit: 'ppm', color: theme.colors.yellow, icon: 'cloud-outline' },
  co: { title: 'CO', unit: 'ppm', color: theme.colors.red, icon: 'flame-outline' },
  temperature: { title: 'Temp', unit: '°C', color: theme.colors.blue, icon: 'thermometer-outline' },
  humidity: { title: 'Humidity', unit: '%', color: theme.colors.green, icon: 'water-outline' },
  occupancy: { title: 'Occupancy', unit: 'ppl', color: theme.colors.purple, icon: 'people-outline' },
};

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen({ navigation }) {
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

  const onRefresh = () => { setRefreshing(true); fetchData(); };

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
      scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
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
      {/* Range filter + Export */}
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
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.exportBtn} onPress={onExport}>
            <Icon name="document-text-outline" size={16} color={theme.colors.blue} />
            <Text style={styles.exportText}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { marginLeft: 6, backgroundColor: theme.colors.red + '20' }]} onPress={onExportPdf}>
            <Icon name="document-outline" size={16} color={theme.colors.red} />
            <Text style={[styles.exportText, { color: theme.colors.red }]}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.dataNote}>
        {summary?.count ?? 0} readings in {range}
      </Text>

      {/* KPI cards */}
      <SectionHeader title="Air Quality Overview" />
      <View style={styles.kpiGrid}>
        {['co2', 'co', 'temperature', 'humidity', 'occupancy'].map((key) => {
          const m = summary?.metrics?.[key];
          const meta = METRIC_META[key];
          return (
            <TouchableOpacity key={key} style={styles.kpiCard} activeOpacity={0.7} onPress={() => scrollToChart(key)}>
              <View style={[styles.kpiIcon, { backgroundColor: meta.color + '20' }]}>
                <Icon name={meta.icon} size={18} color={meta.color} />
              </View>
              <Text style={styles.kpiTitle}>{meta.title}</Text>
              <Text style={styles.kpiValue}>
                {m?.avg ?? '—'}
                <Text style={styles.kpiUnit}> {meta.unit}</Text>
              </Text>
              <Text style={styles.kpiRange}>
                {m?.min ?? '—'} – {m?.max ?? '—'}
              </Text>
              <Icon name="chevron-forward" size={14} color={theme.colors.textSecondary} style={styles.kpiChevron} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Line charts */}
      <SectionHeader title="CO₂ & CO Levels" />
      <View onLayout={onChartLayout('co2')}>
        <LineCard data={lineFor('co2')} anomalies={anomalyPointsFor('co2')} color={METRIC_META.co2.color} label="CO₂ (ppm)" />
      </View>
      <View onLayout={onChartLayout('co')}>
        <LineCard data={lineFor('co')} anomalies={anomalyPointsFor('co')} color={METRIC_META.co.color} label="CO (ppm)" />
      </View>

      <SectionHeader title="Temperature" />
      <View onLayout={onChartLayout('temperature')}>
        <LineCard data={lineFor('temperature')} anomalies={anomalyPointsFor('temperature')} color={METRIC_META.temperature.color} label="°C" />
      </View>

      <SectionHeader title="Humidity" />
      <View onLayout={onChartLayout('humidity')}>
        <LineCard data={lineFor('humidity')} anomalies={anomalyPointsFor('humidity')} color={METRIC_META.humidity.color} label="%" />
      </View>

      <SectionHeader title="Occupancy" />
      <View onLayout={onChartLayout('occupancy')}>
        <LineCard data={lineFor('occupancy')} anomalies={anomalyPointsFor('occupancy')} color={METRIC_META.occupancy.color} label="people" />
      </View>

      {/* Scatter / correlation */}
      <SectionHeader title="CO₂ vs Occupancy" />
      <View style={styles.chartCard}>
        <Text style={styles.corrText}>
          Pearson r = {corr?.pearson ?? '—'}  ({corr?.count ?? 0} points)
        </Text>
        <ScatterChart
          points={scatterPoints.map((p) => ({ x: p.y, y: p.x }))}
          color={theme.colors.blue}
          xLabel="Occupancy (people)"
          yLabel="CO₂ (ppm)"
        />
      </View>

      <TouchableOpacity
        style={styles.mlBtn}
        onPress={() => navigation.navigate('MLAnalytics')}
      >
        <Icon name="analytics-outline" size={18} color="#fff" />
        <Text style={styles.mlBtnText}>Open ML Analytics</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.insightsLink}
        onPress={() => navigation.navigate('SmartInsights')}
      >
        <Text style={styles.insightsText}>View AI Insights →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const CHART_W = screenWidth - 48;
const CHART_H = 200;
const PAD = { top: 10, right: 10, bottom: 28, left: 40 };

function LineCard({ data, color, label, anomalies = [] }) {
  if (!data || data.length < 2) {
    return (
      <View style={styles.chartCard}>
        <View style={styles.emptyState}>
          <Icon name="analytics-outline" size={32} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Insufficient data</Text>
          <Text style={styles.emptySub}>
            {data?.length === 1 ? '1 reading received — need at least 2 to plot a line.' : 'No readings in this range yet.'}
          </Text>
        </View>
      </View>
    );
  }
  const xs = data.map((d) => d.x.getTime());
  const ys = data.map((d) => d.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const yPad = (yMax - yMin) * 0.1 || 1;
  const yLo = yMin - yPad, yHi = yMax + yPad;

  const sx = (x) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * (CHART_W - PAD.left - PAD.right);
  const sy = (y) => PAD.top + (1 - (y - yLo) / (yHi - yLo)) * (CHART_H - PAD.top - PAD.bottom);

  const pts = data.map((d) => `${sx(d.x.getTime())},${sy(d.y)}`).join(' ');

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = yLo + ((yHi - yLo) * i) / yTicks;
    const y = sy(val);
    return { val: val.toFixed(0), y };
  });

  const xTickCount = 4;
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => {
    const t = xMin + ((xMax - xMin) * i) / xTickCount;
    const d = new Date(t);
    return { label: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}h`, x: sx(t) };
  });

  return (
    <View style={styles.chartCard}>
      <Svg width={CHART_W} height={CHART_H}>
        {gridLines.map((g, i) => (
          <React.Fragment key={`g${i}`}>
            <SvgLine x1={PAD.left} x2={CHART_W - PAD.right} y1={g.y} y2={g.y} stroke={theme.colors.divider} strokeWidth={1} />
            <SvgText x={PAD.left - 6} y={g.y + 3} fontSize={9} fill={theme.colors.textSecondary} textAnchor="end">{g.val}</SvgText>
          </React.Fragment>
        ))}
        {xTicks.map((t, i) => (
          <SvgText key={`x${i}`} x={t.x} y={CHART_H - 10} fontSize={9} fill={theme.colors.textSecondary} textAnchor="middle">{t.label}</SvgText>
        ))}
        <Polyline points={pts} fill="none" stroke={color} strokeWidth={2} />
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
                r={critical ? 5 : 3.5}
                fill={theme.colors.red}
                fillOpacity={critical ? 0.95 : 0.7}
                stroke="#fff"
                strokeWidth={1}
              />
            );
          })}
      </Svg>
      <Text style={styles.chartLabel}>
        {label}
        {anomalies.length > 0 && <Text style={{ color: theme.colors.red }}>  •  {anomalies.length} anomaly</Text>}
      </Text>
    </View>
  );
}

function ScatterChart({ points, color, xLabel, yLabel }) {
  if (!points || points.length < 2) {
    return (
      <View style={styles.emptyState}>
        <Icon name="scatter-chart-outline" size={32} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>Insufficient data</Text>
        <Text style={styles.emptySub}>Need at least 2 paired readings to compute correlation.</Text>
      </View>
    );
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xPad = (xMax - xMin) * 0.1 || 1;
  const yPad = (yMax - yMin) * 0.1 || 1;
  const xLo = xMin - xPad, xHi = xMax + xPad;
  const yLo = yMin - yPad, yHi = yMax + yPad;

  const sx = (x) => PAD.left + ((x - xLo) / (xHi - xLo)) * (CHART_W - PAD.left - PAD.right);
  const sy = (y) => PAD.top + (1 - (y - yLo) / (yHi - yLo)) * (CHART_H - PAD.top - PAD.bottom);

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H}>
        <SvgLine x1={PAD.left} x2={CHART_W - PAD.right} y1={CHART_H - PAD.bottom} y2={CHART_H - PAD.bottom} stroke={theme.colors.divider} />
        <SvgLine x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={CHART_H - PAD.bottom} stroke={theme.colors.divider} />
        {points.map((p, i) => (
          <Circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.5} fill={color} fillOpacity={0.6} />
        ))}
        <SvgText x={CHART_W / 2} y={CHART_H - 4} fontSize={9} fill={theme.colors.textSecondary} textAnchor="middle">{xLabel}</SvgText>
        <SvgText x={10} y={CHART_H / 2} fontSize={9} fill={theme.colors.textSecondary} textAnchor="middle" transform={`rotate(-90, 10, ${CHART_H / 2})`}>{yLabel}</SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  rangeGroup: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  rangeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.sm,
  },
  rangeBtnActive: { backgroundColor: theme.colors.blue },
  rangeText: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 13 },
  rangeTextActive: { color: '#fff' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.blue + '20',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
  },
  exportText: { color: theme.colors.blue, fontWeight: '600', marginLeft: 4, fontSize: 13 },
  dataNote: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    width: '48%',
    marginBottom: theme.spacing.sm,
  },
  kpiIcon: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  kpiTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  kpiValue: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '700', marginTop: 2 },
  kpiUnit: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '500' },
  kpiRange: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 },
  kpiChevron: { position: 'absolute', top: 10, right: 10 },
  chartCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  emptyText: { color: theme.colors.textSecondary, padding: theme.spacing.lg, fontSize: 13 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg, width: '100%' },
  emptyTitle: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 8 },
  emptySub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center' },
  chartLabel: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 4 },
  corrText: {
    color: theme.colors.textPrimary, fontSize: 13, fontWeight: '600',
    alignSelf: 'flex-start', paddingHorizontal: theme.spacing.sm, paddingTop: theme.spacing.sm,
  },
  insightsLink: {
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  insightsText: { color: theme.colors.blue, fontWeight: '600', fontSize: 14 },
  mlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.purple,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  mlBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 8 },
});
