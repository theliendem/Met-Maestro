import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';

interface TunerNeedleProps {
  cents: number | null;
}

const MAX_CENTS = 50; // Maximum cents deviation to show
const NEEDLE_RANGE = 150; // Degrees of needle movement (75 degrees each side)

export const TunerNeedle: React.FC<TunerNeedleProps> = ({ cents }) => {
  const theme = useAppTheme();
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (cents === null) {
      // Animate needle back to center when no pitch detected
      Animated.spring(rotationAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
      return;
    }

    // Clamp cents to our display range
    const clampedCents = Math.max(-MAX_CENTS, Math.min(MAX_CENTS, cents));

    // Convert cents to rotation degrees (-75 to +75 degrees)
    const rotationDegrees = (clampedCents / MAX_CENTS) * (NEEDLE_RANGE / 2);

    // Animate needle to new position
    Animated.spring(rotationAnim, {
      toValue: rotationDegrees,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [cents, rotationAnim]);

  const rotation = rotationAnim.interpolate({
    inputRange: [-NEEDLE_RANGE / 2, NEEDLE_RANGE / 2],
    outputRange: [`-${NEEDLE_RANGE / 2}deg`, `${NEEDLE_RANGE / 2}deg`],
  });

  return (
    <View style={styles.container}>
      {/* Tuner Scale Background */}
      <View style={styles.scaleContainer}>
        {/* Scale markings */}
        {Array.from({ length: 21 }, (_, index) => {
          const position = (index - 10) * 7.5; // -75 to +75 degrees
          const isMajor = index % 5 === 0;
          const isCenter = index === 10;

          return (
            <View
              key={index}
              style={[
                styles.scaleMark,
                {
                  transform: [{ rotate: `${position}deg` }],
                  height: isMajor ? 20 : 10,
                  width: isMajor ? 3 : 1,
                  backgroundColor: isCenter ? theme.colors.accent : theme.colors.icon,
                  opacity: isMajor ? 1 : 0.6,
                }
              ]}
            />
          );
        })}

        {/* Scale labels */}
        <Text style={[styles.scaleLabel, styles.scaleLabelLeft, { color: theme.colors.icon }]}>
          Flat
        </Text>
        <Text style={[styles.scaleLabel, styles.scaleLabelRight, { color: theme.colors.icon }]}>
          Sharp
        </Text>
      </View>

      {/* Needle */}
      <View style={styles.needleContainer}>
        <Animated.View
          style={[
            styles.needle,
            {
              backgroundColor: theme.colors.accent,
              transform: [{ rotate: rotation }],
            }
          ]}
        >
          {/* Needle tip */}
          <View style={[styles.needleTip, { backgroundColor: theme.colors.accent }]} />
        </Animated.View>

        {/* Center pivot */}
        <View style={[styles.pivot, { borderColor: theme.colors.icon }]} />
      </View>

      {/* Tuning Indicator */}
      {cents !== null && (
        <View style={styles.indicatorContainer}>
          {Math.abs(cents) <= 5 ? (
            <View style={[styles.inTuneIndicator, { backgroundColor: theme.colors.accent }]}>
              <Text style={[styles.inTuneText, { color: theme.colors.text }]}>
                ✓ In Tune
              </Text>
            </View>
          ) : (
            <View style={[styles.outOfTuneIndicator, { borderColor: theme.colors.icon }]}>
              <Text style={[styles.outOfTuneText, { color: theme.colors.text }]}>
                {cents > 0 ? '♯ Sharp' : '♭ Flat'} ({Math.abs(cents)}¢)
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
    height: 200,
  },
  scaleContainer: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleMark: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -1.5,
    borderRadius: 1.5,
  },
  scaleLabel: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '500',
  },
  scaleLabelLeft: {
    left: 10,
    top: '50%',
    marginTop: -10,
    transform: [{ rotate: '-90deg' }],
  },
  scaleLabelRight: {
    right: 10,
    top: '50%',
    marginTop: -10,
    transform: [{ rotate: '90deg' }],
  },
  needleContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needle: {
    position: 'absolute',
    width: 120,
    height: 4,
    borderRadius: 2,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  needleTip: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: -6,
  },
  pivot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: -30,
    alignItems: 'center',
  },
  inTuneIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  inTuneText: {
    fontSize: 14,
    fontWeight: '600',
  },
  outOfTuneIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
  },
  outOfTuneText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
