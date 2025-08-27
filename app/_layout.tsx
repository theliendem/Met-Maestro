import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { ThemeProvider as AppThemeProvider } from '@/theme/ThemeContext';
import { MD3DarkTheme, MD3LightTheme, PaperProvider, Portal } from 'react-native-paper';
import { PermissionInitializer } from '../components/PermissionInitializer';
import { SoundSystemProvider } from '../contexts/SoundSystemContext';
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

function RootLayout() {
  // Force dark mode for consistent UI
  const colorScheme = 'dark';
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Initialize audio session and keep screen awake when app starts
  useEffect(() => {
    initializeAudioSession();
    
    // Prevent screen from auto-dimming while app is open
    activateKeepAwakeAsync('Met Maestro App');
    
    // Cleanup function to deactivate keep awake when component unmounts
    return () => {
      deactivateKeepAwake('Met Maestro App');
    };
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SoundSystemProvider>
      <AppThemeProvider>
        <ThemeProvider value={DarkTheme}>
          <PaperProvider theme={paperDarkTheme}>
            <Portal.Host>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <PermissionInitializer>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                </PermissionInitializer>
              </GestureHandlerRootView>
            </Portal.Host>
          </PaperProvider>
        </ThemeProvider>
      </AppThemeProvider>
    </SoundSystemProvider>
  );
}

export default RootLayout;
