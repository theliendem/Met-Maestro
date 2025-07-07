import { SettingsButton } from '@/components/SettingsButton';
import { SettingsModal } from '@/components/SettingsModal';
import { ThemedView } from '@/components/ThemedView';
import { AppTheme } from '@/theme/AppTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { createAudioPlayer, useAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
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
  const colors = AppTheme.colors;
  const [numerator, setNumerator] = useState(4);
  const [denominatorIdx, setDenominatorIdx] = useState(1); // default to 4
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0); // 0-based
  const denominator = DENOMINATORS[denominatorIdx];
  const [settingsVisible, setSettingsVisible] = useState(false);

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
  // Dynamic circle size and gap: 2 beats = 36px/16px, 15 beats = 18px/2px
  const minCircleSize = 18;
  const maxCircleSize = 36;
  const minGap = 2;
  const maxGap = 16;
  const circleSize =
    numerator <= 2
      ? maxCircleSize
      : numerator >= 15
      ? minCircleSize
      : Math.round(maxCircleSize - ((numerator - 2) / (15 - 2)) * (maxCircleSize - minCircleSize));
  const circleGap =
    numerator <= 2
      ? maxGap
      : numerator >= 15
      ? minGap
      : Math.round(maxGap - ((numerator - 2) / (15 - 2)) * (maxGap - minGap));

  return (
    <ThemedView style={styles.container}>
      {/* Settings gear */}
      <SettingsButton onPress={() => setSettingsVisible(true)} />
      {/* Settings Modal */}
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      {/* Time Signature Selector */}
      <View style={styles.timeSignatureContainer}>
        <View style={styles.chevronRow}>
          <IconButton
            icon="chevron-left"
            size={36}
            onPress={() => setNumerator(Math.max(NUMERATOR_MIN, numerator - 1))}
            disabled={numerator === NUMERATOR_MIN}
          />
          <Text variant="displayLarge" style={styles.timeSigNumber}>{numerator}</Text>
          <IconButton
            icon="chevron-right"
            size={36}
            onPress={() => setNumerator(Math.min(NUMERATOR_MAX, numerator + 1))}
            disabled={numerator === NUMERATOR_MAX}
          />
        </View>
        <View style={styles.horizontalBar} />
        <View style={styles.chevronRow}>
          <IconButton
            icon="chevron-left"
            size={36}
            onPress={() => setDenominatorIdx(Math.max(0, denominatorIdx - 1))}
            disabled={denominatorIdx === 0}
          />
          <Text variant="displayLarge" style={styles.timeSigNumber}>{denominator}</Text>
          <IconButton
            icon="chevron-right"
            size={36}
            onPress={() => setDenominatorIdx(Math.min(DENOMINATORS.length - 1, denominatorIdx + 1))}
            disabled={denominatorIdx === DENOMINATORS.length - 1}
          />
        </View>
      </View>

      {/* Tempo Slider */}
      <View style={styles.tempoContainer}>
        <View style={styles.tempoLabel}>
          <Text variant="displaySmall" style={{ color: colors.text, fontSize: 48, fontWeight: 'bold', paddingTop: 5 }}>{tempo}</Text>
          <Text variant="titleMedium" style={{ color: colors.text, fontSize: 20 }}> BPM</Text>
        </View>
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
            tapToSeek={true}
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
      <View style={[styles.tempoBarContainer, { gap: circleGap }]}>
        {tempoBar.map((_, i) => (
          <View
            key={i}
            style={{
              ...styles.tempoBarSegment,
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: i === currentBeat ? colors.primary : colors.surface,
              borderColor: colors.primary,
              opacity: i === currentBeat ? 1 : 0.4,
              marginHorizontal: 0, // gap is now handled by container
            }}
          />
        ))}
      </View>

      {/* Play/Stop Button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => setIsPlaying(!isPlaying)}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Stop' : 'Play'}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name={isPlaying ? 'stop' : 'play'}
          size={80}
          color={colors.primary}
          style={{ alignSelf: 'center' }}
        />
      </TouchableOpacity>
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
    backgroundColor: AppTheme.colors.background,
  },
  timeSignatureContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  chevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSigNumber: {
    minWidth: 60,
    textAlign: 'center',
    color: AppTheme.colors.text,
    fontSize: 48,
  },
  horizontalBar: {
    height: 3,
    width: 90,
    backgroundColor: AppTheme.colors.icon,
    marginVertical: 3,
    alignSelf: 'center',
  },
  tempoContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  tempoLabel: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
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
    marginVertical: 8,
  },
  tempoBarSegment: {
    // width and height are now dynamic
    borderWidth: 2,
    borderColor: AppTheme.colors.primary,
  },
  playButton: {
    marginTop: 24,
    width: '92%',
    alignSelf: 'center',
    height: 144,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#202127',
  },
}); 