import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as audioStream from '../utils/audioStream';

/**
 * useAudioStream React hook
 * - Requests microphone permission on mount
 * - Starts audio stream if granted, stops on unmount
 * - Exposes latest PCM chunk, permission status, and error
 *
 * Usage:
 *   const { chunk, permission, error } = useAudioStream();
 */
export function useAudioStream() {
  const [chunk, setChunk] = useState<Int16Array | null>(null);
  const [permission, setPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let isMounted = true;
    async function setup() {
      setPermission('pending');
      setError(null);
      try {
        const granted = await audioStream.requestMicPermission();
        if (!isMounted) return;
        if (granted) {
          setPermission('granted');
          startedRef.current = true;
          audioStream.start((pcm) => {
            if (isMounted) setChunk(pcm);
          });
        } else {
          setPermission('denied');
          setError('Microphone permission denied');
        }
      } catch (e) {
        setPermission('denied');
        setError('Error requesting microphone permission');
      }
    }
    setup();

    // AppState listener to stop/start stream when app backgrounded/foregrounded
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // App has come to the foreground – re-check permission and restart if needed
        const granted = await audioStream.isMicPermissionGranted();
        if (granted) {
          if (!startedRef.current) {
            audioStream.start((pcm) => {
              if (isMounted) setChunk(pcm);
            });
            startedRef.current = true;
          }
          setPermission('granted');
        } else {
          if (startedRef.current) {
            audioStream.stop();
            startedRef.current = false;
          }
          setPermission('denied');
          setError('Microphone permission denied');
        }
      } else if (nextState.match(/inactive|background/)) {
        // Going to background – stop stream to save battery
        if (startedRef.current) {
          audioStream.stop();
          startedRef.current = false;
        }
      }
      appStateRef.current = nextState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      isMounted = false;
      if (startedRef.current) {
        audioStream.stop();
        startedRef.current = false;
      }
      sub.remove();
    };
  }, []);

  return { chunk, permission, error };
} 