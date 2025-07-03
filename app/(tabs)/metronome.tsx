import { ThemedView } from '@/components/ThemedView';
import Slider from '@react-native-community/slider';
import { createAudioPlayer, useAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import Timer from '../../utils/timer';

const NUMERATOR_MIN = 1;
const NUMERATOR_MAX = 15;
const DENOMINATORS = [2, 4, 8, 16];
const TEMPO_MIN = 40;
const TEMPO_MAX = 240;

// Helper to play overlapping sound
async function playOverlappingSound(source: number) {
  const player = createAudioPlayer(source);
  player.play();
  // Release after playback finishes
  player.addListener('playbackStatusUpdate', (status: { didJustFinish?: boolean }) => {
    if (status.didJustFinish) {
      player.remove();
    }
  });
}

export default function MetronomeScreen() {
  const { colors } = useTheme();
  const [numerator, setNumerator] = useState(4);
  const [denominatorIdx, setDenominatorIdx] = useState(1); // default to 4
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0); // 0-based
  const denominator = DENOMINATORS[denominatorIdx];

  // Timer ref
  const timerRef = useRef<Timer | null>(null);

  // Audio players
  const hiPlayer = useAudioPlayer(require('@/assets/sounds/click_hi.wav'));
  const loPlayer = useAudioPlayer(require('@/assets/sounds/click_lo.wav'));

  // Calculate beat duration in ms
  const beatDuration = Math.round(60000 / (tempo * (denominator / 4)));

  // Start/stop timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) timerRef.current.stop();
      setCurrentBeat(0);
      return;
    }
    
    // Play the first beat immediately when starting
    hiPlayer.seekTo(0);
    setTimeout(() => hiPlayer.play(), 1);
    setCurrentBeat(0);
    
    // Timer callback
    const onTick = () => {
      setCurrentBeat(prev => {
        const nextBeat = (prev + 1) % numerator;
        // Play sound (downbeat = 0)
        if (nextBeat === 0) {
          hiPlayer.seekTo(0);
          setTimeout(() => hiPlayer.play(), 1);
        } else {
          loPlayer.seekTo(0);
          setTimeout(() => loPlayer.play(), 1);
        }
        return nextBeat;
      });
    };
    // Start timer
    timerRef.current = new Timer(onTick, beatDuration, { immediate: false });
    timerRef.current.start();
    return () => {
      timerRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, numerator, denominator, tempo, hiPlayer, loPlayer]);

  // Tempo bar segments
  const tempoBar = Array.from({ length: numerator });

  return (
    <ThemedView style={styles.container}>
      {/* Time Signature Selector */}
      <View style={styles.timeSignatureContainer}>
        <View style={styles.chevronRow}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={() => setNumerator(Math.max(NUMERATOR_MIN, numerator - 1))}
            disabled={numerator === NUMERATOR_MIN}
          />
          <Text variant="headlineLarge" style={styles.timeSigNumber}>{numerator}</Text>
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={() => setNumerator(Math.min(NUMERATOR_MAX, numerator + 1))}
            disabled={numerator === NUMERATOR_MAX}
          />
        </View>
        <View style={styles.horizontalBar} />
        <View style={styles.chevronRow}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={() => setDenominatorIdx(Math.max(0, denominatorIdx - 1))}
            disabled={denominatorIdx === 0}
          />
          <Text variant="headlineLarge" style={styles.timeSigNumber}>{denominator}</Text>
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={() => setDenominatorIdx(Math.min(DENOMINATORS.length - 1, denominatorIdx + 1))}
            disabled={denominatorIdx === DENOMINATORS.length - 1}
          />
        </View>
      </View>

      {/* Tempo Slider */}
      <View style={styles.tempoContainer}>
        <Text variant="titleMedium" style={{ color: colors.onSurface }}>Tempo: {tempo} BPM</Text>
        <View style={styles.sliderRow}>
          <IconButton
            icon="minus"
            size={20}
            onPress={() => setTempo(Math.max(TEMPO_MIN, tempo - 1))}
            disabled={tempo === TEMPO_MIN}
          />
          <Slider
            style={styles.slider}
            minimumValue={TEMPO_MIN}
            maximumValue={TEMPO_MAX}
            value={tempo}
            onValueChange={setTempo}
            step={1}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.surface}
            thumbTintColor={colors.primary}
          />
          <IconButton
            icon="plus"
            size={20}
            onPress={() => setTempo(Math.min(TEMPO_MAX, tempo + 1))}
            disabled={tempo === TEMPO_MAX}
          />
        </View>
      </View>

      {/* Tempo Bar */}
      <View style={styles.tempoBarContainer}>
        {tempoBar.map((_, i) => (
          <View
            key={i}
            style={{
              ...styles.tempoBarSegment,
              backgroundColor: i === currentBeat ? colors.primary : colors.surface,
              borderColor: colors.primary,
              opacity: i === currentBeat ? 1 : 0.4,
            }}
          />
        ))}
      </View>

      {/* Play/Stop Button */}
      <Button
        mode={isPlaying ? 'contained-tonal' : 'contained'}
        onPress={() => setIsPlaying(!isPlaying)}
        style={styles.playButton}
        icon={isPlaying ? 'stop' : 'play'}
        labelStyle={{ fontSize: 22 }}
        contentStyle={{ flexDirection: 'row-reverse' }}
      >
        {isPlaying ? 'Stop' : 'Play'}
      </Button>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 32,
  },
  timeSignatureContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSigNumber: {
    minWidth: 40,
    textAlign: 'center',
  },
  horizontalBar: {
    height: 2,
    width: 60,
    backgroundColor: '#888',
    marginVertical: 2,
    alignSelf: 'center',
  },
  tempoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  tempoBarContainer: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 16,
  },
  tempoBarSegment: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginHorizontal: 2,
  },
  playButton: {
    marginTop: 24,
    minWidth: 160,
  },
}); 