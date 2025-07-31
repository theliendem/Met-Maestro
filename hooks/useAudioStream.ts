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
  const permissionCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Function to check permission and start stream if granted
  const checkPermissionAndStart = async () => {
    try {
      console.log('Checking permission and starting stream...');
      const granted = await audioStream.isMicPermissionGranted();
      
      if (granted) {
        console.log('Permission granted, starting audio stream...');
        setPermission('granted');
        setError(null);
        
        if (!startedRef.current) {
          audioStream.start((pcm) => {
            setChunk(pcm);
          });
          startedRef.current = true;
        }
      } else {
        console.log('Permission denied, stopping audio stream...');
        setPermission('denied');
        setError('Microphone permission denied');
        
        if (startedRef.current) {
          audioStream.stop();
          startedRef.current = false;
        }
      }
    } catch (e) {
      console.error('Error in checkPermissionAndStart:', e);
      setPermission('denied');
      setError('Error checking microphone permission');
      
      if (startedRef.current) {
        audioStream.stop();
        startedRef.current = false;
      }
    }
  };

  // Function to request permission
  const requestPermission = async () => {
    try {
      console.log('Requesting microphone permission...');
      setPermission('pending');
      setError(null);
      
      const granted = await audioStream.requestMicPermission();
      
      if (granted) {
        console.log('Permission granted, starting audio stream...');
        setPermission('granted');
        setError(null);
        
        if (!startedRef.current) {
          audioStream.start((pcm) => {
            setChunk(pcm);
          });
          startedRef.current = true;
        }
      } else {
        console.log('Permission denied');
        setPermission('denied');
        setError('Microphone permission denied');
      }
    } catch (e) {
      console.error('Error requesting permission:', e);
      setPermission('denied');
      setError('Error requesting microphone permission');
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Initial setup
    const setup = async () => {
      if (!isMounted) return;
      
      // First check if permission is already granted
      await checkPermissionAndStart();
      
      // If not granted, request permission
      if (isMounted && permission === 'denied') {
        await requestPermission();
      }
    };
    
    setup();

    // AppState listener to stop/start stream when app backgrounded/foregrounded
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      console.log('App state changed from', appStateRef.current, 'to', nextState);
      
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // App has come to the foreground – re-check permission and restart if needed
        console.log('App came to foreground, re-checking permission...');
        
        // Clear any existing timeout
        if (permissionCheckTimeoutRef.current) {
          clearTimeout(permissionCheckTimeoutRef.current);
          permissionCheckTimeoutRef.current = null;
        }
        
        // Add a small delay to ensure the app is fully active
        permissionCheckTimeoutRef.current = setTimeout(async () => {
          if (isMounted) {
            await checkPermissionAndStart();
          }
        }, 500);
        
      } else if (nextState.match(/inactive|background/)) {
        // Going to background – stop stream to save battery
        console.log('App going to background, stopping audio stream...');
        if (startedRef.current) {
          audioStream.stop();
          startedRef.current = false;
        }
      }
      appStateRef.current = nextState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      console.log('Cleaning up useAudioStream...');
      isMounted = false;
      
      // Clear any pending timeouts
      if (permissionCheckTimeoutRef.current) {
        clearTimeout(permissionCheckTimeoutRef.current);
        permissionCheckTimeoutRef.current = null;
      }
      
      // Stop audio stream
      if (startedRef.current) {
        audioStream.stop();
        startedRef.current = false;
      }
      
      sub.remove();
    };
  }, []);

  return { chunk, permission, error };
} 