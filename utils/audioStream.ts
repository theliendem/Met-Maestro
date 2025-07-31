// Audio stream utility for react-native-live-audio-stream
// Exports: start(onData), stop(), requestMicPermission, isMicPermissionGranted
// TODO: Implement stream config and PCM event handling.

import { Buffer } from 'buffer';
import { PermissionsAndroid, Platform } from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';

let dataSubscription: any = null;

// Fallback permission functions that don't rely on react-native-permissions
export async function requestMicPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      // For iOS, we'll rely on the expo-audio plugin which handles permissions
      console.log('iOS microphone permission handled by expo-audio plugin');
      return true;
    } else if (Platform.OS === 'android') {
      console.log('Requesting Android microphone permission...');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Met Maestro needs microphone access to detect pitch for the tuner feature.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      console.log('Android permission request result:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      console.warn('Platform not supported for microphone permissions');
      return false;
    }
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
}

export async function isMicPermissionGranted(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      // For iOS, assume permission is granted if we can start the audio stream
      console.log('iOS microphone permission check - assuming granted');
      return true;
    } else if (Platform.OS === 'android') {
      console.log('Checking Android microphone permission...');
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      console.log('Android permission check result:', granted);
      return granted;
    } else {
      console.warn('Platform not supported for microphone permissions');
      return false;
    }
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return false;
  }
}

export function start(onData: (pcm: Int16Array) => void) {
  try {
    console.log('Starting audio stream...');
    
    // Configure the recorder
    LiveAudioStream.init({
      sampleRate: 16000, // 16 kHz
      channels: 1,      // mono
      bitsPerSample: 16, // 16-bit PCM
      bufferSize: 2048, // ~128 ms at 16kHz
      wavFile: '', // required by type, but not used for streaming
    });

    // Remove any previous subscription
    if (dataSubscription) {
      dataSubscription.remove();
      dataSubscription = null;
    }

    // Subscribe to PCM data events
    dataSubscription = LiveAudioStream.on('data', (data: string) => {
      // data is base64-encoded PCM
      const buffer = Buffer.from(data, 'base64');
      // Convert to Int16Array
      const pcm = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
      onData(pcm);
    });
    
    LiveAudioStream.start();
    console.log('Audio stream started successfully');
  } catch (error) {
    console.error('Error starting audio stream:', error);
    throw error;
  }
}

export function stop() {
  try {
    console.log('Stopping audio stream...');
    LiveAudioStream.stop();
    if (dataSubscription) {
      dataSubscription.remove();
      dataSubscription = null;
    }
    console.log('Audio stream stopped successfully');
  } catch (error) {
    console.error('Error stopping audio stream:', error);
  }
} 