import { useEffect, useRef, useState } from 'react';
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
    return () => {
      isMounted = false;
      if (startedRef.current) {
        audioStream.stop();
        startedRef.current = false;
      }
    };
  }, []);

  return { chunk, permission, error };
} 