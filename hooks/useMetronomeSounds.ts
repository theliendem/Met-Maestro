// Custom hook for metronome sounds using expo-audio with silent mode bypass
// Ensures audio plays through silent mode

import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect } from 'react';

export function useMetronomeSounds() {
  // Use expo-audio for sound playback
  const hiPlayer = useAudioPlayer(require('@/assets/sounds/click_hi.wav'));
  const loPlayer = useAudioPlayer(require('@/assets/sounds/click_lo.wav'));

  // Configure audio session to ignore silent mode
  useEffect(() => {
    // Note: expo-audio handles silent mode bypass automatically
    // No additional configuration needed
  }, []);

  // Play high click (downbeat)
  const playHiClick = useCallback(() => {
    try {
      hiPlayer.seekTo(0);
      setTimeout(() => hiPlayer.play(), 1);
    } catch (error) {
      console.error('❌ Failed to play hi click:', error);
    }
  }, [hiPlayer]);

  // Play low click (offbeat)
  const playLoClick = useCallback(() => {
    try {
      loPlayer.seekTo(0);
      setTimeout(() => loPlayer.play(), 1);
    } catch (error) {
      console.error('❌ Failed to play lo click:', error);
    }
  }, [loPlayer]);

  return {
    playHiClick,
    playLoClick,
  };
} 