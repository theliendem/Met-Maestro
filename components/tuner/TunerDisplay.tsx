import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';
import { NoteDisplay } from './NoteDisplay';
import { PermissionPrompt } from './PermissionPrompt';
import { ReferencePitchControl } from './ReferencePitchControl';
import { TunerNeedle } from './TunerNeedle';

interface TunerDisplayProps {
  note: string | null;
  frequency: number | null;
  cents: number | null;
  referencePitch: number;
  permissionStatus: 'unknown' | 'granted' | 'denied';
  onRequestPermission: () => void;
  onReferencePitchChange: (pitch: number) => void;
  onOpenSettings?: () => void;
}

export const TunerDisplay: React.FC<TunerDisplayProps> = ({
  note,
  frequency,
  cents,
  referencePitch,
  permissionStatus,
  onRequestPermission,
  onReferencePitchChange,
  onOpenSettings,
}) => {
  const theme = useAppTheme();

  // Show permission prompt if microphone access is denied
  if (permissionStatus === 'denied') {
    return (
      <PermissionPrompt
        onRequestPermission={onRequestPermission}
        onOpenSettings={onOpenSettings}
      />
    );
  }

  // Show loading state if permission is unknown
  if (permissionStatus === 'unknown') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingState}>
          <IconSymbol name="mic" size={64} color={theme.colors.icon} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Initializing tuner...
          </Text>
        </View>
      </View>
    );
  }

  const isInTune = cents !== null && Math.abs(cents) <= 5;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Settings Button */}
      {onOpenSettings && (
        <TouchableOpacity
          style={[styles.settingsButton, { borderColor: theme.colors.icon }]}
          onPress={onOpenSettings}
        >
          <IconSymbol name="gear" size={20} color={theme.colors.icon} />
        </TouchableOpacity>
      )}

      {/* Main Tuner Display */}
      <View style={styles.tunerContent}>
        {/* Note Display */}
        <NoteDisplay
          note={note}
          frequency={frequency}
          isInTune={isInTune}
        />

        {/* Tuner Needle */}
        <View style={styles.needleContainer}>
          <TunerNeedle cents={cents} />
        </View>

        {/* Frequency Display */}
        <View style={styles.frequencyContainer}>
          <Text style={[styles.frequencyLabel, { color: theme.colors.icon }]}>
            Frequency
          </Text>
          <Text style={[styles.frequencyValue, { color: theme.colors.text }]}>
            {frequency ? `${frequency.toFixed(1)} Hz` : '-- Hz'}
          </Text>
        </View>

        {/* Reference Pitch Control */}
        <View style={styles.referenceContainer}>
          <ReferencePitchControl
            value={referencePitch}
            onChange={onReferencePitchChange}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tunerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  needleContainer: {
    marginVertical: 40,
    alignItems: 'center',
  },
  frequencyContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  frequencyLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  frequencyValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  referenceContainer: {
    marginTop: 20,
  },
});
