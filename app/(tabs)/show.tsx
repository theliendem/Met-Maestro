import { SettingsButton } from '@/components/SettingsButton';
import { SettingsModal } from '@/components/SettingsModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AppTheme } from '@/theme/AppTheme';
import { vh, vw } from '@/utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Snackbar, Switch } from 'react-native-paper';
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
  }, [shows, selectedShow]);

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

  // Audio players
  const hiPlayer = useAudioPlayer(require('@/assets/sounds/click_hi.wav'));
  const loPlayer = useAudioPlayer(require('@/assets/sounds/click_lo.wav'));

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
    hiPlayer.seekTo(0);
    setTimeout(() => hiPlayer.play(), 1);
    if (timerRef.current) {
      timerRef.current.stop();
      timerRef.current = null;
    }
    timerRef.current = new Timer(() => {
      countInBeat++;
      setCurrentBeat(countInBeat);
      if (countInBeat < 4) {
        // Play hi click for every count-in beat
        hiPlayer.seekTo(0);
        setTimeout(() => hiPlayer.play(), 1);
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
    hiPlayer.seekTo(0);
    setTimeout(() => hiPlayer.play(), 1);

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
        hiPlayer.seekTo(0);
        setTimeout(() => hiPlayer.play(), 1);
      } else {
        loPlayer.seekTo(0);
        setTimeout(() => loPlayer.play(), 1);
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

  const [settingsVisible, setSettingsVisible] = useState(false);

  // UI rendering
  return (
    <ThemedView style={styles.container}>
      {/* Settings gear */}
      <SettingsButton onPress={() => setSettingsVisible(true)} />
      {/* Settings Modal */}
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      {/* Tempo Bar & Play Button */}
      <View style={styles.tempoBarRow}>
        <View style={styles.tempoBar}>
          {tempoBarSegments.map((_, i) => (
            <View
              key={i}
              style={[
                styles.tempoDot,
                (isCountIn
                  ? (currentBeat === i && isCountIn)
                  : (currentBeat === i && isPlaying)) && styles.tempoDotActive,
                isCountIn && (currentBeat === i && styles.tempoDotCountInActive),
              ]}
            />
          ))}
        </View>
        <Button
          mode="contained"
          icon={isPlaying ? 'stop' : 'play'}
          style={styles.playButton}
          onPress={isPlaying ? handleStop : handlePlay}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </Button>
      </View>

      {/* Show Manager Row */}
      <ScrollView horizontal style={[styles.showManagerRow, { flex: 2 }]} contentContainerStyle={{ alignItems: 'center' }}>
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
              <TouchableOpacity style={styles.iconButtonSmall} onPress={(e) => { e.stopPropagation(); setEditShowId(show.id); setRenameValue(show.name); setShowEdit(true); }}>
                <IconSymbol name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Measure Manager Row */}
      <View style={[styles.measureManagerRow, { flex: 8 }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Button mode="outlined" icon="plus" onPress={() => setShowAddMeasure(true)} style={styles.addMeasureButton} disabled={!currentShow}>
            Add Measures
          </Button>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
            <ThemedText style={{ color: '#fff', marginRight: 6 }}>Condensed</ThemedText>
            <Switch value={condensedView} onValueChange={setCondensedView} color="#4F8EF7" />
          </View>
        </View>
        {currentShow && currentShow.measures.length > 0 ? (
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
                  <TouchableOpacity style={styles.iconButtonSmall} onPress={(e) => { e.stopPropagation(); handleDeleteCondensedGroup(item.ids); }}>
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

      {/* Add Measure Popup */}
      <Modal visible={showAddMeasure} transparent animationType="none">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddMeasure(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={e => e.stopPropagation()}>
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
                onFocus={e => numMeasuresRef.current && numMeasuresRef.current.setNativeProps({ selection: { start: 0, end: numMeasures.length } })}
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
                onFocus={e => tempoRef.current && tempoRef.current.setNativeProps({ selection: { start: 0, end: tempo.length } })}
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
                    onFocus={e => numeratorRef.current && numeratorRef.current.setNativeProps({ selection: { start: 0, end: numerator.length } })}
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
                    onFocus={e => denominatorRef.current && denominatorRef.current.setNativeProps({ selection: { start: 0, end: denominator.length } })}
                  />
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button onPress={() => setShowAddMeasure(false)} mode="text">Cancel</Button>
              <Button onPress={handleAddMeasures} mode="contained">Add</Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Show Popup */}
      <Modal visible={showEdit} transparent animationType="none">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEdit(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={e => e.stopPropagation()}>
            <ThemedText type="title">Edit Show</ThemedText>
            <ThemedText style={styles.inputLabel}>Show Name</ThemedText>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              style={styles.input}
              placeholderTextColor="#888"
              keyboardType="default"
              autoFocus
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
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button onPress={() => setShowEdit(false)} mode="text">Cancel</Button>
              <Button onPress={() => { setConfirmDelete(true); setShowEdit(false); }} mode="contained" style={{ backgroundColor: '#e53935' }}>Delete</Button>
              <Button onPress={() => { handleRenameShow(editShowId); setShowEdit(false); }} mode="contained">Save</Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      {/* Confirm Delete Popup */}
      <Modal visible={confirmDelete} transparent animationType="none">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setConfirmDelete(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={e => e.stopPropagation()}>
            <ThemedText type="title" style={{ color: '#e53935' }}>Delete Show?</ThemedText>
            <ThemedText>Are you sure you want to delete this show? This cannot be undone.</ThemedText>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button onPress={() => setConfirmDelete(false)} mode="text">Cancel</Button>
              <Button onPress={() => { handleDeleteShow(editShowId); setConfirmDelete(false); setShowEdit(false); }} mode="contained" style={{ backgroundColor: '#e53935' }}>Delete</Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Import Conflict Modal */}
      <Modal visible={showImportConflict} transparent animationType="none">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowImportConflict(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={e => e.stopPropagation()}>
            <ThemedText type="title">Import Conflict</ThemedText>
            <ThemedText>A show with the same ID already exists. Would you like to replace it or import as a copy?</ThemedText>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button onPress={() => setShowImportConflict(false)} mode="text">Cancel</Button>
              <Button onPress={() => handleImportConflict(false)} mode="outlined">Import as Copy</Button>
              <Button onPress={() => handleImportConflict(true)} mode="contained">Replace</Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Add Edit Condensed Group Modal (reusing Add Measures UI, but for editing) */}
      <Modal visible={showEditCondensed} transparent animationType="none">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setShowEditCondensed(false); setEditCondensedGroup(null); }}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={e => e.stopPropagation()}>
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
                onFocus={e => tempoRef.current && tempoRef.current.setNativeProps({ selection: { start: 0, end: tempo.length } })}
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
                    onFocus={e => numeratorRef.current && numeratorRef.current.setNativeProps({ selection: { start: 0, end: numerator.length } })}
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
                    onFocus={e => denominatorRef.current && denominatorRef.current.setNativeProps({ selection: { start: 0, end: denominator.length } })}
                  />
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button onPress={() => { setShowEditCondensed(false); setEditCondensedGroup(null); }} mode="text">Cancel</Button>
              <Button onPress={handleSaveCondensedGroup} mode="contained">Save</Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
    marginBottom: vh(1),
  },
  tempoBar: {
    flexDirection: 'row',
    gap: vw(2),
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
    backgroundColor: '#4F8EF7',
    borderColor: '#4F8EF7',
  },
  tempoDotCountInActive: {
    backgroundColor: 'orange',
    borderColor: 'orange',
  },
  playButton: {
    borderRadius: vw(6),
    paddingHorizontal: vw(4.5),
    paddingVertical: vh(0.3),
  },
  showManagerRow: {
    flexDirection: 'row',
    minHeight: vh(6),
    marginBottom: vh(1),
    backgroundColor: '#202127',
    borderRadius: vw(4),
    paddingHorizontal: vw(2),
  },
  showChip: {
    backgroundColor: '#23242A',
    borderRadius: vw(4),
    paddingHorizontal: vw(4),
    paddingVertical: vh(1),
    marginRight: vw(2),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  showChipActive: {
    backgroundColor: '#4F8EF7',
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
    flex: 1,
    backgroundColor: '#202127',
    borderRadius: vw(4),
    padding: vw(3),
    gap: vw(3),
    marginBottom: vh(13),
  },
  addMeasureButton: {
    alignSelf: 'flex-start',
    marginBottom: vh(1),
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
    backgroundColor: '#4F8EF7',
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
}); 