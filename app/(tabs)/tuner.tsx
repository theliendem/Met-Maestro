// Tuner screen UI
// TODO: Implement tuner UI using useTuner hook

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
  const [lastDetectedNote, setLastDetectedNote] = useState<string | null>(null);
  const [lastDetectedCents, setLastDetectedCents] = useState<string | null>(null);
  const [lastDetectedFreq, setLastDetectedFreq] = useState<string | null>(null);
  const [showDash, setShowDash] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Animate needle (sharp/flat bar) with 5s hold logic
  useEffect(() => {
    let toValue = 0;
    if (!showDash) {
      // Use last detected or current detected value
      if (tuner.cents !== null && tuner.cents !== undefined) {
        toValue = Math.max(-30, Math.min(30, tuner.cents));
      } else if (lastDetectedCents) {
        // Parse the string value (e.g. '+5' or '-12')
        const parsed = parseInt(lastDetectedCents, 10);
        if (!isNaN(parsed)) toValue = Math.max(-30, Math.min(30, parsed));
      }
    }
    Animated.timing(needleAnim, {
      toValue,
      duration: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tuner.cents, showDash, lastDetectedCents, needleAnim]);

  // --- Tuner UI ---
  const detected = tuner.note !== null && tuner.freq !== null && tuner.cents !== null && !tuner.error;

  // Handle note label display logic
  useEffect(() => {
    if (detected && tuner.note) {
      setLastDetectedNote(tuner.note);
      setLastDetectedCents(tuner.cents !== null ? (tuner.cents > 0 ? `+${tuner.cents}` : `${tuner.cents}`) : null);
      setLastDetectedFreq(tuner.freq !== null ? `${tuner.freq.toFixed(1)} Hz` : null);
      setShowDash(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else if (lastDetectedNote) {
      // If we previously detected a note but now don't, start a 5s timer
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          setShowDash(true);
          timeoutRef.current = null;
        }, 5000);
      }
    } else {
      setShowDash(true);
    }
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [detected, tuner.note, tuner.cents, tuner.freq, lastDetectedNote]);

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
          To use the tuner, Met Maestro needs access to your device&apos;s microphone to listen and detect pitch in real time.
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

  // Derive display string with enharmonic (e.g. A♯ / B♭)
  let noteDisplay = '—';
  const enhMap: Record<string, string> = {
    'C#': 'D♭',
    'D#': 'E♭',
    'F#': 'G♭',
    'G#': 'A♭',
    'A#': 'B♭',
  };
  let noteToShow = null;
  if (!showDash && lastDetectedNote) {
    noteToShow = lastDetectedNote;
  } else if (detected && tuner.note) {
    noteToShow = tuner.note;
  }
  if (noteToShow) {
    const base = noteToShow.slice(0, -1).replace('♯', '#');
    const sharpDisplay = base.replace('#', '♯');
    const enh = enhMap[base];
    noteDisplay = enh ? `${sharpDisplay} / ${enh}` : sharpDisplay;
  }

  const isInTune = detected && Math.abs(tuner.cents ?? 999) <= 5;
  const needleColor = showDash ? '#888' : (isInTune ? AppTheme.colors.accent : '#ff9800');
  const noteLabelColor = showDash ? AppTheme.colors.text : (isInTune ? AppTheme.colors.accent : AppTheme.colors.text);
  const freq = (!showDash && lastDetectedFreq) ? lastDetectedFreq : (detected && tuner.freq !== null ? `${tuner.freq.toFixed(1)} Hz` : '—');
  const cents = (!showDash && lastDetectedCents) ? lastDetectedCents : (detected && tuner.cents !== null ? (tuner.cents > 0 ? `+${tuner.cents}` : `${tuner.cents}`) : '—');

  return (
    <ThemedView style={styles.container}>
      {/* Settings gear - hidden in tuner mode */}
      {/* <SettingsButton onPress={() => setSettingsVisible(true)} /> */}
      {/* Settings Modal */}
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />

      {/* Sharp / Flat bar & reference labels */}
      <View style={styles.barWrapper}>
        {/* Reference cent labels */}
        <ThemedText style={styles.refZero}>0¢</ThemedText>
        <ThemedText style={styles.refMinus}>-30¢</ThemedText>
        <ThemedText style={styles.refPlus}>+30¢</ThemedText>
        {/* Animated bar */}
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: needleColor,
              opacity: detected ? 1 : 0.5,
              transform: [
                // Move bar origin to bottom center, rotate, then move back
                { translateY: stylesConst.BAR_HEIGHT * 0.8 / 2 },
                { rotate: needleAnim.interpolate({ inputRange: [-30, 0, 30], outputRange: ['-90deg', '0deg', '90deg'] }) },
                { translateY: -stylesConst.BAR_HEIGHT * 0.8 / 2 },
              ],
            },
          ]}
        />
      </View>

      {/* Note, cents and frequency labels */}
      <ThemedText style={[styles.noteLabel, { color: noteLabelColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {noteDisplay}
      </ThemedText>
      <ThemedText style={[styles.centsLabel, { color: needleColor }]}>{cents}¢</ThemedText>
      <ThemedText style={styles.freqLabel}>{freq}</ThemedText>

      {/* Error display */}
      {tuner.error && <ThemedText style={{ color: '#e67c73', marginTop: 16 }}>{tuner.error}</ThemedText>}
    </ThemedView>
  );
}

// --- Constants for styling calculations ---
const stylesConst = {
  BAR_HEIGHT: vh(18), // shorter bar
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: vw(10),
    paddingVertical: vh(6),
    backgroundColor: AppTheme.colors.background,
  },
  // Wrapper for bar & reference labels
  barWrapper: {
    width: vw(80), // wider wrapper to allow more label spread
    height: stylesConst.BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: vh(7),
  },
  bar: {
    width: 12,
    height: stylesConst.BAR_HEIGHT * 0.8,
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
    // The bar will rotate about its bottom end using transformOrigin
  },
  refZero: {
    position: 'absolute',
    top: 0,
    fontSize: vh(2.5),
    color: '#9BA1A6',
    textAlign: 'center',
  },
  refMinus: {
    position: 'absolute',
    bottom: 0,
    left: vw(2), // push further out
    fontSize: vh(2),
    color: '#9BA1A6',
  },
  refPlus: {
    position: 'absolute',
    bottom: 0,
    right: vw(2), // push further out
    fontSize: vh(2),
    color: '#9BA1A6',
  },
  noteLabel: {
    fontSize: vh(8),
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textAlign: 'center',
    includeFontPadding: false,
    paddingTop: vh(6),
    marginBottom: vh(3),
  },
  centsLabel: {
    fontSize: vh(3),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: vh(2.5),
    letterSpacing: 1,
  },
  freqLabel: {
    fontSize: vh(2.5),
    color: '#888',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    marginBottom: vh(2),
  },
}); 