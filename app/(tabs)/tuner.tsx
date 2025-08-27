// Tuner screen UI using React Native components
import { SettingsModal } from '@/components/SettingsModal';
import { SettingsPage } from '@/components/SettingsPage';
import { ThemedView } from '@/components/ThemedView';
import { TunerDisplay } from '@/components/tuner/TunerDisplay';
import { useSoundSystem } from '@/contexts/SoundSystemContext';
import { useAppTheme } from '@/theme/AppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';

import { isMicPermissionGranted, requestMicPermission } from '../../utils/audioStream';

// Debug mode - set to true to enable detailed logging
const DEBUG_MODE = false;

function TunerScreen() {
  const { soundSystemRef, setCurrentMode } = useSoundSystem();
  const themeColors = useAppTheme().colors;

  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [checking, setChecking] = useState(true);
  const [requestedOnce, setRequestedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [currentSound, setCurrentSound] = useState('synth');

  // Tuner state
  const [note, setNote] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [cents, setCents] = useState<number | null>(null);
  const [referencePitch, setReferencePitch] = useState(440);
  
  // Debug logging function
  const debugLog = (message: string, ...args: any[]) => {
    if (DEBUG_MODE) {
      console.log(`[TUNER DEBUG] ${message}`, ...args);
    }
  };
  
  // Set mode when component mounts and handle focus/blur
  useFocusEffect(
    React.useCallback(() => {
      debugLog('Tuner screen focused');
      setCurrentMode('tuner');

      // Start tuner if permission is granted
      if (permission === 'granted' && soundSystemRef.current) {
        soundSystemRef.current.startTuner(referencePitch);
      }

      return () => {
        debugLog('Navigating away from tuner screen - stopping tuner');
        if (soundSystemRef.current) {
          soundSystemRef.current.stopTuner();
        }
      };
    }, [setCurrentMode, soundSystemRef, permission, referencePitch])
  );

  // Initial permission check
  useEffect(() => {
    const checkInitialPermission = async () => {
      debugLog('Checking initial permission...');
      setChecking(true);
      setError(null);
      try {
        const granted = await isMicPermissionGranted();
        debugLog('Initial permission check result:', granted);
        setPermission(granted ? 'granted' : 'denied');
      } catch (err) {
        console.error('Error checking initial permission:', err);
        setError('Failed to check microphone permission');
        setPermission('denied');
      }
      setChecking(false);
    };
    
    checkInitialPermission();
    loadSoundType();
  }, []);

  // Periodically check permission status when denied to catch when user grants access
  useEffect(() => {
    if (permission === 'denied' && !checking) {
      debugLog('Starting periodic permission check...');
      const interval = setInterval(async () => {
        try {
          const granted = await isMicPermissionGranted();
          debugLog('Periodic permission check result:', granted);
          if (granted) {
            debugLog('Permission granted during periodic check');
            setPermission('granted');
            setError(null);
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Error in permission check interval:', err);
        }
      }, 2000); // Check every 2 seconds

      return () => {
        debugLog('Clearing periodic permission check');
        clearInterval(interval);
      };
    }
  }, [permission, checking]);

  const handleRequestPermission = async () => {
    debugLog('Handling permission request...');
    setChecking(true);
    setError(null);
    try {
      const granted = await requestMicPermission();
      debugLog('Permission request result:', granted);

      if (granted) {
        // Add a small delay and re-check to ensure the permission state is properly updated
        debugLog('Permission granted, re-checking...');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Re-check the permission to ensure it's actually granted
        const confirmedGranted = await isMicPermissionGranted();
        debugLog('Permission confirmation result:', confirmedGranted);

        setPermission(confirmedGranted ? 'granted' : 'denied');
        if (!confirmedGranted) {
          setError('Permission was not properly granted. Please try again.');
        } else {
          // Start tuner when permission is granted
          if (soundSystemRef.current) {
            soundSystemRef.current.startTuner(referencePitch);
          }
        }
      } else {
        setPermission('denied');
        setError('Permission denied. Please enable microphone access in settings.');
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Failed to request microphone permission. Please try again.');
      setPermission('denied');
    }

    setRequestedOnce(true);
    setChecking(false);
  };

  const openSettings = () => {
    setSettingsVisible(true);
  };

  const closeSettings = () => {
    setSettingsVisible(false);
  };

  const loadSoundType = async () => {
    try {
      const savedSound = await AsyncStorage.getItem('metMaestro_soundType');
      if (savedSound) {
        setCurrentSound(savedSound);
        console.log('Loaded sound type:', savedSound);
      }
    } catch (error) {
      console.error('Error loading sound type:', error);
    }
  };

  const handleSoundChange = async (soundType: string) => {
    try {
      await AsyncStorage.setItem('metMaestro_soundType', soundType);
      setCurrentSound(soundType);
      console.log('Saved sound type:', soundType);

      // Update SoundSystem sound dynamically
      if (soundSystemRef.current) {
        soundSystemRef.current.updateSound(soundType);
      }
    } catch (error) {
      console.error('Error saving sound type:', error);
      // Still update the state even if saving fails
      setCurrentSound(soundType);

      // Update SoundSystem sound even if saving failed
      if (soundSystemRef.current) {
        soundSystemRef.current.updateSound(soundType);
      }
    }
  };

  // Tuner control handlers
  const handleReferencePitchChange = (newPitch: number) => {
    setReferencePitch(newPitch);
    if (permission === 'granted' && soundSystemRef.current) {
      soundSystemRef.current.updateTunerSettings({ referencePitch: newPitch });
    }
  };

  const handleOpenSettings = () => {
    setSettingsVisible(true);
  };

  const refreshPermission = async () => {
    debugLog('Refreshing permission status...');
    setChecking(true);
    setError(null);
    try {
      const granted = await isMicPermissionGranted();
      debugLog('Refresh permission result:', granted);
      setPermission(granted ? 'granted' : 'denied');
    } catch (err) {
      console.error('Error refreshing permission:', err);
      setError('Failed to check microphone permission');
      setPermission('denied');
    }
    setChecking(false);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <TunerDisplay
        note={note}
        frequency={frequency}
        cents={cents}
        referencePitch={referencePitch}
        permissionStatus={checking ? 'unknown' : permission}
        onRequestPermission={handleRequestPermission}
        onReferencePitchChange={handleReferencePitchChange}
        onOpenSettings={handleOpenSettings}
      />
      <SettingsModal visible={settingsVisible} onClose={closeSettings}>
        <SettingsPage
          onClose={closeSettings}
          currentSound={currentSound}
          onSoundChange={handleSoundChange}
        />
      </SettingsModal>
    </ThemedView>
  );
}

export default TunerScreen; 