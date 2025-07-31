import { SettingsModal } from '@/components/SettingsModal';
import { SettingsPage } from '@/components/SettingsPage';
import { ThemedView } from '@/components/ThemedView';
import WebViewMetronome, { WebViewMetronomeRef } from '@/components/WebViewMetronome';
import { useAudioPermission } from '@/hooks/useAudioPermission';
import { useAppTheme } from '@/theme/AppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { configureWebViewAudioSession } from '../../utils/audioSession';

const TEMPO_MIN = 40;
const TEMPO_MAX = 240;

export default function MetronomeScreen() {
  // Audio permission hook
  const { hasPermission, isRequesting, requestPermission } = useAudioPermission();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [currentSound, setCurrentSound] = useState('synth');
  const themeColors = useAppTheme().colors;
  const webViewRef = useRef<WebViewMetronomeRef>(null);

  // Request audio permission when needed (only once)
  useEffect(() => {
    if (!hasPermission && !isRequesting) {
      requestPermission();
    }
  }, [hasPermission]);

  // Load sound type from storage on component mount
  useEffect(() => {
    loadSoundType();
  }, []);

  // Stop metronome when navigating away from this screen
  useFocusEffect(
    React.useCallback(() => {
      // This runs when the screen comes into focus
      console.log('Metronome screen focused - reinitializing audio');
      
      // Configure WebView audio session for silent mode bypass
      configureWebViewAudioSession();
      
      if (webViewRef.current) {
        // Add a small delay to ensure the WebView is ready
        setTimeout(() => {
          webViewRef.current?.reinitializeAudio();
        }, 100);
      }
      
      return () => {
        // This runs when the screen goes out of focus (navigating away)
        console.log('Navigating away from metronome screen - stopping metronome');
        
        // Stop the metronome using the ref
        if (webViewRef.current) {
          webViewRef.current.stopMetronome();
        }
      };
    }, [])
  );

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
    } catch (error) {
      console.error('Error saving sound type:', error);
      // Still update the state even if saving fails
      setCurrentSound(soundType);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <WebViewMetronome 
        ref={webViewRef}
        themeColors={themeColors} 
        onOpenSettings={openSettings}
        soundType={currentSound}
        onSoundChange={handleSoundChange}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 