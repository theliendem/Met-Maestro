import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';

interface Measure {
  id: string;
  timeSignature: { numerator: number; denominator: number };
  tempo: number;
  count: number;
  letter?: string;
}

interface Show {
  id: string;
  name: string;
  measures: Measure[];
}

interface ShowVisualizerProps {
  show: Show | null;
  currentMeasure: number;
  onMeasurePress?: (measureIndex: number) => void;
}

export const ShowVisualizer: React.FC<ShowVisualizerProps> = ({
  show,
  currentMeasure,
  onMeasurePress,
}) => {
  const theme = useAppTheme();

  if (!show) {
    return (
      <View style={[styles.container, { borderColor: theme.colors.icon }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.icon }]}>
            Select a show to visualize
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: theme.colors.accent }]}>
      <View style={styles.header}>
        <Text style={[styles.showTitle, { color: theme.colors.text }]}>
          {show.name}
        </Text>
        <Text style={[styles.measureCount, { color: theme.colors.icon }]}>
          {show.measures.length} measures
        </Text>
      </View>

      <ScrollView
        style={styles.measuresContainer}
        showsVerticalScrollIndicator={false}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.measuresRow}>
          {show.measures.map((measure, index) => {
            const isCurrentMeasure = index + 1 === currentMeasure;
            const isPastMeasure = index + 1 < currentMeasure;

            return (
              <View
                key={measure.id}
                style={[
                  styles.measureCard,
                  {
                    borderColor: isCurrentMeasure
                      ? theme.colors.accent
                      : isPastMeasure
                        ? theme.colors.primary
                        : theme.colors.icon,
                    backgroundColor: isCurrentMeasure
                      ? 'rgba(187, 134, 252, 0.1)'
                      : isPastMeasure
                        ? 'rgba(10, 126, 164, 0.1)'
                        : 'transparent',
                  }
                ]}
              >
                {/* Measure Number */}
                <View style={styles.measureNumber}>
                  <Text
                    style={[
                      styles.measureNumberText,
                      {
                        color: isCurrentMeasure
                          ? theme.colors.accent
                          : isPastMeasure
                            ? theme.colors.primary
                            : theme.colors.icon,
                      }
                    ]}
                  >
                    {index + 1}
                  </Text>
                  {measure.letter && (
                    <Text
                      style={[
                        styles.measureLetter,
                        {
                          color: isCurrentMeasure
                            ? theme.colors.accent
                            : isPastMeasure
                              ? theme.colors.primary
                              : theme.colors.icon,
                        }
                      ]}
                    >
                      {measure.letter}
                    </Text>
                  )}
                </View>

                {/* Time Signature */}
                <View style={styles.timeSignature}>
                  <Text
                    style={[
                      styles.timeSignatureText,
                      { color: theme.colors.text }
                    ]}
                  >
                    {measure.timeSignature.numerator}/{measure.timeSignature.denominator}
                  </Text>
                </View>

                {/* Tempo */}
                <View style={styles.tempo}>
                  <Text
                    style={[
                      styles.tempoText,
                      { color: theme.colors.text }
                    ]}
                  >
                    {measure.tempo}
                  </Text>
                  <Text
                    style={[
                      styles.tempoLabel,
                      { color: theme.colors.icon }
                    ]}
                  >
                    BPM
                  </Text>
                </View>

                {/* Count */}
                <View style={styles.count}>
                  <Text
                    style={[
                      styles.countText,
                      { color: theme.colors.icon }
                    ]}
                  >
                    {measure.count}x
                  </Text>
                </View>

                {/* Current measure indicator */}
                {isCurrentMeasure && (
                  <View style={[styles.currentIndicator, { backgroundColor: theme.colors.accent }]} />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: 160,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  showTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  measureCount: {
    fontSize: 12,
  },
  measuresContainer: {
    flex: 1,
  },
  measuresRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  measureCard: {
    width: 120,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  measureNumber: {
    alignItems: 'center',
    marginBottom: 8,
  },
  measureNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  measureLetter: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  timeSignature: {
    marginBottom: 8,
  },
  timeSignatureText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tempo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  tempoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tempoLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  count: {
    marginTop: 'auto',
  },
  countText: {
    fontSize: 12,
  },
  currentIndicator: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
