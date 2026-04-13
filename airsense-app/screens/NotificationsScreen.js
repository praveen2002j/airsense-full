import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { getActiveAlerts } from '../services/api';
import Icon from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen({ navigation }) {
  const alerts = getActiveAlerts();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{width: 28}} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Today</Text>
        {alerts.map(item => (
          <View key={item.id} style={styles.notificationItem}>
            <View style={styles.notifIcon}>
              <Icon name="warning" size={20} color={item.severity === 'Critical' ? theme.colors.red : theme.colors.yellow} />
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>{item.title} - {item.room}</Text>
              <Text style={styles.notifTime}>{item.time}</Text>
            </View>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionTextSec}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  backBtn: {
    padding: 4,
  },
  content: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  notifIcon: {
    marginRight: theme.spacing.md,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  notifTime: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  actionBtn: {
    marginLeft: theme.spacing.sm,
    padding: 8,
  },
  actionText: {
    color: theme.colors.blue,
    fontWeight: '600',
  },
  actionTextSec: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});
