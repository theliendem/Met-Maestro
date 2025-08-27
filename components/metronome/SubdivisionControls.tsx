import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';

interface SubdivisionControlsProps {
  value: number;
  onChange: (subdivision: number) => void;
}

type SubdivisionOption = {
  value: number;
  label: string;
  icon: string;
};

const SUBDIVISION_OPTIONS: SubdivisionOption[] = [
  { value: 1, label: 'None', icon: 'circle' },
  { value: 2, label: 'Eighth', icon: 'music.note' },
  { value: 3, label: 'Triplet', icon: 'triangle' },
  { value: 4, label: 'Sixteenth', icon: 'music.note' },
  { value: 5, label: 'Quintuplet', icon: 'star' },
  { value: 6, label: 'Sixtuplet', icon: 'hexagon' },
];

export const SubdivisionControls: React.FC<SubdivisionControlsProps> = ({
  value,
  onChange,
}) => {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>
        Subdivision
      </Text>

      <View style={styles.optionsContainer}>
        {SUBDIVISION_OPTIONS.map((option) => (
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
              size={16}
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
    minWidth: 80,
    justifyContent: 'center',
  },
  optionLabel: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
  },
});
