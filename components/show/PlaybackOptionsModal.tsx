import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';

interface PlaybackOptions {
  startType: 'beginning' | 'current' | 'specific';
  startMeasure: string;
  startLetter: string;
  endType: 'end' | 'specific';
  endMeasure: string;
  endLetter: string;
}

interface PlaybackOptionsModalProps {
  visible: boolean;
  options: PlaybackOptions;
  onChange: (options: PlaybackOptions) => void;
  onClose: () => void;
  totalMeasures: number;
}

export const PlaybackOptionsModal: React.FC<PlaybackOptionsModalProps> = ({
  visible,
  options,
  onChange,
  onClose,
  totalMeasures,
}) => {
  const theme = useAppTheme();

  const updateOptions = (updates: Partial<PlaybackOptions>) => {
    onChange({ ...options, ...updates });
  };

  const renderStartSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Start Playback
      </Text>

      {/* Start Type Options */}
      <View style={styles.optionGroup}>
        {[
          { value: 'beginning', label: 'From Beginning' },
          { value: 'current', label: 'From Current Measure' },
          { value: 'specific', label: 'Specific Measure' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              {
                borderColor: options.startType === option.value
                  ? theme.colors.accent
                  : theme.colors.icon,
                backgroundColor: options.startType === option.value
                  ? 'rgba(187, 134, 252, 0.1)'
                  : 'transparent',
              }
            ]}
            onPress={() => updateOptions({ startType: option.value as any })}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: options.startType === option.value
                    ? theme.colors.accent
                    : theme.colors.text,
                }
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Start Measure/Letter Inputs (shown when specific is selected) */}
      {options.startType === 'specific' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.icon }]}>
            Start Measure:
          </Text>
          <View style={styles.measureInput}>
            <TouchableOpacity
              style={[styles.inputButton, { borderColor: theme.colors.icon }]}
              onPress={() => {
                const newMeasure = Math.max(1, parseInt(options.startMeasure) - 1);
                updateOptions({ startMeasure: newMeasure.toString() });
              }}
            >
              <IconSymbol name="minus" size={16} color={theme.colors.icon} />
            </TouchableOpacity>
            <Text style={[styles.inputValue, { color: theme.colors.text }]}>
              {options.startMeasure}
            </Text>
            <TouchableOpacity
              style={[styles.inputButton, { borderColor: theme.colors.icon }]}
              onPress={() => {
                const newMeasure = Math.min(totalMeasures, parseInt(options.startMeasure) + 1);
                updateOptions({ startMeasure: newMeasure.toString() });
              }}
            >
              <IconSymbol name="plus" size={16} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderEndSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        End Playback
      </Text>

      {/* End Type Options */}
      <View style={styles.optionGroup}>
        {[
          { value: 'end', label: 'Until End' },
          { value: 'specific', label: 'Specific Measure' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              {
                borderColor: options.endType === option.value
                  ? theme.colors.accent
                  : theme.colors.icon,
                backgroundColor: options.endType === option.value
                  ? 'rgba(187, 134, 252, 0.1)'
                  : 'transparent',
              }
            ]}
            onPress={() => updateOptions({ endType: option.value as any })}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: options.endType === option.value
                    ? theme.colors.accent
                    : theme.colors.text,
                }
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* End Measure Input (shown when specific is selected) */}
      {options.endType === 'specific' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.icon }]}>
            End Measure:
          </Text>
          <View style={styles.measureInput}>
            <TouchableOpacity
              style={[styles.inputButton, { borderColor: theme.colors.icon }]}
              onPress={() => {
                const newMeasure = Math.max(1, parseInt(options.endMeasure) - 1);
                updateOptions({ endMeasure: newMeasure.toString() });
              }}
            >
              <IconSymbol name="minus" size={16} color={theme.colors.icon} />
            </TouchableOpacity>
            <Text style={[styles.inputValue, { color: theme.colors.text }]}>
              {options.endMeasure}
            </Text>
            <TouchableOpacity
              style={[styles.inputButton, { borderColor: theme.colors.icon }]}
              onPress={() => {
                const newMeasure = Math.min(totalMeasures, parseInt(options.endMeasure) + 1);
                updateOptions({ endMeasure: newMeasure.toString() });
              }}
            >
              <IconSymbol name="plus" size={16} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Playback Options
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { borderColor: theme.colors.icon }]}
              onPress={onClose}
            >
              <IconSymbol name="xmark" size={16} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderStartSection()}
            {renderEndSection()}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: theme.colors.accent }]}
              onPress={onClose}
            >
              <Text style={[styles.applyButtonText, { color: theme.colors.text }]}>
                Apply Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionGroup: {
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputGroup: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  measureInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  inputButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputValue: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  applyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
