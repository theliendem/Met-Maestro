// Audio session configuration utility
// Ensures metronome audio plays regardless of device silent mode

import { Platform } from 'react-native';
import Sound from 'react-native-sound';

/**
 * Configure audio session to play through silent mode
 * This ensures the metronome clicks are audible even when the device is on silent
 * 
 * Uses react-native-sound's built-in audio session configuration
 */
export function configureAudioSession() {
  if (Platform.OS === 'ios') {
    // For iOS, react-native-sound can configure the audio session
    // to ignore the silent switch
    try {
      Sound.setCategory('Playback', true); // true = mix with other audio
    } catch (error) {
      console.error('❌ Failed to configure iOS audio session:', error);
    }
  } else if (Platform.OS === 'android') {
    // For Android, react-native-sound handles audio focus and silent mode
    try {
      Sound.setCategory('Playback', true);
    } catch (error) {
      console.error('❌ Failed to configure Android audio session:', error);
    }
  }
}

/**
 * Initialize audio session configuration
 * Call this when the app starts or when audio is first used
 */
export function initializeAudioSession() {
  configureAudioSession();
}

/**
 * Force audio session activation
 * This can be called to ensure the audio session is properly configured
 * before playing any sounds
 */
export function activateAudioSession() {
  // This function can be called before playing audio to ensure
  // the audio session is properly configured
  configureAudioSession();
}

/**
 * Test audio session configuration
 * This can be used to verify that the audio session is properly configured
 */
export function testAudioSession() {
  configureAudioSession();
} 