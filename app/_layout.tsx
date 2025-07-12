import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { MD3DarkTheme, MD3LightTheme, PaperProvider, Portal } from 'react-native-paper';
import { initializeAudioSession } from '../utils/audioSession';

const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: Colors.light.background,
    primary: Colors.light.tint,
    surface: Colors.light.background,
    onSurface: Colors.light.text,
    text: Colors.light.text,
  },
};

const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    background: Colors.dark.background,
    primary: Colors.dark.tint,
    surface: Colors.dark.background,
    onSurface: Colors.dark.text,
    text: Colors.dark.text,
  },
};

export default function RootLayout() {
  // Force dark mode for consistent UI
  const colorScheme = 'dark';
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Initialize audio session when app starts
  useEffect(() => {
    initializeAudioSession();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <PaperProvider theme={paperDarkTheme}>
        <Portal.Host>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </Portal.Host>
      </PaperProvider>
    </ThemeProvider>
  );
}
