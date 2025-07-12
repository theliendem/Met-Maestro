import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useMetronomeSounds } from '@/hooks/useMetronomeSounds';
import { AppTheme } from '@/theme/AppTheme';
import { vh, vw } from '@/utils/responsive';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Keyboard, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Button, Snackbar, Switch } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateAudioSession, testAudioSession } from '../../utils/audioSession';
import Timer from '../../utils/timer';

// Define interfaces for better type safety
interface TimeSignature {
  numerator: number;
  denominator: number;
}

interface Measure {
  id: string;
  timeSignature: TimeSignature;
  tempo: number;
}

interface Show {
  id: string;
  name: string;
  measures: Measure[];
}

interface CondensedMeasureGroup extends Measure {
  count: number;
  startIdx: number;
  ids: string[];
}

// --- MODAL FADE ANIMATION HOOK ---
function useFadeModal(visible: boolean, duration = 180) {
  const [internalVisible, setInternalVisible] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    } else if (internalVisible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start(() => setInternalVisible(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return { internalVisible, opacity };
}

// --- MODAL RENDER HELPERS ---
type FadeModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
};
function FadeModal({ visible, onRequestClose, children }: FadeModalProps) {
  const { internalVisible, opacity } = useFadeModal(visible);
  if (!internalVisible) return null;
  const handleOverlayPress = () => {
    Keyboard.dismiss();
    onRequestClose();
  };
  return (
    <Modal visible transparent animationType="none">
      <Animated.View style={[styles.modalOverlay, { opacity }]}> 
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleOverlayPress} />
      </Animated.View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <Animated.View style={[styles.modalContent, { opacity, position: 'absolute', top: '20%', alignSelf: 'center' }]}> 
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default function ShowModeScreen() {
  // Show/measure state
  const [shows, setShows] = useState<Show[]>([
    { id: '1', name: 'Show 1', measures: [
      { id: '1', timeSignature: { numerator: 4, denominator: 4 }, tempo: 120 },
      { id: '2', timeSignature: { numerator: 3, denominator: 4 }, tempo: 100 },
    ] },
    { id: '2', name: 'Show 2', measures: [] },
  ]);
  const [selectedShow, setSelectedShow] = useState<string | null>('1');
  const [showAddMeasure, setShowAddMeasure] = useState(false);
  const [renameValue, setRenameValue] = useState<string>('');
  // Add measure popup state
  const [numMeasures, setNumMeasures] = useState<string>('1');
  const [tempo, setTempo] = useState<string>('120');
  const [numerator, setNumerator] = useState<string>('4');
  const [denominator, setDenominator] = useState<string>('4');
  const [condensedView, setCondensedView] = useState(true);
  // Refs for selecting all text on focus
  const numMeasuresRef = useRef<TextInput>(null);
  const tempoRef = useRef<TextInput>(null);
  const numeratorRef = useRef<TextInput>(null);
  const denominatorRef = useRef<TextInput>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editShowId, setEditShowId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [showImportConflict, setShowImportConflict] = useState(false);
  const [importedShow, setImportedShow] = useState<Show | null>(null);
  const [conflictShowId, setConflictShowId] = useState<string | null>(null);
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCountIn, setIsCountIn] = useState(false);
  const [currentMeasureIdx, setCurrentMeasureIdx] = useState<number>(0);
  const [currentBeat, setCurrentBeat] = useState<number>(0); // 0-based
  const timerRef = useRef<any>(null);
  // Refs to track current position during playback without causing re-renders
  const measureIdxRef = useRef<number>(0);
  const beatIdxRef   = useRef<number>(0);

  // Keep track of every Timer instance so we can fully clean them up on stop/finish
  const timersRef = useRef<any[]>([]);

  // Snapshot of initial state that we can restore after a show completes
  const initialSnapshotRef = useRef<any>(null);
  const snapshotTakenRef = useRef<boolean>(false);

  // Take the snapshot only once – after shows have loaded the very first time
  useEffect(() => {
    if (!snapshotTakenRef.current && shows.length) {
      initialSnapshotRef.current = {
        selectedShow,
        showAddMeasure,
        renameValue,
        numMeasures,
        tempo,
        numerator,
        denominator,
        condensedView,
      };
      snapshotTakenRef.current = true;
    }
  }, [shows, selectedShow, showAddMeasure, renameValue, numMeasures, tempo, numerator, denominator, condensedView]);

  // Helper to restore all snapshotted state values
  const restoreSnapshot = () => {
    const snap = initialSnapshotRef.current;
    if (!snap) return;
    setSelectedShow(snap.selectedShow);
    setShowAddMeasure(snap.showAddMeasure);
    setRenameValue(snap.renameValue);
    setNumMeasures(snap.numMeasures);
    setTempo(snap.tempo);
    setNumerator(snap.numerator);
    setDenominator(snap.denominator);
    setCondensedView(snap.condensedView);

    // Reset refs
    measureIdxRef.current = 0;
    beatIdxRef.current = 0;
  };

  // Called when a show finishes playing (natural end)
  const handleFinish = () => {
    handleStop();
    restoreSnapshot();
  };

  // Metronome sounds hook
  const { playHiClick, playLoClick } = useMetronomeSounds();

  // Configure audio session to play through silent mode
  useEffect(() => {
    activateAudioSession();
    // Test the audio session configuration
    testAudioSession();
  }, []);

  // Load shows from storage on mount
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('@metmaestro_shows');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setShows(parsed as Show[]);
          if (parsed.length > 0) {
            setSelectedShow(parsed[0].id);
          } else {
            setSelectedShow(null);
          }
        } catch (e) {
          console.error("Failed to parse shows from storage", e);
        }
      }
    })();
  }, []);

  // Save shows to storage on any change
  useEffect(() => {
    AsyncStorage.setItem('@metmaestro_shows', JSON.stringify(shows));
  }, [shows]);

  // Get current show
  const currentShow = shows.find(s => s.id === selectedShow);

  // Add measures
  const handleAddMeasures = () => {
    if (!currentShow) return;
    const newMeasures: Measure[] = [];
    for (let i = 0; i < parseInt(numMeasures || '1', 10); i++) {
      newMeasures.push({
        id: Date.now().toString() + Math.random(),
        timeSignature: { numerator: parseInt(numerator, 10), denominator: parseInt(denominator, 10) },
        tempo: parseInt(tempo, 10),
      });
    }
    setShows((prevShows) => prevShows.map((show) =>
      show.id === selectedShow
        ? { ...show, measures: [...show.measures, ...newMeasures] }
        : show
    ));
    setShowAddMeasure(false);
    setNumMeasures('1');
    setTempo('120');
    setNumerator('4');
    setDenominator('4');
  };

  // Delete measure
  const handleDeleteMeasure = (measureId: string) => {
    setShows((prevShows) => prevShows.map((show) =>
      show.id === selectedShow
        ? { ...show, measures: show.measures.filter((m: Measure) => m.id !== measureId) }
        : show
    ));
  };

  // Add new show
  const handleAddShow = () => {
    const id = Date.now().toString() + Math.random();
    const name = `Show ${shows.length + 1}`;
    setShows((prevShows) => [...prevShows, { id, name, measures: [] }]);
    setSelectedShow(id as string);
    // Show snackbar
    setSnackbarMessage(`${name} has been created!`);
    setSnackbarVisible(true);
  };

  // Delete show
  const handleDeleteShow = (id: string | null) => {
    if (!id) return;
    setShows((prevShows) => prevShows.filter((show) => show.id !== id));
    if (selectedShow === id) {
      setSelectedShow(shows.filter(s => s.id !== id)[0]?.id as string | null);
    }
  };

  // Rename show
  const handleRenameShow = (id: string | null) => {
    if (!id) return;
    setShows((prevShows) => prevShows.map((show) =>
      show.id === id ? { ...show, name: renameValue } : show
    ));
    setShowEdit(false);
  };

  // Helper: group consecutive measures by time signature and tempo
  function getCondensedMeasures(measures: Measure[]): CondensedMeasureGroup[] {
    if (!measures.length) return [];
    const groups: CondensedMeasureGroup[] = [];
    let last = measures[0];
    let count = 1;
    let startIdx = 0;
    for (let i = 1; i < measures.length; i++) {
      const m = measures[i];
      if (
        m.timeSignature.numerator === last.timeSignature.numerator &&
        m.timeSignature.denominator === last.timeSignature.denominator &&
        m.tempo === last.tempo
      ) {
        count++;
      } else {
        groups.push({ ...last, count, startIdx, ids: measures.slice(startIdx, i).map((mm: Measure) => mm.id) });
        last = m;
        count = 1;
        startIdx = i;
      }
    }
    groups.push({ ...last, count, startIdx, ids: measures.slice(startIdx).map((mm: Measure) => mm.id) });
    return groups;
  }

  // Delete all measures in a condensed group
  const handleDeleteCondensedGroup = (ids: string[]) => {
    setShows((prevShows) => prevShows.map((show) =>
      show.id === selectedShow
        ? { ...show, measures: show.measures.filter((m: Measure) => !ids.includes(m.id)) }
        : show
    ));
  };

  // Helper: Calculate beat duration (ms) for a measure
  function getBeatDuration(tempo: number, denominator: number) {
    return Math.round(60000 / (tempo * (denominator / 4)));
  }

  // Helper: For count-in, always use quarter notes
  function getCountInBeatDuration(tempo: number) {
    return Math.round(60000 / tempo);
  }

  // Start playback (count-in, then show)
  const handlePlay = () => {
    if (!currentShow || !currentShow.measures.length) return;
    
    // Ensure audio session is activated before playing
    activateAudioSession();
    
    // Always reset refs on play
    measureIdxRef.current = 0;
    beatIdxRef.current = 0;
    setIsPlaying(true);
    setIsCountIn(true);
    setCurrentMeasureIdx(0);
    setCurrentBeat(0);
    // Start count-in timer
    const tempo = currentShow.measures[0].tempo;
    const countInBeatDuration = getCountInBeatDuration(tempo);
    let countInBeat = 0;
    // Play the first count-in beat immediately (always hi click)
    playHiClick();
    if (timerRef.current) {
      timerRef.current.stop();
      timerRef.current = null;
    }
    timerRef.current = new Timer(() => {
      countInBeat++;
      setCurrentBeat(countInBeat);
      if (countInBeat < 4) {
        // Play hi click for every count-in beat
        playHiClick();
      }
      if (countInBeat === 4) {
        setIsCountIn(false);
        setCurrentBeat(-1);
        if (timerRef.current) {
          timerRef.current.stop();
          timerRef.current = null;
        }
        startShowPlayback();
      }
    }, countInBeatDuration, { immediate: false });
    // Track this timer so we can fully clean it up later
    timersRef.current.push(timerRef.current);
    timerRef.current.start();
  };

  // Start show playback using a single Timer instance that adjusts interval dynamically
  function startShowPlayback() {
    if (!currentShow || !currentShow.measures.length) return;

    // Ensure audio session is activated before playing
    activateAudioSession();

    // Calculate total number of measures at the start
    const totalMeasures = currentShow.measures.length;

    // Reset refs ONLY at the start of playback
    measureIdxRef.current = 0;
    beatIdxRef.current = 0;

    // Helper to get the active measure object
    const getActiveMeasure = () => {
      if (!currentShow || measureIdxRef.current >= currentShow.measures.length) return undefined;
      return currentShow.measures[measureIdxRef.current];
    };

    // Helper to compute beat duration for current active measure
    const computeCurrentBeatDuration = () => {
      const m = getActiveMeasure();
      return m ? getBeatDuration(m.tempo, m.timeSignature.denominator) : 0;
    };

    // --- Play first beat immediately ---
    setCurrentMeasureIdx(0);
    setCurrentBeat(0);
    playHiClick();

    // Timer callback for every subsequent beat
    const onTick = () => {
      // Guard: if timerRef.current is null, exit immediately (prevents infinite loop after stop)
      if (!timerRef.current) return;
      // If we've reached the end, stop and reset
      if (measureIdxRef.current >= totalMeasures) {
        handleFinish();
        return; // Always return immediately after handleFinish
      }
      const currMeasure = getActiveMeasure();
      if (!currMeasure) {
        handleFinish();
        return; // Always return immediately after handleFinish
      }
      const { numerator } = currMeasure.timeSignature;

      // Advance beat index
      beatIdxRef.current += 1;

      // If end of measure, move to next measure
      if (beatIdxRef.current >= numerator) {
        beatIdxRef.current = 0;
        measureIdxRef.current += 1;
        // If we've reached the end, stop and reset
        if (measureIdxRef.current >= totalMeasures) {
          handleFinish();
          return; // Always return immediately after handleFinish
        }
      }

      const newMeasure = getActiveMeasure();
      if (!newMeasure) {
        handleFinish();
        return; // Always return immediately after handleFinish
      }

      // UI updates
      setCurrentMeasureIdx(measureIdxRef.current);
      setCurrentBeat(beatIdxRef.current);

      // Play sound for this beat
      if (beatIdxRef.current === 0) {
        playHiClick();
      } else {
        playLoClick();
      }

      // Update timer interval for next beat **before** Timer schedules the next round
      const nextBeatDuration = getBeatDuration(newMeasure.tempo, newMeasure.timeSignature.denominator);
      if (timerRef.current) {
        timerRef.current.timeInterval = nextBeatDuration;
      }
    };

    // Clean any existing timer
    if (timerRef.current) {
      timerRef.current.stop();
      timerRef.current = null;
    }

    // Create and start timer for subsequent beats
    const initialDuration = computeCurrentBeatDuration();
    timerRef.current = new Timer(onTick, initialDuration, { immediate: false });
    timersRef.current.push(timerRef.current);
    timerRef.current.start();
  }

  // Stop playback
  const handleStop = () => {
    if (timerRef.current) {
      timerRef.current.stop();
      timerRef.current = null;
    }
    // Stop and clear ANY other timers that may still be running
    timersRef.current.forEach(t => {
      if (t && t.stop) t.stop();
    });
    timersRef.current.length = 0;
    setIsPlaying(false);
    setIsCountIn(false);
    setCurrentMeasureIdx(0);
    setCurrentBeat(-1); // No beat highlighted after stop
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      timerRef.current?.stop?.();
    };
  }, []);

  // UI: Tempo bar segments
  let tempoBarSegments = [];
  if (isCountIn) {
    tempoBarSegments = Array.from({ length: 4 });
  } else if (currentShow && currentShow.measures.length > 0) {
    const measure = currentShow.measures[currentMeasureIdx];
    tempoBarSegments = Array.from({ length: measure?.timeSignature.numerator || 4 });
  } else {
    tempoBarSegments = Array.from({ length: 4 });
  }

  // Dynamic circle size and gap calculation (same as metronome mode)
  const beatCount = tempoBarSegments.length;
  const minCircleSize = 18;
  const maxCircleSize = 36;
  const minGap = 2;
  const maxGap = 16;
  const circleSize =
    beatCount <= 2
      ? maxCircleSize
      : beatCount >= 15
      ? minCircleSize
      : Math.round(maxCircleSize - ((beatCount - 2) / (15 - 2)) * (maxCircleSize - minCircleSize));
  const circleGap =
    beatCount <= 2
      ? maxGap
      : beatCount >= 15
      ? minGap
      : Math.round(maxGap - ((beatCount - 2) / (15 - 2)) * (maxGap - minGap));

  // Import show from JSON file
  const handleImportShow = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
      
      let importedData: any;
      try {
        importedData = JSON.parse(fileContent);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        setSnackbarMessage('Invalid JSON file format.');
        setSnackbarVisible(true);
        return;
      }

      // Validate the imported data structure
      if (!importedData.id || !importedData.name || !Array.isArray(importedData.measures)) {
        setSnackbarMessage('Invalid show data format. File must contain id, name, and measures array.');
        setSnackbarVisible(true);
        return;
      }

      // Validate each measure has required properties
      for (const measure of importedData.measures) {
        if (!measure.id || !measure.timeSignature || !measure.tempo ||
            typeof measure.timeSignature.numerator !== 'number' ||
            typeof measure.timeSignature.denominator !== 'number' ||
            typeof measure.tempo !== 'number') {
          setSnackbarMessage('Invalid measure data format in imported file.');
          setSnackbarVisible(true);
          return;
        }
      }

      // Check for ID conflict
      const existingShow = shows.find(s => s.id === importedData.id);
      if (existingShow) {
        setImportedShow(importedData);
        setConflictShowId(importedData.id);
        setShowImportConflict(true);
        return;
      }

      // No conflict, add the show directly
      addImportedShow(importedData);
    } catch (error) {
      console.error('Import error:', error);
      setSnackbarMessage('Failed to import show. Please try again.');
      setSnackbarVisible(true);
    }
  };

  // Add imported show to the shows array
  const addImportedShow = (showData: Show) => {
    setShows((prevShows) => [...prevShows, showData]);
    setSelectedShow(showData.id);
    setSnackbarMessage(`${showData.name} has been imported!`);
    setSnackbarVisible(true);
  };

  // Handle import conflict resolution
  const handleImportConflict = (replace: boolean) => {
    if (!importedShow || !conflictShowId) return;

    if (replace) {
      // Replace existing show
      setShows((prevShows) => prevShows.map((show) =>
        show.id === conflictShowId ? importedShow : show
      ));
      setSelectedShow(importedShow.id);
      setSnackbarMessage(`${importedShow.name} has been imported and replaced the existing show.`);
    } else {
      // Import as copy with new ID
      const copiedShow = {
        ...importedShow,
        id: Date.now().toString() + Math.random(),
        name: `${importedShow.name} (Copy)`,
      };
      addImportedShow(copiedShow);
    }

    setShowImportConflict(false);
    setImportedShow(null);
    setConflictShowId(null);
  };

  // --- STATE: Add state for editing condensed group ---
  const [showEditCondensed, setShowEditCondensed] = useState(false);
  const [editCondensedGroup, setEditCondensedGroup] = useState<CondensedMeasureGroup | null>(null);

  // --- LOGIC: Handler to open edit modal for condensed group ---
  const handleEditCondensedGroup = (group: CondensedMeasureGroup) => {
    setEditCondensedGroup(group);
    setNumMeasures(group.count.toString());
    setTempo(group.tempo.toString());
    setNumerator(group.timeSignature.numerator.toString());
    setDenominator(group.timeSignature.denominator.toString());
    setShowEditCondensed(true);
  };

  // --- LOGIC: Handler to save edits to condensed group ---
  const handleSaveCondensedGroup = () => {
    if (!editCondensedGroup || !currentShow) return;
    setShows((prevShows) => prevShows.map((show) =>
      show.id === selectedShow
        ? {
            ...show,
            measures: show.measures.map((m) =>
              editCondensedGroup.ids.includes(m.id)
                ? {
                    ...m,
                    timeSignature: {
                      numerator: parseInt(numerator, 10),
                      denominator: parseInt(denominator, 10),
                    },
                    tempo: parseInt(tempo, 10),
                  }
                : m
            ),
          }
        : show
    ));
    setShowEditCondensed(false);
    setEditCondensedGroup(null);
  };

  const [showManagerBottom, setShowManagerBottom] = useState<number | null>(null);

  // Add these states near the other input states
  const [numMeasuresSelection, setNumMeasuresSelection] = useState<{start: number, end: number} | undefined>(undefined);
  const [tempoSelection, setTempoSelection] = useState<{start: number, end: number} | undefined>(undefined);
  const [numeratorSelection, setNumeratorSelection] = useState<{start: number, end: number} | undefined>(undefined);
  const [denominatorSelection, setDenominatorSelection] = useState<{start: number, end: number} | undefined>(undefined);

  // UI rendering
  const colors = AppTheme.colors;
  const insets = useSafeAreaInsets();
  return (
    <ThemedView style={styles.container}>
      {/* Count-off Banner */}
      {isCountIn && (
        <View style={styles.countOffBanner}>
          <ThemedText style={styles.countOffBannerText}>count-off</ThemedText>
        </View>
      )}
      {/* Tempo Bar (full width with dynamic sizing) */}
      <View style={styles.tempoBarRow}>
        <View style={[styles.tempoBar, { gap: circleGap }]}> 
          {tempoBarSegments.map((_, i) => (
            <View
              key={i}
              style={{
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                backgroundColor: isCountIn
                  ? (currentBeat === i ? colors.orange : colors.surface)
                  : (currentBeat === i && isPlaying ? colors.accent : colors.surface),
                borderColor: isCountIn ? colors.orange : colors.accent,
                borderWidth: 2,
                opacity: (isCountIn
                  ? (currentBeat === i && isCountIn)
                  : (currentBeat === i && isPlaying)) ? 1 : 0.4,
                marginHorizontal: 0,
              }}
            />
          ))}
        </View>
      </View>

      {/* Show Manager Row */}
      <View
        style={styles.showManagerRow}
        onLayout={e => setShowManagerBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
      >
        <ScrollView horizontal style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center' }} showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleAddShow()}>
            <IconSymbol name="plus" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleImportShow}>
            <IconSymbol name="arrow.down.doc" size={22} color="#fff" />
          </TouchableOpacity>
          {shows.map(show => (
            <View key={show.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={[styles.showChip, selectedShow === show.id && selectedShow !== null && styles.showChipActive]}
                onPress={() => setSelectedShow(show.id)}
              >
                <ThemedText>{show.name}</ThemedText>
                <TouchableOpacity style={styles.iconButtonSmall} onPress={() => { setEditShowId(show.id); setRenameValue(show.name); setShowEdit(true); }}>
                  <IconSymbol name="pencil" size={16} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Measure Manager Row (absolutely positioned) */}
      {showManagerBottom !== null && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: showManagerBottom + vh(2),
            bottom: vh(5) + vh(4) + insets.bottom,
            zIndex: 5,
            paddingHorizontal: vw(4),
          }}
          pointerEvents="box-none"
        >
          <View style={styles.measureManagerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Button
                mode="outlined"
                icon="plus"
                onPress={() => setShowAddMeasure(true)}
                style={styles.addMeasureButton}
                disabled={!currentShow}
                labelStyle={{ fontSize: styles.inputLabel.fontSize }}
              >
                {'Add Measures'}
              </Button>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ThemedText style={{ color: '#fff', marginRight: 6 }}>Condensed</ThemedText>
                  <Switch value={condensedView} onValueChange={setCondensedView} color={AppTheme.colors.accent} />
                </View>
              </View>
            </View>
            {currentShow && currentShow.measures && currentShow.measures.length > 0 ? (
              condensedView ? (
                <FlatList
                  data={getCondensedMeasures(currentShow.measures)}
                  keyExtractor={(_, idx) => idx.toString()}
                  style={styles.measureList}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.measureItem} onPress={() => handleEditCondensedGroup(item)}>
                      <ThemedText>{item.count === 1 ? '1 mes.' : `${item.count} mes.`}</ThemedText>
                      <ThemedText>{item.timeSignature.numerator}/{item.timeSignature.denominator}</ThemedText>
                      <ThemedText>{item.tempo} BPM</ThemedText>
                      <TouchableOpacity style={styles.iconButtonSmall} onPress={() => { handleDeleteCondensedGroup(item.ids); }}>
                        <IconSymbol name="trash" size={18} color="#fff" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <FlatList
                  data={currentShow.measures}
                  keyExtractor={item => item.id}
                  style={styles.measureList}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  renderItem={({ item }) => (
                    <View style={styles.measureItem}>
                      <ThemedText>{item.timeSignature.numerator}/{item.timeSignature.denominator}</ThemedText>
                      <ThemedText>{item.tempo} BPM</ThemedText>
                      <TouchableOpacity style={styles.iconButtonSmall} onPress={() => handleDeleteMeasure(item.id)}>
                        <IconSymbol name="trash" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <ThemedText>No measures in this show.</ThemedText>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Play Button at the bottom */}
      <View style={styles.playButtonContainer} pointerEvents="box-none">
        <View style={styles.playButtonShadow}>
          <View style={styles.playButtonWrapper}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={isPlaying ? handleStop : handlePlay}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Stop' : 'Play'}
              activeOpacity={0.85}
            >
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <MaterialCommunityIcons
                name={isPlaying ? 'stop' : 'play'}
                size={vw(15)}
                color="#fff"
                style={{ zIndex: 1 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add Measure Popup */}
      <FadeModal visible={showAddMeasure} onRequestClose={() => setShowAddMeasure(false)}>
        <ThemedText type="title">Add Measures</ThemedText>
        <View style={{ marginBottom: 8 }}>
          <ThemedText style={styles.inputLabel}>Number of measures</ThemedText>
          <TextInput
            ref={numMeasuresRef}
            value={numMeasures}
            onChangeText={setNumMeasures}
            style={styles.input}
            placeholderTextColor="#888"
            keyboardType="number-pad"
            selectionColor={AppTheme.colors.accent}
            selection={numMeasuresSelection}
            onFocus={() => setNumMeasuresSelection({ start: 0, end: numMeasures.length })}
            onSelectionChange={() => setNumMeasuresSelection(undefined)}
          />
        </View>
        <View style={{ marginBottom: 8 }}>
          <ThemedText style={styles.inputLabel}>Tempo (BPM)</ThemedText>
          <TextInput
            ref={tempoRef}
            value={tempo}
            onChangeText={setTempo}
            style={styles.input}
            placeholderTextColor="#888"
            keyboardType="number-pad"
            selectionColor={AppTheme.colors.accent}
            selection={tempoSelection}
            onFocus={() => setTempoSelection({ start: 0, end: tempo.length })}
            onSelectionChange={() => setTempoSelection(undefined)}
          />
        </View>
        <View style={{ flexDirection: 'column', marginBottom: 8 }}>
          <ThemedText style={styles.inputLabel}>Time Signature</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                ref={numeratorRef}
                value={numerator}
                onChangeText={setNumerator}
                style={styles.input}
                placeholderTextColor="#888"
                keyboardType="number-pad"
                selectionColor={AppTheme.colors.accent}
                selection={numeratorSelection}
                onFocus={() => setNumeratorSelection({ start: 0, end: numerator.length })}
                onSelectionChange={() => setNumeratorSelection(undefined)}
              />
            </View>
            <ThemedText type="defaultSemiBold">/</ThemedText>
            <View style={{ flex: 1 }}>
              <TextInput
                ref={denominatorRef}
                value={denominator}
                onChangeText={setDenominator}
                style={styles.input}
                placeholderTextColor="#888"
                keyboardType="number-pad"
                selectionColor={AppTheme.colors.accent}
                selection={denominatorSelection}
                onFocus={() => setDenominatorSelection({ start: 0, end: denominator.length })}
                onSelectionChange={() => setDenominatorSelection(undefined)}
              />
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Button onPress={() => setShowAddMeasure(false)} mode="text">Cancel</Button>
          <Button onPress={handleAddMeasures} mode="contained">Add</Button>
        </View>
      </FadeModal>

      {/* Edit Show Popup */}
      <FadeModal visible={showEdit} onRequestClose={() => setShowEdit(false)}>
        <ThemedText type="title">Edit Show</ThemedText>
        <ThemedText style={styles.inputLabel}>Show Name</ThemedText>
        <TextInput
          value={renameValue}
          onChangeText={setRenameValue}
          style={styles.input}
          placeholderTextColor="#888"
          keyboardType="default"
          selectionColor={AppTheme.colors.accent}
          autoFocus
          onFocus={e => e.target.setNativeProps({ selection: { start: 0, end: renameValue.length } })}
        />
        <Button mode="outlined" style={{ marginTop: 12 }} onPress={async () => {
          // Export logic
          if (!editShowId) return;
          const showToExport = shows.find(s => s.id === editShowId);
          if (!showToExport) return;
          const exportData = {
            id: showToExport.id,
            name: showToExport.name,
            measures: showToExport.measures,
          };
          const json = JSON.stringify(exportData, null, 2);
          const fileName = `metmaestro-show-${showToExport.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${showToExport.id}.json`;
          const fileUri = FileSystem.cacheDirectory + fileName;
          await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Show' });
          } else {
            alert('Sharing is not available on this device.');
          }
        }}>
          Export as File
        </Button>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 16 }}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Button onPress={() => setShowEdit(false)} mode="text">Cancel</Button>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Button onPress={() => { setConfirmDelete(true); setShowEdit(false); }} mode="contained" style={{ backgroundColor: '#e53935' }}>Delete</Button>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Button onPress={() => { handleRenameShow(editShowId); setShowEdit(false); }} mode="contained">Save</Button>
          </View>
        </View>
      </FadeModal>
      {/* Confirm Delete Popup */}
      <FadeModal visible={confirmDelete} onRequestClose={() => setConfirmDelete(false)}>
        <ThemedText type="title" style={{ color: '#e53935' }}>Delete Show?</ThemedText>
        <ThemedText>Are you sure you want to delete this show? This cannot be undone.</ThemedText>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onPress={() => setConfirmDelete(false)} mode="text">Cancel</Button>
          <Button onPress={() => {
            if (editShowId) {
              handleDeleteShow(editShowId);
              setEditShowId(null);
              setShowEdit(false);
              setConfirmDelete(false);
              // If the deleted show was selected, select another or null
              const remainingShows = shows.filter(s => s.id !== editShowId);
              setSelectedShow(remainingShows.length > 0 ? remainingShows[0].id : null);
            }
          }} mode="contained" style={{ backgroundColor: '#e53935' }}>Delete</Button>
        </View>
      </FadeModal>

      {/* Import Conflict Modal */}
      <FadeModal visible={showImportConflict} onRequestClose={() => setShowImportConflict(false)}>
        <ThemedText type="title">Import Conflict</ThemedText>
        <ThemedText>A show with the same ID already exists. Would you like to replace it or import as a copy?</ThemedText>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onPress={() => setShowImportConflict(false)} mode="text">Cancel</Button>
          <Button onPress={() => handleImportConflict(false)} mode="outlined">Import as Copy</Button>
          <Button onPress={() => handleImportConflict(true)} mode="contained">Replace</Button>
        </View>
      </FadeModal>

      {/* Add Edit Condensed Group Modal (reusing Add Measures UI, but for editing) */}
      <FadeModal visible={showEditCondensed} onRequestClose={() => { setShowEditCondensed(false); setEditCondensedGroup(null); }}>
        <ThemedText type="title">Edit Measures</ThemedText>
        <View style={{ marginBottom: 8 }}>
          <ThemedText style={styles.inputLabel}>Number of measures</ThemedText>
          <TextInput
            ref={numMeasuresRef}
            value={numMeasures}
            editable={false}
            style={[styles.input, { opacity: 0.6 }]}
            placeholderTextColor="#888"
            keyboardType="number-pad"
            selectionColor={AppTheme.colors.accent}
          />
        </View>
        <View style={{ marginBottom: 8 }}>
          <ThemedText style={styles.inputLabel}>Tempo (BPM)</ThemedText>
          <TextInput
            ref={tempoRef}
            value={tempo}
            onChangeText={setTempo}
            style={styles.input}
            placeholderTextColor="#888"
            keyboardType="number-pad"
            selectionColor={AppTheme.colors.accent}
            selection={tempoSelection}
            onFocus={() => setTempoSelection({ start: 0, end: tempo.length })}
            onSelectionChange={() => setTempoSelection(undefined)}
          />
        </View>
        <View style={{ flexDirection: 'column', marginBottom: 8 }}>
          <ThemedText style={styles.inputLabel}>Time Signature</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                ref={numeratorRef}
                value={numerator}
                onChangeText={setNumerator}
                style={styles.input}
                placeholderTextColor="#888"
                keyboardType="number-pad"
                selectionColor={AppTheme.colors.accent}
                selection={numeratorSelection}
                onFocus={() => setNumeratorSelection({ start: 0, end: numerator.length })}
                onSelectionChange={() => setNumeratorSelection(undefined)}
              />
            </View>
            <ThemedText type="defaultSemiBold">/</ThemedText>
            <View style={{ flex: 1 }}>
              <TextInput
                ref={denominatorRef}
                value={denominator}
                onChangeText={setDenominator}
                style={styles.input}
                placeholderTextColor="#888"
                keyboardType="number-pad"
                selectionColor={AppTheme.colors.accent}
                selection={denominatorSelection}
                onFocus={() => setDenominatorSelection({ start: 0, end: denominator.length })}
                onSelectionChange={() => setDenominatorSelection(undefined)}
              />
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Button onPress={() => { setShowEditCondensed(false); setEditCondensedGroup(null); }} mode="text">Cancel</Button>
          <Button onPress={handleSaveCondensedGroup} mode="contained">Save</Button>
        </View>
      </FadeModal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_MEDIUM}
        wrapperStyle={styles.snackbarWrapper}
      >
        {snackbarMessage}
      </Snackbar>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
    padding: vw(4),
    paddingTop: vh(12),
    gap: 16,
  },
  tempoBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vh(2),
    marginTop: vh(-1),
  },
  tempoBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempoDot: {
    width: vw(3.5),
    height: vw(3.5),
    borderRadius: vw(1.75),
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#555',
  },
  tempoDotActive: {
    backgroundColor: AppTheme.colors.accent,
    borderColor: AppTheme.colors.accent,
  },
  tempoDotCountInActive: {
    backgroundColor: 'orange',
    borderColor: 'orange',
  },
  playButtonWrapper: {
    width: vw(28),
    height: vw(28),
    borderRadius: vw(14),
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: vw(28),
    height: vw(28),
    borderRadius: vw(14),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    elevation: 8,
    shadowColor: AppTheme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  playButtonShadow: {
    width: vw(28),
    height: vw(28),
    borderRadius: vw(14),
    alignSelf: 'center',
    elevation: 8,
    shadowColor: AppTheme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonContainer: {
    position: 'absolute',
    bottom: vh(15),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  showManagerRow: {
    flexDirection: 'row',
    marginBottom: vh(1),
    backgroundColor: '#202127',
    borderRadius: vw(4),
    paddingHorizontal: vw(2),
    // Only horizontal padding, no vertical padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: .2,
    shadowRadius: 10,
    elevation: 8,
    minHeight: vh(9),
    alignItems: 'center',
  },
  showChip: {
    backgroundColor: '#23242A',
    borderRadius: vw(3),
    paddingHorizontal: vw(4),
    paddingVertical: vh(1),
    marginRight: vw(2),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  showChipActive: {
    backgroundColor: AppTheme.colors.accent,
  },
  iconButton: {
    backgroundColor: '#23242A',
    borderRadius: vw(4),
    padding: vw(2),
    marginRight: vw(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureManagerRow: {
    flex: 1, // Fill the absolutely positioned container
    backgroundColor: '#202127',
    borderRadius: vw(4),
    padding: vw(3),
    gap: vw(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: .2,
    shadowRadius: 10,
    elevation: 8,
  },
  addMeasureButton: {
    // Removed alignSelf and marginBottom to allow vertical centering
  },
  measureList: {
    flex: 1,
  },
  measureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#23242A',
    borderRadius: vw(3),
    padding: vw(3),
    marginBottom: vh(1),
  },
  iconButtonSmall: {
    backgroundColor: AppTheme.colors.accent,
    borderRadius: vw(3),
    padding: vw(1.5),
    marginLeft: vw(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: vh(8),
  },
  modalContent: {
    backgroundColor: '#23242A',
    borderRadius: vw(4),
    padding: vw(6),
    width: vw(80),
    gap: 16,
  },
  input: {
    backgroundColor: '#181A20',
    color: '#fff',
    borderRadius: vw(2),
    padding: vw(3),
    marginBottom: vh(1),
    borderWidth: 1,
    borderColor: '#333',
  },
  inputLabel: {
    color: '#fff',
    marginBottom: vh(0.5),
    fontSize: vw(3.5),
  },
  snackbarWrapper: {
    position: 'absolute',
    bottom: vh(15),
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  countOffBanner: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 48,
    marginTop: -24, // half of height for perfect centering
    zIndex: 100,
    backgroundColor: 'rgba(255,167,38,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countOffBannerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
}); 