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
  let perm;
  if (Platform.OS === 'ios') {
    perm = PERMISSIONS.IOS.MICROPHONE;
  } else if (Platform.OS === 'android') {
    perm = PERMISSIONS.ANDROID.RECORD_AUDIO;
  } else {
    return false;
  }
  const result = await request(perm);
  return result === RESULTS.GRANTED;
}

export async function isMicPermissionGranted(): Promise<boolean> {
  let perm;
  if (Platform.OS === 'ios') {
    perm = PERMISSIONS.IOS.MICROPHONE;
  } else if (Platform.OS === 'android') {
    perm = PERMISSIONS.ANDROID.RECORD_AUDIO;
  } else {
    return false;
  }
  const result = await check(perm);
  return result === RESULTS.GRANTED;
}

export function start(onData: (pcm: Int16Array) => void) {
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
}

export function stop() {
  LiveAudioStream.stop();
  if (dataSubscription) {
    dataSubscription.remove();
    dataSubscription = null;
  }
} 