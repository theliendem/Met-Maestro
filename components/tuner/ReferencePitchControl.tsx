import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';

interface ReferencePitchControlProps {
  value: number;
  onChange: (pitch: number) => void;
}

const REFERENCE_PITCHES = [
  { label: '415 Hz', value: 415 },
  { label: '420 Hz', value: 420 },
  { label: '430 Hz', value: 430 },
  { label: '435 Hz', value: 435 },
  { label: '440 Hz', value: 440 }, // Standard concert pitch
  { label: '442 Hz', value: 442 },
  { label: '445 Hz', value: 445 },
  { label: '450 Hz', value: 450 },
  { label: '452 Hz', value: 452 },
  { label: '466 Hz', value: 466 }, // Baroque pitch
];

export const ReferencePitchControl: React.FC<ReferencePitchControlProps> = ({
  value,
  onChange,
}) => {
  const theme = useAppTheme();

  const handlePitchChange = (direction: 'up' | 'down') => {
    const currentIndex = REFERENCE_PITCHES.findIndex(pitch => pitch.value === value);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up'
      ? Math.min(REFERENCE_PITCHES.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);

    onChange(REFERENCE_PITCHES[newIndex].value);
  };

  return (
    <View style={[styles.container, { borderColor: theme.colors.accent }]}>
      <Text style={[styles.label, { color: theme.colors.text }]}>
        Reference Pitch (A4)
      </Text>

      <View style={styles.controlContainer}>
        {/* Decrease Button */}
        <TouchableOpacity
          style={[styles.button, { borderColor: theme.colors.icon }]}
          onPress={() => handlePitchChange('down')}
        >
          <IconSymbol name="minus" size={16} color={theme.colors.icon} />
        </TouchableOpacity>

        {/* Current Pitch Display */}
        <View style={[styles.pitchDisplay, { borderColor: theme.colors.accent }]}>
          <Text style={[styles.pitchValue, { color: theme.colors.accent }]}>
            {value}
          </Text>
          <Text style={[styles.pitchUnit, { color: theme.colors.icon }]}>
            Hz
          </Text>
        </View>

        {/* Increase Button */}
        <TouchableOpacity
          style={[styles.button, { borderColor: theme.colors.icon }]}
          onPress={() => handlePitchChange('up')}
        >
          <IconSymbol name="plus" size={16} color={theme.colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Quick Selection Buttons */}
      <View style={styles.quickSelectContainer}>
        <Text style={[styles.quickSelectLabel, { color: theme.colors.icon }]}>
          Quick Select:
        </Text>
        <View style={styles.quickButtonsRow}>
          <TouchableOpacity
            style={[
              styles.quickButton,
              {
                borderColor: value === 440 ? theme.colors.accent : theme.colors.icon,
                backgroundColor: value === 440 ? 'rgba(187, 134, 252, 0.1)' : 'transparent',
              }
            ]}
            onPress={() => onChange(440)}
          >
            <Text
              style={[
                styles.quickButtonText,
                {
                  color: value === 440 ? theme.colors.accent : theme.colors.text,
                }
              ]}
            >
              Standard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickButton,
              {
                borderColor: value === 415 ? theme.colors.accent : theme.colors.icon,
                backgroundColor: value === 415 ? 'rgba(187, 134, 252, 0.1)' : 'transparent',
              }
            ]}
            onPress={() => onChange(415)}
          >
            <Text
              style={[
                styles.quickButtonText,
                {
                  color: value === 415 ? theme.colors.accent : theme.colors.text,
                }
              ]}
            >
              Baroque
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickButton,
              {
                borderColor: value === 442 ? theme.colors.accent : theme.colors.icon,
                backgroundColor: value === 442 ? 'rgba(187, 134, 252, 0.1)' : 'transparent',
              }
            ]}
            onPress={() => onChange(442)}
          >
            <Text
              style={[
                styles.quickButtonText,
                {
                  color: value === 442 ? theme.colors.accent : theme.colors.text,
                }
              ]}
            >
              Symphonic
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  controlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  button: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  pitchDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  pitchValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pitchUnit: {
    fontSize: 14,
    marginLeft: 4,
    marginBottom: 2,
  },
  quickSelectContainer: {
    alignItems: 'center',
  },
  quickSelectLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
