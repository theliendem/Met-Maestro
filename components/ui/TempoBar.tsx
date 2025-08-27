import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';

interface TempoBarProps {
  beats: number; // Number of beats in the measure (time signature numerator)
  currentBeat?: number; // Current beat (1-based, 0 means no beat active)
  subdivision?: number; // Current subdivision level
}

export const TempoBar: React.FC<TempoBarProps> = ({
  beats,
  currentBeat = 0,
  subdivision = 1,
}) => {
  const theme = useAppTheme();

  // Create array of beat indicators
  const beatIndicators = Array.from({ length: beats }, (_, index) => index + 1);

  return (
    <View style={styles.container}>
      <View style={styles.tempoBar}>
        {beatIndicators.map((beatNumber) => {
          const isActive = currentBeat === beatNumber;
          const isDownbeat = beatNumber === 1;

          return (
            <View
              key={beatNumber}
              style={[
                styles.beatIndicator,
                {
                  backgroundColor: isActive
                    ? (isDownbeat ? theme.colors.accent : theme.colors.primary)
                    : 'rgba(255, 255, 255, 0.1)',
                  borderColor: isActive
                    ? (isDownbeat ? theme.colors.accent : theme.colors.primary)
                    : theme.colors.icon,
                  transform: isActive ? [{ scale: 1.2 }] : [{ scale: 1 }],
                }
              ]}
            >
              {/* Beat number */}
              <View style={[
                styles.beatNumber,
                {
                  backgroundColor: isActive
                    ? (isDownbeat ? theme.colors.accent : theme.colors.primary)
                    : 'transparent',
                }
              ]}>
                {/* Only show number on downbeat or when active */}
                {(isDownbeat || isActive) && (
                  <Text style={{
                    color: theme.colors.text,
                    fontSize: 12,
                    fontWeight: isDownbeat ? 'bold' : 'normal'
                  }}>
                    {beatNumber}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Subdivision indicators (if subdivision > 1) */}
      {subdivision > 1 && (
        <View style={styles.subdivisionContainer}>
          {Array.from({ length: subdivision }, (_, index) => (
            <View
              key={index}
              style={[
                styles.subdivisionDot,
                {
                  backgroundColor: index === 0
                    ? theme.colors.accent
                    : theme.colors.icon,
                  opacity: index === 0 ? 1 : 0.5,
                }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  tempoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  beatIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    // Add shadow for active beats
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  beatNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subdivisionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  subdivisionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
