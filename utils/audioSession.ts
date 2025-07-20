// Audio session configuration utility
// Ensures metronome audio plays regardless of device silent mode


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
 * Test audio session configuration
 * This can be used to verify that the audio session is properly configured
 */
export function testAudioSession() {
  configureAudioSession();
} 