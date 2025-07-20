import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { isMicPermissionGranted, requestMicPermission } from '../utils/audioStream';

interface PermissionInitializerProps {
  children: React.ReactNode;
}

export function PermissionInitializer({ children }: PermissionInitializerProps) {
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);

  useEffect(() => {
    const initializePermissions = async () => {
      try {
        // Check if permission is already granted
        const granted = await isMicPermissionGranted();
        
        if (!granted) {
          // Show a friendly alert explaining why we need microphone access
          Alert.alert(
            'Microphone Access',
            'Met Maestro needs microphone access to provide the tuner feature. This allows the app to detect pitch in real-time.',
            [
              {
                text: 'Not Now',
                style: 'cancel',
                onPress: () => setHasCheckedPermissions(true),
              },
              {
                text: 'Allow Access',
                onPress: async () => {
                  const permissionGranted = await requestMicPermission();
                  if (!permissionGranted) {
                    Alert.alert(
                      'Permission Denied',
                      'Microphone access is required for the tuner feature. You can enable it later in your device settings.',
                      [
                        {
                          text: 'OK',
                          onPress: () => setHasCheckedPermissions(true),
                        },
                      ]
                    );
                  } else {
                    setHasCheckedPermissions(true);
                  }
                },
              },
            ]
          );
        } else {
          setHasCheckedPermissions(true);
        }
      } catch (error) {
        console.error('Error initializing permissions:', error);
        setHasCheckedPermissions(true);
      }
    };

    initializePermissions();
  }, []);

  // Show children immediately, permission handling will happen in background
  return <>{children}</>;
} 