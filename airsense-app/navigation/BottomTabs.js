import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '../styles/theme';

import HomeScreen from '../screens/HomeScreen';
import SystemHealthScreen from '../screens/SystemHealthScreen';
import SmartInsightsScreen from '../screens/SmartInsightsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import MLAnalyticsScreen from '../screens/MLAnalyticsScreen';
import AlertsScreen from '../screens/AlertsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AlertHistoryScreen from '../screens/AlertHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  const { theme } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function AnalyticsStack() {
  const { theme } = useAppTheme();
  const stackScreenOptions = {
    headerStyle: { backgroundColor: theme.colors.backgroundAlt },
    headerTintColor: theme.colors.textPrimary,
    headerTitleStyle: { fontWeight: '800', fontSize: 17 },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    headerBackTitle: '',
    contentStyle: { backgroundColor: theme.colors.background },
    animation: 'none',
  };
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="SystemHealth" component={SystemHealthScreen} options={{ title: 'System Health' }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Data Analytics' }} />
      <Stack.Screen name="MLAnalytics" component={MLAnalyticsScreen} options={{ title: 'ML Analytics' }} />
      <Stack.Screen name="SmartInsights" component={SmartInsightsScreen} options={{ title: 'AI Insights' }} />
    </Stack.Navigator>
  );
}

function AlertsStack() {
  const { theme } = useAppTheme();
  const stackScreenOptions = {
    headerStyle: { backgroundColor: theme.colors.backgroundAlt },
    headerTintColor: theme.colors.textPrimary,
    headerTitleStyle: { fontWeight: '800', fontSize: 17 },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    headerBackTitle: '',
    contentStyle: { backgroundColor: theme.colors.background },
    animation: 'none',
  };
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="AlertsMain" component={AlertsScreen} options={{ title: 'Active Alerts' }} />
      <Stack.Screen name="AlertHistory" component={AlertHistoryScreen} options={{ title: 'Alert History' }} />
    </Stack.Navigator>
  );
}

export default function BottomTabs() {
  const { theme } = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12,
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.divider,
          borderTopWidth: 1,
          paddingBottom: 10,
          paddingTop: 10,
          height: 74,
          borderRadius: 24,
          ...theme.shadows.card,
        },
        tabBarActiveTintColor: theme.colors.blue,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          paddingBottom: 2,
        },
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'ellipse-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return (
            <Icon
              name={iconName}
              size={focused ? size + 1 : size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Analytics" component={AnalyticsStack} />
      <Tab.Screen name="Alerts" component={AlertsStack} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
