import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';

interface SoundControlsProps {
  value: string;
  onChange: (soundType: string) => void;
}

type SoundOption = {
  value: string;
  label: string;
  icon: string;
};

const SOUND_OPTIONS: SoundOption[] = [
  { value: 'synth', label: 'Synth', icon: 'waveform' },
  { value: 'woodblock', label: 'Woodblock', icon: 'circle.grid.2x2' },
  { value: 'cowbell', label: 'Cowbell', icon: 'bell' },
  { value: 'electronic', label: 'Electronic', icon: 'speaker.wave.2' },
  { value: 'click', label: 'Click', icon: 'circle' },
];

export const SoundControls: React.FC<SoundControlsProps> = ({
  value,
  onChange,
}) => {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>
        Sound
      </Text>

      <View style={styles.optionsContainer}>
        {SOUND_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              {
                borderColor: value === option.value ? theme.colors.accent : theme.colors.icon,
                backgroundColor: value === option.value
                  ? 'rgba(187, 134, 252, 0.2)'
                  : 'transparent',
              }
            ]}
            onPress={() => onChange(option.value)}
          >
            <IconSymbol
              name={option.icon as any}
              size={20}
              color={value === option.value ? theme.colors.accent : theme.colors.icon}
            />
            <Text
              style={[
                styles.optionLabel,
                {
                  color: value === option.value ? theme.colors.accent : theme.colors.text,
                }
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 90,
    justifyContent: 'center',
  },
  optionLabel: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
  },
});
