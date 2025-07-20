import { Audio } from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

interface AudioPermissionState {
  hasPermission: boolean;
  isRequesting: boolean;
  error: string | null;
}

export const useAudioPermission = () => {
  const [permissionState, setPermissionState] = useState<AudioPermissionState>({
    hasPermission: false,
    isRequesting: false,
    error: null,
  });

  // Check current permission status
  const checkPermission = useCallback(async () => {
    try {
      setPermissionState(prev => ({ ...prev, isRequesting: true, error: null }));
      
      const { status } = await Audio.getPermissionsAsync();
      
      setPermissionState({
        hasPermission: status === 'granted',
        isRequesting: false,
        error: null,
      });
    } catch (error) {
      setPermissionState({
        hasPermission: false,
        isRequesting: false,
        error: 'Failed to check audio permission',
      });
    }
  }, []);

  // Request audio permission
  const requestPermission = useCallback(async () => {
    try {
      setPermissionState(prev => ({ ...prev, isRequesting: true, error: null }));
      
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionState({
          hasPermission: true,
          isRequesting: false,
          error: null,
        });
      } else {
        setPermissionState({
          hasPermission: false,
          isRequesting: false,
          error: 'Audio permission denied',
        });
        
        // Show alert to user about permission denial
        Alert.alert(
          'Audio Permission Required',
          'Met Maestro needs audio permission to play metronome sounds. Please enable audio permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              // On iOS, we can't directly open settings, but we can guide the user
              if (Platform.OS === 'ios') {
                Alert.alert(
                  'Enable Audio Permission',
                  'Please go to Settings > Privacy & Security > Microphone and enable permission for Met Maestro.',
                  [{ text: 'OK' }]
                );
              }
            }}
          ]
        );
      }
    } catch (error) {
      setPermissionState({
        hasPermission: false,
        isRequesting: false,
        error: 'Failed to request audio permission',
      });
    }
  }, []);

  // Initialize permission check on mount
  useEffect(() => {
    checkPermission();
  }, []);

  return {
    ...permissionState,
    checkPermission,
    requestPermission,
  };
}; 