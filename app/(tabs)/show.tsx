import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Snackbar, Switch } from 'react-native-paper';

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
  const [showRename, setShowRename] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [renameValue, setRenameValue] = useState<string>('');
  const [newShowName, setNewShowName] = useState<string>('');
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

  // UI rendering
  return (
    <ThemedView style={styles.container}>
      {/* Tempo Bar & Play Button */}
      <View style={styles.tempoBarRow}>
        <View style={styles.tempoBar}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[styles.tempoDot, i === 0 && styles.tempoDotActive]} />
          ))}
        </View>
        <Button mode="contained" icon="play" style={styles.playButton}>
          Play
        </Button>
      </View>

      {/* Show Manager Row */}
      <ScrollView horizontal style={[styles.showManagerRow, { flex: 2 }]} contentContainerStyle={{ alignItems: 'center' }}>
        <TouchableOpacity style={styles.iconButton} onPress={() => {
          const id = Date.now().toString() + Math.random();
          const newShowNameGenerated = `Show ${shows.length + 1}`;
          setShows(shows => [...shows, { id, name: newShowNameGenerated, measures: [] }]);
          setSelectedShow(id);
          setSnackbarMessage(`${newShowNameGenerated} has been created!`);
          setSnackbarVisible(true);
        }}>
          <IconSymbol name="plus" size={22} color="#fff" />
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
                <View style={styles.measureItem}>
                  <ThemedText>{item.count === 1 ? '1 mes.' : `${item.count} mes.`}</ThemedText>
                  <ThemedText>{item.timeSignature.numerator}/{item.timeSignature.denominator}</ThemedText>
                  <ThemedText>{item.tempo} BPM</ThemedText>
                  <TouchableOpacity style={styles.iconButtonSmall} onPress={() => handleDeleteCondensedGroup(item.ids)}>
                    <IconSymbol name="trash" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
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
            <Button mode="outlined" style={{ marginTop: 12 }} onPress={() => {/* TODO: Export logic */}}>
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
    backgroundColor: '#181A20',
    padding: 16,
    paddingTop: 96,
    gap: 16,
  },
  tempoBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tempoBar: {
    flexDirection: 'row',
    gap: 8,
  },
  tempoDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#555',
  },
  tempoDotActive: {
    backgroundColor: '#4F8EF7',
    borderColor: '#4F8EF7',
  },
  playButton: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 2,
  },
  showManagerRow: {
    flexDirection: 'row',
    minHeight: 48,
    marginBottom: 8,
    backgroundColor: '#202127',
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  showChip: {
    backgroundColor: '#23242A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  showChipActive: {
    backgroundColor: '#4F8EF7',
  },
  iconButton: {
    backgroundColor: '#23242A',
    borderRadius: 16,
    padding: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureManagerRow: {
    flex: 1,
    backgroundColor: '#202127',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    marginBottom: 100,
  },
  addMeasureButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  measureList: {
    flex: 1,
  },
  measureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#23242A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  iconButtonSmall: {
    backgroundColor: '#4F8EF7',
    borderRadius: 12,
    padding: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 64,
  },
  modalContent: {
    backgroundColor: '#23242A',
    borderRadius: 16,
    padding: 24,
    width: 320,
    gap: 16,
  },
  input: {
    backgroundColor: '#181A20',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputLabel: {
    color: '#fff',
    marginBottom: 4,
    fontSize: 14,
  },
  snackbarWrapper: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
  },
}); 