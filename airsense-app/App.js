import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import BottomTabs from './navigation/BottomTabs';
import { theme } from './styles/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const customTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.blue,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.textPrimary,
      border: theme.colors.divider,
      notification: theme.colors.red,
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={customTheme}>
        <StatusBar style="light" />
        <BottomTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
