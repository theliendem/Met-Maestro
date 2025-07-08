import { SettingsButton } from '@/components/SettingsButton';
import { SettingsModal } from '@/components/SettingsModal';
import { ThemedView } from '@/components/ThemedView';
import { AppTheme } from '@/theme/AppTheme';
import { vh, vw } from '@/utils/responsive';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Modal, TextInput as RNTextInput, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import Timer from '../../utils/timer';

const NUMERATOR_MIN = 1;
const NUMERATOR_MAX = 15;
const DENOMINATORS = [2, 4, 8, 16];
const TEMPO_MIN = 40;
const TEMPO_MAX = 240;

const ComingSoonModal = ({ visible, title, onClose }: { visible: boolean; title: string; onClose: () => void }) => (
  <Modal visible={visible} transparent animationType="fade">
    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity style={{ backgroundColor: '#23242A', borderRadius: 16, padding: 32, width: 320, alignItems: 'center' }} activeOpacity={1} onPress={e => e.stopPropagation()}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 12 }}>{title}</Text>
        <Text style={{ color: '#fff', fontSize: 18, marginBottom: 24 }}>This feature is coming soon!</Text>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 8, backgroundColor: '#4F8EF7', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Close</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

const TimeSigEditModal = ({ visible, value, onChange, onClose, title, min, max }: { visible: boolean; value: string; onChange: (v: string) => void; onClose: () => void; title: string; min?: number; max?: number }) => {
  const inputRef = useRef<RNTextInput>(null);
  const [temp, setTemp] = useState(value);
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
  useEffect(() => {
    if (visible) {
      setTemp(value);
      setSelection({ start: 0, end: value.length });
    }
  }, [visible, value]);
  const num = Number(temp);
  const isValid = temp.length > 0 && !isNaN(num) && (min === undefined || num >= min) && (max === undefined || num <= max);
  let error = '';
  if (temp.length === 0) error = 'Value required';
  else if (isNaN(num)) error = 'Must be a number';
  else if (min !== undefined && num < min) error = `Must be ≥ ${min}`;
  else if (max !== undefined && num > max) error = `Must be ≤ ${max}`;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={{ backgroundColor: '#23242A', borderRadius: 16, padding: 32, width: 320, alignItems: 'center' }} activeOpacity={1} onPress={e => e.stopPropagation()}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>{title}</Text>
          <RNTextInput
            ref={inputRef}
            value={temp}
            onChangeText={setTemp}
            keyboardType="number-pad"
            style={{ backgroundColor: '#181A20', color: '#fff', borderRadius: 8, padding: 12, fontSize: 28, width: 120, textAlign: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#333' }}
            selectionColor="#4F8EF7"
            autoFocus
            selection={selection}
            onSelectionChange={() => selection && setSelection(undefined)}
          />
          {error ? <Text style={{ color: '#e53935', marginBottom: 12 }}>{error}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: '#888', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, marginRight: 8 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (isValid) { onChange(temp); onClose(); } }} style={{ backgroundColor: isValid ? '#4F8EF7' : '#888', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }} disabled={!isValid}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default function MetronomeScreen() {
  const colors = AppTheme.colors;
  const [numerator, setNumerator] = useState(4);
  const [denominator, setDenominator] = useState(4);
  const [denominatorIdx, setDenominatorIdx] = useState(DENOMINATORS.indexOf(4));
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0); // 0-based
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [comingSoon, setComingSoon] = useState<null | 'Tap BPM' | 'Subdivision' | 'Sound'>(null);
  const [editTimeSig, setEditTimeSig] = useState<null | 'numerator' | 'denominator'>(null);
  const [editValue, setEditValue] = useState('');
  const [editBpm, setEditBpm] = useState(false);
  const [editBpmValue, setEditBpmValue] = useState('');

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
      {/* Tap BPM (A) */}
      <TouchableOpacity style={styles.topLeftButton} accessibilityLabel="Tap BPM" accessibilityRole="button" activeOpacity={0.8} onPress={() => setComingSoon('Tap BPM')}>
        <MaterialCommunityIcons name="gesture-tap" size={48} color={colors.icon} />
      </TouchableOpacity>
      {/* Subdivision (B) */}
      <TouchableOpacity style={styles.topRightButton} accessibilityLabel="Subdivision" accessibilityRole="button" activeOpacity={0.8} onPress={() => setComingSoon('Subdivision')}>
        <MaterialCommunityIcons name="music" size={48} color={colors.icon} />
      </TouchableOpacity>

      {/* Main vertical stack: tempo section, play button, tempo bar */}
      <View style={{ marginTop: -40 }}>
        <View style={styles.tempoContainer}>
          <View style={styles.tempoLabel}>
            <Text
              variant="displaySmall"
              style={{ color: colors.text, fontSize: 48, fontWeight: 'bold', paddingTop: 5 }}
              onPress={() => { setEditBpm(true); setEditBpmValue(String(tempo)); }}
            >
              {tempo}
            </Text>
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
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => setIsPlaying(!isPlaying)}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Stop' : 'Play'}
          activeOpacity={0.85}
        >
          <View style={{ width: vw(80), alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons
              name={isPlaying ? 'stop' : 'play'}
              size={104}
              color={colors.primary}
            />
          </View>
        </TouchableOpacity>
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
                marginHorizontal: 0,
              }}
            />
          ))}
        </View>
      </View>

      {/* Sound Button (C) */}
      <TouchableOpacity style={styles.bottomLeftButton} accessibilityLabel="Sound" accessibilityRole="button" activeOpacity={0.8} onPress={() => setComingSoon('Sound')}>
        <MaterialCommunityIcons name="volume-high" size={40} color={colors.icon} />
      </TouchableOpacity>

      {/* Time Signature Selector (moved to bottom right) */}
      <View style={styles.timeSignatureContainerAbsolute}>
        <View style={styles.chevronRow}>
          <IconButton
            icon="chevron-left"
            size={29}
            onPress={() => setNumerator(Math.max(NUMERATOR_MIN, numerator - 1))}
            disabled={numerator === NUMERATOR_MIN}
          />
          <Text
            variant="displayLarge"
            style={[styles.timeSigNumber, { fontSize: 38 }]}
            onPress={() => { setEditTimeSig('numerator'); setEditValue(String(numerator)); }}
          >
            {numerator}
          </Text>
          <IconButton
            icon="chevron-right"
            size={29}
            onPress={() => setNumerator(Math.min(NUMERATOR_MAX, numerator + 1))}
            disabled={numerator === NUMERATOR_MAX}
          />
        </View>
        <View style={[styles.horizontalBar, { width: 72, height: 2.4 }]} />
        <View style={styles.chevronRow}>
          <IconButton
            icon="chevron-left"
            size={29}
            onPress={() => {
              const newIdx = Math.max(0, denominatorIdx - 1);
              setDenominatorIdx(newIdx);
              setDenominator(DENOMINATORS[newIdx]);
            }}
            disabled={denominatorIdx === 0}
          />
          <Text
            variant="displayLarge"
            style={[styles.timeSigNumber, { fontSize: 38 }]}
            onPress={() => { setEditTimeSig('denominator'); setEditValue(String(denominator)); }}
          >
            {denominator}
          </Text>
          <IconButton
            icon="chevron-right"
            size={29}
            onPress={() => {
              const newIdx = Math.min(DENOMINATORS.length - 1, denominatorIdx + 1);
              setDenominatorIdx(newIdx);
              setDenominator(DENOMINATORS[newIdx]);
            }}
            disabled={denominatorIdx === DENOMINATORS.length - 1}
          />
        </View>
      </View>

      {/* Coming Soon Modal */}
      <ComingSoonModal visible={!!comingSoon} title={comingSoon || ''} onClose={() => setComingSoon(null)} />
      <TimeSigEditModal
        visible={!!editTimeSig}
        value={editValue}
        title={editTimeSig === 'numerator' ? 'Edit Numerator' : editTimeSig === 'denominator' ? 'Edit Denominator' : ''}
        min={editTimeSig === 'numerator' ? 1 : 1}
        max={editTimeSig === 'numerator' ? 31 : 32}
        onClose={() => setEditTimeSig(null)}
        onChange={v => {
          if (editTimeSig === 'numerator') setNumerator(Number(v));
          if (editTimeSig === 'denominator') setDenominator(Number(v));
        }}
      />
      <TimeSigEditModal
        visible={editBpm}
        value={editBpmValue}
        title={'Edit BPM'}
        min={TEMPO_MIN}
        max={TEMPO_MAX}
        onClose={() => setEditBpm(false)}
        onChange={v => setTempo(Number(v))}
      />
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
    minWidth: 48,
    textAlign: 'center',
    color: AppTheme.colors.text,
    fontSize: 38,
  },
  horizontalBar: {
    height: 2.4,
    width: 72,
    backgroundColor: AppTheme.colors.icon,
    marginVertical: 2.4,
    alignSelf: 'center',
  },
  tempoContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  tempoLabel: {
    marginTop: -40,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempoBarSegment: {
    // width and height are now dynamic
    marginTop: 20,
    borderWidth: 2,
    borderColor: AppTheme.colors.primary,
  },
  playButton: {
    marginTop: vh(1.5),
    width: '100%',
    alignSelf: 'center',
    height: vh(12),
    borderRadius: vw(2),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: vw(2),
    // inherit background
  },
  // Absolute positioned buttons / sections
  topLeftButton: {
    position: 'absolute',
    top: vh(10),
    left: vw(8),
    padding: vw(4),
    borderRadius: vw(8),
    borderWidth: 2,
    borderColor: AppTheme.colors.icon,
    backgroundColor: 'transparent',
  },
  topRightButton: {
    position: 'absolute',
    top: vh(10),
    right: vw(8),
    padding: vw(4),
    borderRadius: vw(8),
    borderWidth: 2,
    borderColor: AppTheme.colors.icon,
    backgroundColor: 'transparent',
  },
  bottomLeftButton: {
    position: 'absolute',
    bottom: vh(17),
    left: vw(8),
    padding: vw(4),
    borderRadius: vw(8),
    borderWidth: 2,
    borderColor: AppTheme.colors.icon,
    backgroundColor: 'transparent',
  },
  timeSignatureContainerAbsolute: {
    position: 'absolute',
    bottom: vh(14),
    right: vw(2),
    alignItems: 'center',
    borderRadius: 24,
    padding: 8,
  },
}); 