import Slider from '@react-native-community/slider';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';

interface BpmControlsProps {
  bpm: number;
  onChange: (bpm: number) => void;
  onTap: () => void;
}

export const BpmControls: React.FC<BpmControlsProps> = ({
  bpm,
  onChange,
  onTap,
}) => {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      {/* BPM Label */}
      <Text style={[styles.label, { color: theme.colors.text }]}>
        Tempo: {bpm} BPM
      </Text>

      {/* BPM Slider */}
      <Slider
        style={styles.slider}
        minimumValue={40}
        maximumValue={240}
        value={bpm}
        onValueChange={onChange}
        minimumTrackTintColor={theme.colors.accent}
        maximumTrackTintColor={theme.colors.icon}
        thumbTintColor={theme.colors.accent}
        step={1}
      />

      {/* Tap BPM Button */}
      <TouchableOpacity
        style={[styles.tapButton, { borderColor: theme.colors.accent }]}
        onPress={onTap}
      >
        <IconSymbol name="hand.raised" size={20} color={theme.colors.accent} />
        <Text style={[styles.tapButtonText, { color: theme.colors.accent }]}>
          Tap BPM
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  slider: {
    width: '80%',
    height: 40,
  },
  tapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 16,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
  },
  tapButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});
