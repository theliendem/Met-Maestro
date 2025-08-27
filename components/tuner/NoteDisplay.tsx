import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';

interface NoteDisplayProps {
  note: string | null;
  frequency: number | null;
  isInTune: boolean;
}

export const NoteDisplay: React.FC<NoteDisplayProps> = ({
  note,
  frequency,
  isInTune,
}) => {
  const theme = useAppTheme();

  if (!note) {
    return (
      <View style={[styles.container, { borderColor: theme.colors.icon }]}>
        <View style={styles.noNoteContainer}>
          <IconSymbol name="music.note" size={48} color={theme.colors.icon} />
          <Text style={[styles.noNoteText, { color: theme.colors.icon }]}>
            Play a note
          </Text>
        </View>
      </View>
    );
  }

  // Extract note name and octave (e.g., "A4" -> note: "A", octave: "4")
  const noteMatch = note.match(/^([A-G]#?)(\d)?$/);
  const noteName = noteMatch ? noteMatch[1] : note;
  const octave = noteMatch ? noteMatch[2] : '';

  return (
    <View style={[styles.container, {
      borderColor: isInTune ? theme.colors.accent : theme.colors.icon,
      backgroundColor: isInTune ? 'rgba(187, 134, 252, 0.1)' : 'transparent',
    }]}>
      <View style={styles.noteContainer}>
        {/* Main Note */}
        <Text style={[styles.noteText, {
          color: isInTune ? theme.colors.accent : theme.colors.text,
        }]}>
          {noteName}
        </Text>

        {/* Octave */}
        {octave && (
          <Text style={[styles.octaveText, {
            color: isInTune ? theme.colors.accent : theme.colors.icon,
          }]}>
            {octave}
          </Text>
        )}
      </View>

      {/* Tuning Status Indicator */}
      <View style={styles.statusContainer}>
        {isInTune ? (
          <View style={styles.inTuneStatus}>
            <IconSymbol name="checkmark.circle.fill" size={20} color={theme.colors.accent} />
            <Text style={[styles.statusText, { color: theme.colors.accent }]}>
              In Tune
            </Text>
          </View>
        ) : (
          <View style={styles.outOfTuneStatus}>
            <IconSymbol name="circle" size={16} color={theme.colors.icon} />
            <Text style={[styles.statusText, { color: theme.colors.icon }]}>
              Tuning...
            </Text>
          </View>
        )}
      </View>

      {/* Frequency Display */}
      {frequency && (
        <View style={styles.frequencyContainer}>
          <Text style={[styles.frequencyText, { color: theme.colors.icon }]}>
            {frequency.toFixed(1)} Hz
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    minWidth: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  noNoteContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noNoteText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  octaveText: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 4,
    marginBottom: 8,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  inTuneStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  outOfTuneStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  frequencyContainer: {
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
