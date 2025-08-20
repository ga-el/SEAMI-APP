import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { createContext, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// Contexto global para el tema
export const ThemeContext = createContext({
  isDarkTheme: true,
  toggleTheme: () => {},
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Estado global del tema
  const [isDarkTheme, setIsDarkTheme] = useState(colorScheme === 'dark');
  const toggleTheme = () => setIsDarkTheme((prev) => !prev);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDarkTheme, toggleTheme }}>
      <ThemeProvider value={isDarkTheme ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard-teacher" options={{ headerShown: false }} />
          <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
          <Stack.Screen name="complete-profile-teacher" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="watch" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="ZEN" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
