import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from '@expo/vector-icons/Ionicons';
import { theme } from '../styles/theme';

// Import Screens
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
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function AnalyticsStack() {
  return (
    <Stack.Navigator screenOptions={{ 
      headerStyle: { backgroundColor: theme.colors.card },
      headerTintColor: theme.colors.textPrimary,
      headerTitleStyle: { fontWeight: '700' },
      headerShadowVisible: false,
    }}>
      <Stack.Screen name="SystemHealth" component={SystemHealthScreen} options={{ title: 'System Health' }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Data Analytics' }} />
      <Stack.Screen name="MLAnalytics" component={MLAnalyticsScreen} options={{ title: 'ML Analytics' }} />
      <Stack.Screen name="SmartInsights" component={SmartInsightsScreen} options={{ title: 'AI Insights' }} />
    </Stack.Navigator>
  );
}

function AlertsStack() {
  return (
    <Stack.Navigator screenOptions={{ 
      headerStyle: { backgroundColor: theme.colors.card },
      headerTintColor: theme.colors.textPrimary,
      headerTitleStyle: { fontWeight: '700' },
      headerShadowVisible: false,
    }}>
      <Stack.Screen name="AlertsMain" component={AlertsScreen} options={{ title: 'Active Alerts' }} />
      <Stack.Screen name="AlertHistory" component={AlertHistoryScreen} options={{ title: 'Alert History' }} />
    </Stack.Navigator>
  );
}

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.divider,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: theme.colors.blue,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
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
