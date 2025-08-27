import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';

interface TimeSignatureSelectorProps {
  value: { numerator: number; denominator: number };
  onChange: (value: { numerator: number; denominator: number }) => void;
}

export const TimeSignatureSelector: React.FC<TimeSignatureSelectorProps> = ({
  value,
  onChange,
}) => {
  const theme = useAppTheme();

  const handleNumeratorChange = (direction: 'up' | 'down') => {
    const newNumerator = direction === 'up'
      ? Math.min(16, value.numerator + 1)
      : Math.max(1, value.numerator - 1);
    onChange({ ...value, numerator: newNumerator });
  };

  const handleDenominatorChange = (direction: 'up' | 'down') => {
    const denominators = [2, 4, 8, 16];
    const currentIndex = denominators.indexOf(value.denominator);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up'
      ? Math.min(denominators.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);

    onChange({ ...value, denominator: denominators[newIndex] });
  };

  return (
    <View style={[styles.container, { borderColor: theme.colors.accent }]}>
      {/* Numerator Controls */}
      <View style={styles.controlGroup}>
        <TouchableOpacity
          style={[styles.button, { borderColor: theme.colors.icon }]}
          onPress={() => handleNumeratorChange('up')}
        >
          <IconSymbol name="chevron.up" size={16} color={theme.colors.icon} />
        </TouchableOpacity>

        <Text style={[styles.number, { color: theme.colors.text }]}>
          {value.numerator}
        </Text>

        <TouchableOpacity
          style={[styles.button, { borderColor: theme.colors.icon }]}
          onPress={() => handleNumeratorChange('down')}
        >
          <IconSymbol name="chevron.down" size={16} color={theme.colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Divider Line */}
      <View style={[styles.divider, { backgroundColor: theme.colors.icon }]} />

      {/* Denominator Controls */}
      <View style={styles.controlGroup}>
        <TouchableOpacity
          style={[styles.button, { borderColor: theme.colors.icon }]}
          onPress={() => handleDenominatorChange('up')}
        >
          <IconSymbol name="chevron.up" size={16} color={theme.colors.icon} />
        </TouchableOpacity>

        <Text style={[styles.number, { color: theme.colors.text }]}>
          {value.denominator}
        </Text>

        <TouchableOpacity
          style={[styles.button, { borderColor: theme.colors.icon }]}
          onPress={() => handleDenominatorChange('down')}
        >
          <IconSymbol name="chevron.down" size={16} color={theme.colors.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  controlGroup: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  button: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  number: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 40,
    marginVertical: 8,
  },
  divider: {
    width: 2,
    height: 40,
    marginHorizontal: 12,
  },
});
