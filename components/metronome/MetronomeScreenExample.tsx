import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSoundSystem } from '../../contexts/SoundSystemContext';
import { useAppTheme } from '../../theme/AppTheme';
import { MetronomeControls } from './MetronomeControls';

/**
 * Example Metronome Screen using React Native UI components
 * This demonstrates how the new architecture will work
 */
export const MetronomeScreenExample: React.FC = () => {
  const { soundSystemRef, setCurrentMode } = useSoundSystem();
  const theme = useAppTheme();

  // Metronome state
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState({ numerator: 4, denominator: 4 });
  const [soundType, setSoundType] = useState('synth');
  const [isPlaying, setIsPlaying] = useState(false);
  const [subdivision, setSubdivision] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(0);

  // Tap BPM state
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Set mode when component mounts
  useEffect(() => {
    setCurrentMode('metronome');
  }, [setCurrentMode]);

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

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    if (isPlaying) {
      soundSystemRef.current?.updateMetronomeSettings({
        bpm: newBpm,
        timeSignature,
        soundType,
        subdivision
      });
    }
  };

  const handleTimeSignatureChange = (newTimeSignature: { numerator: number; denominator: number }) => {
    setTimeSignature(newTimeSignature);
    if (isPlaying) {
      soundSystemRef.current?.updateMetronomeSettings({
        bpm,
        timeSignature: newTimeSignature,
        soundType,
        subdivision
      });
    }
  };

  const handleSoundChange = (newSoundType: string) => {
    setSoundType(newSoundType);
    soundSystemRef.current?.updateSound(newSoundType);
  };

  const handleSubdivisionChange = (newSubdivision: number) => {
    setSubdivision(newSubdivision);
    if (isPlaying) {
      soundSystemRef.current?.updateMetronomeSettings({
        bpm,
        timeSignature,
        soundType,
        subdivision: newSubdivision
      });
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
