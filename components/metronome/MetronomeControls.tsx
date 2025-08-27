import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { TempoBar } from '../ui/TempoBar';
import { BpmControls } from './BpmControls';
import { PlayButton } from './PlayButton';
import { SoundControls } from './SoundControls';
import { SubdivisionControls } from './SubdivisionControls';
import { TimeSignatureSelector } from './TimeSignatureSelector';

interface MetronomeControlsProps {
  // Time signature
  timeSignature: { numerator: number; denominator: number };
  onTimeSignatureChange: (ts: { numerator: number; denominator: number }) => void;

  // BPM
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onTapBpm: () => void;

  // Playback
  isPlaying: boolean;
  onPlayPause: () => void;

  // Subdivision
  subdivision: number;
  onSubdivisionChange: (subdivision: number) => void;

  // Sound
  soundType: string;
  onSoundChange: (soundType: string) => void;

  // Visual feedback
  currentBeat?: number;
  onOpenSettings?: () => void;
}

export const MetronomeControls: React.FC<MetronomeControlsProps> = ({
  timeSignature,
  onTimeSignatureChange,
  bpm,
  onBpmChange,
  onTapBpm,
  isPlaying,
  onPlayPause,
  subdivision,
  onSubdivisionChange,
  soundType,
  onSoundChange,
  currentBeat = 0,
  onOpenSettings,
}) => {
  const theme = useAppTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Time Signature Selector */}
      <View style={styles.section}>
        <TimeSignatureSelector
          value={timeSignature}
          onChange={onTimeSignatureChange}
        />
      </View>

      {/* BPM Controls */}
      <View style={styles.section}>
        <BpmControls
          bpm={bpm}
          onChange={onBpmChange}
          onTap={onTapBpm}
        />
      </View>

      {/* Tempo Bar - Visual beat indicator */}
      <View style={styles.section}>
        <TempoBar
          beats={timeSignature.numerator}
          currentBeat={currentBeat}
          subdivision={subdivision}
        />
      </View>

      {/* Play/Pause Button */}
      <View style={styles.section}>
        <PlayButton
          isPlaying={isPlaying}
          onPress={onPlayPause}
        />
      </View>

      {/* Subdivision Controls */}
      <View style={styles.section}>
        <SubdivisionControls
          value={subdivision}
          onChange={onSubdivisionChange}
        />
      </View>

      {/* Sound Controls */}
      <View style={styles.section}>
        <SoundControls
          value={soundType}
          onChange={onSoundChange}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
    alignItems: 'center',
  },
});
