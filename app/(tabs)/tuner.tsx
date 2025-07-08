// Tuner screen UI
// TODO: Implement tuner UI using useTuner hook

import { SettingsButton } from '@/components/SettingsButton';
import { SettingsModal } from '@/components/SettingsModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AppTheme } from '@/theme/AppTheme';
import { vh, vw } from '@/utils/responsive';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Linking, Platform, StyleSheet, View } from 'react-native';
import { useTuner } from '../../hooks/useTuner';
import { isMicPermissionGranted, requestMicPermission } from '../../utils/audioStream';

export default function TunerScreen() {
  // All hooks must be called before any return!
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [checking, setChecking] = useState(true);
  const [requestedOnce, setRequestedOnce] = useState(false);
  const needleAnim = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  // Track focus state
  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );
  const tuner = useTuner(isFocused);

  useEffect(() => {
    (async () => {
      setChecking(true);
      const granted = await isMicPermissionGranted();
      setPermission(granted ? 'granted' : 'denied');
      setChecking(false);
    })();
  }, []);

  // Animate needle
  useEffect(() => {
    let toValue = 0;
    if (tuner.cents !== null && tuner.cents !== undefined) {
      toValue = Math.max(-50, Math.min(50, tuner.cents));
    }
    Animated.timing(needleAnim, {
      toValue,
      duration: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tuner.cents]);

  const handleRequestPermission = async () => {
    setChecking(true);
    const granted = await requestMicPermission();
    setPermission(granted ? 'granted' : 'denied');
    setRequestedOnce(true);
    setChecking(false);
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // Only do conditional returns after all hooks
  if (checking) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" style={{ marginBottom: 16 }} />
        <ThemedText>Checking microphone permission…</ThemedText>
      </ThemedView>
    );
  }

  if (permission !== 'granted') {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <ThemedText type="title" style={{ marginBottom: 16 }}>Microphone Access Needed</ThemedText>
        <ThemedText style={{ textAlign: 'center', marginBottom: 24 }}>
          To use the tuner, Met Maestro needs access to your device's microphone to listen and detect pitch in real time.
        </ThemedText>
        {!requestedOnce ? (
          <ThemedText style={{ marginBottom: 16, color: '#e67c73' }}>
            Microphone access is currently denied or not granted.
          </ThemedText>
        ) : (
          <ThemedText style={{ marginBottom: 16, color: '#e67c73' }}>
            Permission denied. Please enable microphone access in your device settings.
          </ThemedText>
        )}
        {!requestedOnce ? (
          <ThemedText onPress={handleRequestPermission} style={{ color: '#0a7ea4', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }} accessibilityRole="button">
            Grant Microphone Access
          </ThemedText>
        ) : (
          <ThemedText onPress={openSettings} style={{ color: '#0a7ea4', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }} accessibilityRole="button">
            Open Settings
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  // --- Tuner UI ---
  const detected = tuner.note !== null && tuner.freq !== null && tuner.cents !== null && !tuner.error;
  const note = detected ? tuner.note : '—';
  const freq = detected && tuner.freq !== null ? `${tuner.freq.toFixed(1)} Hz` : '—';
  const cents = detected && tuner.cents !== null ? (tuner.cents > 0 ? `+${tuner.cents}` : `${tuner.cents}`) : '—';
  const isInTune = detected && Math.abs(tuner.cents ?? 999) <= 5;
  const needleColor = !detected ? '#888' : isInTune ? '#2196f3' : '#ff9800';

  return (
    <ThemedView style={styles.container}>
      {/* Settings gear */}
      <SettingsButton onPress={() => setSettingsVisible(true)} />
      {/* Settings Modal */}
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      {/* Central note label */}
      <View style={styles.noteContainer}>
        <ThemedText style={styles.noteLabel} numberOfLines={1} adjustsFontSizeToFit>{note}</ThemedText>
      </View>
      {/* Needle + cents */}
      <View style={styles.needleWrap}>
        <View style={styles.needleTrack} />
        <Animated.View
          style={[
            styles.needle,
            {
              backgroundColor: needleColor,
              transform: [
                { translateX: 100 },
                { rotate: needleAnim.interpolate({ inputRange: [-50, 50], outputRange: ['-50deg', '50deg'] }) },
                { translateX: -100 },
              ],
              opacity: detected ? 1 : 0.5,
            },
          ]}
        />
        <ThemedText style={[styles.cents, { color: needleColor }]}>{cents}¢</ThemedText>
      </View>
      {/* Frequency display */}
      <ThemedText style={styles.freqLabel}>{freq}</ThemedText>
      {/* Error display */}
      {tuner.error && <ThemedText style={{ color: '#e67c73', marginTop: 16 }}>{tuner.error}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: vw(6),
    backgroundColor: AppTheme.colors.background,
  },
  noteContainer: {
    marginTop: vh(6),
    marginBottom: vh(3),
    minHeight: vh(13),
    minWidth: vw(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteLabel: {
    fontSize: vh(9),
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: vh(11),
    minWidth: vw(30),
    minHeight: vh(12),
  },
  needleWrap: {
    width: vw(50),
    height: vh(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vh(2),
  },
  needleTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: vh(3.5),
    height: vh(0.5),
    borderRadius: 2,
    backgroundColor: '#333',
    opacity: 0.18,
  },
  needle: {
    position: 'absolute',
    left: 0,
    top: vh(1.5),
    width: vw(50),
    height: vh(1),
    borderRadius: 4,
    backgroundColor: '#2196f3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
  },
  cents: {
    marginTop: vh(4.5),
    fontSize: vh(3),
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  freqLabel: {
    marginTop: vh(1.5),
    fontSize: vh(2.5),
    color: '#888',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
}); 