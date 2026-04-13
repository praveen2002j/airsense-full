import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { getDashboardData } from '../services/api';
import MetricCard from '../components/MetricCard';
import SectionHeader from '../components/SectionHeader';
import Icon from '@expo/vector-icons/Ionicons';
import Badge from '../components/Badge';

export default function HomeScreen({ navigation }) {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.blue} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.appName}>AirSense</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Icon name="notifications-outline" size={28} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Main Status Card */}
        <View style={styles.mainCard}>
          <Text style={styles.mainCardTitle}>Air Quality Status</Text>
          <View style={styles.mainCardRow}>
            <View>
              <Text style={styles.mainCardValue}>{data.metrics.co2.value ?? '—'}</Text>
              <Text style={styles.mainCardUnit}>CO₂ ppm</Text>
            </View>
            <Badge label={data.overview.status} status={data.overview.status} />
          </View>
        </View>

        {/* Live Readings */}
        <SectionHeader title="Live Readings" />
        <View style={styles.grid}>
          <View style={styles.row}>
            <MetricCard title="CO₂ Level" value={data.metrics.co2.value} unit={data.metrics.co2.unit} iconName={data.metrics.co2.icon} color={theme.colors.yellow} />
            <MetricCard title="Temperature" value={data.metrics.temperature.value} unit={data.metrics.temperature.unit} iconName={data.metrics.temperature.icon} color={theme.colors.blue} />
          </View>
          <View style={styles.row}>
            <MetricCard title="Humidity" value={data.metrics.humidity.value} unit={data.metrics.humidity.unit} iconName={data.metrics.humidity.icon} color={theme.colors.green} />
            <MetricCard title="Carbon Mon." value={data.metrics.co.value} unit={data.metrics.co.unit} iconName={data.metrics.co.icon} color={theme.colors.red} />
          </View>
        </View>

        {/* Additional Cards */}
        <SectionHeader title="System & Occupancy" />
        <View style={styles.grid}>
          <View style={styles.row}>
            <MetricCard title="System Health" value={data.overview.score} unit="%" iconName="hardware-chip-outline" color={theme.colors.purple} />
            <MetricCard title="Occupancy" value={data.occupancy.value ?? '—'} unit="people" iconName="people-outline" color={theme.colors.blue} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.red,
    fontSize: 16,
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: theme.colors.blue,
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginBottom: 4,
  },
  appName: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  mainCard: {
    backgroundColor: theme.colors.blue + '15',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.blue + '30',
  },
  mainCardTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  mainCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  mainCardValue: {
    color: theme.colors.textPrimary,
    fontSize: 42,
    fontWeight: '800',
  },
  mainCardUnit: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 4,
  },
  grid: {
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
