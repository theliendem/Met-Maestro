import { SettingsModal } from '@/components/SettingsModal';
import { SettingsPage } from '@/components/SettingsPage';
import { ThemedView } from '@/components/ThemedView';
import { MetronomeControls } from '@/components/metronome/MetronomeControls';
import { useSoundSystem } from '@/contexts/SoundSystemContext';
import { useAudioPermission } from '@/hooks/useAudioPermission';
import { useAppTheme } from '@/theme/AppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

export default function MetronomeScreen() {
  const { soundSystemRef, setCurrentMode } = useSoundSystem();
  const { hasPermission, isRequesting, requestPermission } = useAudioPermission();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const themeColors = useAppTheme().colors;

  // Metronome state
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState({ numerator: 4, denominator: 4 });
  const [soundType, setSoundType] = useState('synth');
  const [isPlaying, setIsPlaying] = useState(false);
  const [subdivision, setSubdivision] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(0);

  // Tap BPM state
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Request audio permission when needed (only once)
  useEffect(() => {
    if (!hasPermission && !isRequesting) {
      requestPermission();
    }
  }, [hasPermission]);

  // Load sound type and bpm from storage on component mount
  useEffect(() => {
    loadSoundType();
    loadBpm();
  }, []);

  // Set mode when component mounts and handle focus/blur
  useFocusEffect(
    React.useCallback(() => {
      console.log('Metronome screen focused');
      setCurrentMode('metronome');

      return () => {
        console.log('Navigating away from metronome screen - stopping metronome');
        if (soundSystemRef.current && isPlaying) {
          soundSystemRef.current.stopMetronome();
          setIsPlaying(false);
          setCurrentBeat(0);
        }
      };
    }, [setCurrentMode, soundSystemRef, isPlaying])
  );

  // Handle beat events from SoundSystem
  useEffect(() => {
    if (!soundSystemRef.current) return;

    // This would be implemented with the event system
    // For now, we'll simulate beat updates
    let beatInterval: NodeJS.Timeout | null = null;

    if (isPlaying) {
      const beatDuration = 60000 / (bpm * (4 / timeSignature.denominator));
      let beatCount = 0;

      beatInterval = setInterval(() => {
        beatCount = (beatCount % timeSignature.numerator) + 1;
        setCurrentBeat(beatCount);
      }, beatDuration);
    } else {
      setCurrentBeat(0);
    }

    return () => {
      if (beatInterval) {
        clearInterval(beatInterval);
      }
    };
  }, [isPlaying, bpm, timeSignature, soundSystemRef]);

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
        setSoundType(savedSound);
        console.log('Loaded sound type:', savedSound);
      }
    } catch (error) {
      console.error('Error loading sound type:', error);
    }
  };

  const loadBpm = async () => {
    try {
      const savedBpm = await AsyncStorage.getItem('metMaestro_bpm');
      if (savedBpm) {
        const bpmValue = parseInt(savedBpm, 10);
        if (bpmValue >= 40 && bpmValue <= 240) {
          setBpm(bpmValue);
          console.log('Loaded BPM:', bpmValue);
        }
      }
    } catch (error) {
      console.error('Error loading BPM:', error);
    }
  };

  const handleSoundChange = async (newSoundType: string) => {
    try {
      await AsyncStorage.setItem('metMaestro_soundType', newSoundType);
      setSoundType(newSoundType);
      console.log('Saved sound type:', newSoundType);

      // Update SoundSystem sound dynamically
      if (soundSystemRef.current) {
        soundSystemRef.current.updateSound(newSoundType);
      }
    } catch (error) {
      console.error('Error saving sound type:', error);
      // Still update the state even if saving fails
      setSoundType(newSoundType);

      // Update SoundSystem sound even if saving failed
      if (soundSystemRef.current) {
        soundSystemRef.current.updateSound(newSoundType);
      }
    }
  };

  const handleBpmChange = async (newBpm: number) => {
    try {
      await AsyncStorage.setItem('metMaestro_bpm', newBpm.toString());
      setBpm(newBpm);
      console.log('Saved BPM:', newBpm);

      if (isPlaying && soundSystemRef.current) {
        soundSystemRef.current.updateMetronomeSettings({
          bpm: newBpm,
          timeSignature,
          soundType,
          subdivision
        });
      }
    } catch (error) {
      console.error('Error saving BPM:', error);
      // Still update the state even if saving fails
      setBpm(newBpm);

      if (isPlaying && soundSystemRef.current) {
        soundSystemRef.current.updateMetronomeSettings({
          bpm: newBpm,
          timeSignature,
          soundType,
          subdivision
        });
      }
    }
  };

  const handleTimeSignatureChange = (newTimeSignature: { numerator: number; denominator: number }) => {
    setTimeSignature(newTimeSignature);
    if (isPlaying && soundSystemRef.current) {
      soundSystemRef.current.updateMetronomeSettings({
        bpm,
        timeSignature: newTimeSignature,
        soundType,
        subdivision
      });
    }
  };

  const handleSubdivisionChange = (newSubdivision: number) => {
    setSubdivision(newSubdivision);
    if (isPlaying && soundSystemRef.current) {
      soundSystemRef.current.updateMetronomeSettings({
        bpm,
        timeSignature,
        soundType,
        subdivision: newSubdivision
      });
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Stop metronome
      soundSystemRef.current?.stopMetronome();
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      // Start metronome
      soundSystemRef.current?.startMetronome(bpm, timeSignature, soundType);
      setIsPlaying(true);
    }
  };

  const handleTapBpm = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].filter(time => now - time < 5000); // Keep taps within 5 seconds

    setTapTimes(newTapTimes);

    if (newTapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }

      const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / averageInterval);

      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        handleBpmChange(calculatedBpm);
      }
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <MetronomeControls
        timeSignature={timeSignature}
        onTimeSignatureChange={handleTimeSignatureChange}
        bpm={bpm}
        onBpmChange={handleBpmChange}
        onTapBpm={handleTapBpm}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        subdivision={subdivision}
        onSubdivisionChange={handleSubdivisionChange}
        soundType={soundType}
        onSoundChange={handleSoundChange}
        currentBeat={currentBeat}
        onOpenSettings={openSettings}
      />

      <SettingsModal visible={settingsVisible} onClose={closeSettings}>
        <SettingsPage
          onClose={closeSettings}
          currentSound={soundType}
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