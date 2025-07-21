import { ThemedView } from '@/components/ThemedView';
import WebViewMetronome from '@/components/WebViewMetronome';
import { useAudioPermission } from '@/hooks/useAudioPermission';
import { AppTheme } from '@/theme/AppTheme';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

const TEMPO_MIN = 40;
const TEMPO_MAX = 240;

export default function MetronomeScreen() {
  // Audio permission hook
  const { hasPermission, isRequesting, requestPermission } = useAudioPermission();

  // Request audio permission when needed (only once)
  useEffect(() => {
    if (!hasPermission && !isRequesting) {
      requestPermission();
    }
  }, [hasPermission]);

      return (
      <ThemedView style={styles.container}>
        <WebViewMetronome themeColors={AppTheme.colors} />
      </ThemedView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
}); 