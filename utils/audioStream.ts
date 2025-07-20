// Audio stream utility for react-native-live-audio-stream
// Exports: start(onData), stop(), requestMicPermission, isMicPermissionGranted
// TODO: Implement stream config and PCM event handling.

import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';
import {
    check,
    PERMISSIONS,
    request,
    RESULTS
} from 'react-native-permissions';

let dataSubscription: any = null;

export async function requestMicPermission(): Promise<boolean> {
  try {
    let perm;
    if (Platform.OS === 'ios') {
      perm = PERMISSIONS.IOS.MICROPHONE;
    } else if (Platform.OS === 'android') {
      perm = PERMISSIONS.ANDROID.RECORD_AUDIO;
    } else {
      console.warn('Platform not supported for microphone permissions');
      return false;
    }
    
    const result = await request(perm);
    console.log('Permission request result:', result);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
}

export async function isMicPermissionGranted(): Promise<boolean> {
  try {
    let perm;
    if (Platform.OS === 'ios') {
      perm = PERMISSIONS.IOS.MICROPHONE;
    } else if (Platform.OS === 'android') {
      perm = PERMISSIONS.ANDROID.RECORD_AUDIO;
    } else {
      console.warn('Platform not supported for microphone permissions');
      return false;
    }
    
    const result = await check(perm);
    console.log('Permission check result:', result);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return false;
  }
}

export function start(onData: (pcm: Int16Array) => void) {
  try {
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
  } catch (error) {
    console.error('Error starting audio stream:', error);
  }
}

export function stop() {
  try {
    LiveAudioStream.stop();
    if (dataSubscription) {
      dataSubscription.remove();
      dataSubscription = null;
    }
  } catch (error) {
    console.error('Error stopping audio stream:', error);
  }
} 