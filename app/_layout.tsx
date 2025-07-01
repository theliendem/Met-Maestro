import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MD3DarkTheme, MD3LightTheme, PaperProvider, Portal } from 'react-native-paper';

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
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PaperProvider theme={colorScheme === 'dark' ? paperDarkTheme : paperLightTheme}>
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
