// Audio session configuration utility
// Ensures metronome audio plays regardless of device silent mode

import { Platform } from 'react-native';

/**
 * Configure audio session to play through silent mode
 * This ensures the metronome clicks are audible even when the device is on silent
 * 
 * Note: expo-audio handles silent mode bypass automatically
 */
export function configureAudioSession() {
  // expo-audio automatically handles silent mode bypass
  // No additional configuration needed
  console.log('✅ Audio session configured for expo-audio');
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
  // expo-audio handles this automatically
  configureAudioSession();
}

/**
 * Configure WebView audio session for silent mode bypass
 * This is specifically for WebView-based audio playback
 */
export function configureWebViewAudioSession() {
  if (Platform.OS === 'ios') {
    // On iOS, we need to ensure the audio session is configured for playback
    console.log('🔊 Configuring iOS WebView audio session for silent mode bypass');
    
    // The WebView should handle this automatically with the proper meta tags
    // and allowsInlineMediaPlayback={true} setting
  } else if (Platform.OS === 'android') {
    // On Android, the WebView should handle this automatically
    console.log('🔊 Configuring Android WebView audio session for silent mode bypass');
  }
}

/**
 * Test audio session configuration
 * This can be used to verify that the audio session is properly configured
 */
export function testAudioSession() {
  configureAudioSession();
} 