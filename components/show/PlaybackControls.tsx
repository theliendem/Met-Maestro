import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentMeasure: number;
  totalMeasures: number;
  onPlayPause: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onRestart?: () => void;
  showPlaybackOptions?: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentMeasure,
  totalMeasures,
  onPlayPause,
  onPrevious,
  onNext,
  onRestart,
  showPlaybackOptions,
}) => {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { borderColor: theme.colors.accent }]}>
      {/* Measure Counter */}
      <View style={styles.measureCounter}>
        <Text style={[styles.measureText, { color: theme.colors.text }]}>
          {currentMeasure} / {totalMeasures}
        </Text>
        <Text style={[styles.measureLabel, { color: theme.colors.icon }]}>
          Measure
        </Text>
      </View>

      {/* Playback Controls */}
      <View style={styles.controlsRow}>
        {/* Previous Button */}
        {onPrevious && (
          <TouchableOpacity
            style={[styles.controlButton, { borderColor: theme.colors.icon }]}
            onPress={onPrevious}
          >
            <IconSymbol name="backward.end" size={20} color={theme.colors.icon} />
          </TouchableOpacity>
        )}

        {/* Restart Button */}
        {onRestart && (
          <TouchableOpacity
            style={[styles.controlButton, { borderColor: theme.colors.icon }]}
            onPress={onRestart}
          >
            <IconSymbol name="arrow.counterclockwise" size={20} color={theme.colors.icon} />
          </TouchableOpacity>
        )}

        {/* Play/Pause Button */}
        <TouchableOpacity
          style={[
            styles.playButton,
            {
              backgroundColor: isPlaying ? theme.colors.accent : 'rgba(187, 134, 252, 0.1)',
              borderColor: theme.colors.accent,
            }
          ]}
          onPress={onPlayPause}
          activeOpacity={0.8}
        >
          <IconSymbol
            name={isPlaying ? "pause.fill" : "play.fill"}
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>

        {/* Next Button */}
        {onNext && (
          <TouchableOpacity
            style={[styles.controlButton, { borderColor: theme.colors.icon }]}
            onPress={onNext}
          >
            <IconSymbol name="forward.end" size={20} color={theme.colors.icon} />
          </TouchableOpacity>
        )}

        {/* Playback Options Button */}
        {showPlaybackOptions && (
          <TouchableOpacity
            style={[styles.controlButton, { borderColor: theme.colors.icon }]}
            onPress={showPlaybackOptions}
          >
            <IconSymbol name="slider.horizontal.3" size={20} color={theme.colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Playback Status */}
      <View style={styles.statusRow}>
        <Text style={[styles.statusText, { color: isPlaying ? theme.colors.accent : theme.colors.icon }]}>
          {isPlaying ? 'Playing' : 'Paused'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  measureCounter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  measureText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  measureLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statusRow: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
