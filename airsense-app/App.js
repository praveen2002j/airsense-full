import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import BottomTabs from './navigation/BottomTabs';
import { AppThemeProvider, useAppTheme } from './styles/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatBot from './components/ChatBot';

function AppShell() {
  const { theme, isDark } = useAppTheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const customTheme = {
    ...baseTheme,
    dark: isDark,
    colors: {
      ...baseTheme.colors,
      primary: theme.colors.blue,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.textPrimary,
      border: theme.colors.divider,
      notification: theme.colors.red,
    },
  };

  return (
    <NavigationContainer theme={customTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.container}>
        <BottomTabs />
        <ChatBot />
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AppShell />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
