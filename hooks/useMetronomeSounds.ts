// Custom hook for metronome sounds using expo-audio with silent mode bypass
// Ensures audio plays through silent mode

import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import Sound from 'react-native-sound';

export function useMetronomeSounds() {
  // Use expo-audio for sound playback
  const hiPlayer = useAudioPlayer(require('@/assets/sounds/click_hi.wav'));
  const loPlayer = useAudioPlayer(require('@/assets/sounds/click_lo.wav'));

  // Configure audio session to ignore silent mode
  useEffect(() => {
    console.log('🎵 Configuring metronome sounds with silent mode bypass...');
    
    // Configure audio session to ignore silent mode
    if (Platform.OS === 'ios') {
      Sound.setCategory('Playback', true);
      console.log('✅ iOS audio session configured to ignore silent mode');
    } else if (Platform.OS === 'android') {
      Sound.setCategory('Playback', true);
      console.log('✅ Android audio session configured to ignore silent mode');
    }
  }, []);

  // Play high click (downbeat)
  const playHiClick = useCallback(() => {
    try {
      hiPlayer.seekTo(0);
      setTimeout(() => hiPlayer.play(), 1);
      console.log('🔊 Played hi click (silent mode should be ignored)');
    } catch (error) {
      console.error('❌ Failed to play hi click:', error);
    }
  }, [hiPlayer]);

  // Play low click (offbeat)
  const playLoClick = useCallback(() => {
    try {
      loPlayer.seekTo(0);
      setTimeout(() => loPlayer.play(), 1);
      console.log('🔊 Played lo click (silent mode should be ignored)');
    } catch (error) {
      console.error('❌ Failed to play lo click:', error);
    }
  }, [loPlayer]);

  return {
    playHiClick,
    playLoClick,
  };
} 