import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Switch } from 'react-native-paper';

export default function ShowModeScreen() {
  // Show/measure state
  const [shows, setShows] = useState([
    { id: '1', name: 'Show 1', measures: [
      { id: '1', timeSignature: { numerator: 4, denominator: 4 }, tempo: 120 },
      { id: '2', timeSignature: { numerator: 3, denominator: 4 }, tempo: 100 },
    ] },
    { id: '2', name: 'Show 2', measures: [] },
  ]);
  const [selectedShow, setSelectedShow] = useState('1');
  const [showAddMeasure, setShowAddMeasure] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [newShowName, setNewShowName] = useState('');
  // Add measure popup state
  const [numMeasures, setNumMeasures] = useState('1');
  const [tempo, setTempo] = useState('120');
  const [numerator, setNumerator] = useState('4');
  const [denominator, setDenominator] = useState('4');
  const [condensedView, setCondensedView] = useState(true);
  // Refs for selecting all text on focus
  const numMeasuresRef = useRef(null);
  const tempoRef = useRef(null);
  const numeratorRef = useRef(null);
  const denominatorRef = useRef(null);

  // Load shows from storage on mount
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('@metmaestro_shows');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setShows(parsed);
        } catch {}
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
    const newMeasures = [];
    for (let i = 0; i < parseInt(numMeasures || '1', 10); i++) {
      newMeasures.push({
        id: Date.now().toString() + Math.random(),
        timeSignature: { numerator: parseInt(numerator, 10), denominator: parseInt(denominator, 10) },
        tempo: parseInt(tempo, 10),
      });
    }
    setShows(shows => shows.map(show =>
      show.id === selectedShow
        ? { ...show, measures: [...show.measures, ...newMeasures] }
        : show
    ));
    setShowAddMeasure(false);
  };

  // Delete measure
  const handleDeleteMeasure = (measureId) => {
    setShows(shows => shows.map(show =>
      show.id === selectedShow
        ? { ...show, measures: show.measures.filter(m => m.id !== measureId) }
        : show
    ));
  };

  // Add new show
  const handleAddShow = () => {
    const id = Date.now().toString() + Math.random();
    setShows(shows => [...shows, { id, name: newShowName || `Show ${shows.length + 1}`, measures: [] }]);
    setSelectedShow(id);
    setShowNew(false);
    setNewShowName('');
  };

  // Delete show
  const handleDeleteShow = (id) => {
    setShows(shows => shows.filter(show => show.id !== id));
    if (selectedShow === id) setSelectedShow(null);
  };

  // Rename show
  const handleRenameShow = () => {
    setShows(shows => shows.map(show =>
      show.id === selectedShow ? { ...show, name: renameValue } : show
    ));
    setShowRename(false);
  };

  // Helper: group consecutive measures by time signature and tempo
  function getCondensedMeasures(measures) {
    if (!measures.length) return [];
    const groups = [];
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
        groups.push({ ...last, count, startIdx, ids: measures.slice(startIdx, i).map(mm => mm.id) });
        last = m;
        count = 1;
        startIdx = i;
      }
    }
    groups.push({ ...last, count, startIdx, ids: measures.slice(startIdx).map(mm => mm.id) });
    return groups;
  }

  // Delete all measures in a condensed group
  const handleDeleteCondensedGroup = (ids) => {
    setShows(shows => shows.map(show =>
      show.id === selectedShow
        ? { ...show, measures: show.measures.filter(m => !ids.includes(m.id)) }
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
        {shows.map(show => (
          <TouchableOpacity
            key={show.id}
            style={[styles.showChip, selectedShow === show.id && styles.showChipActive]}
            onPress={() => setSelectedShow(show.id)}
          >
            <ThemedText>{show.name}</ThemedText>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowNew(true)}>
          <IconSymbol name="plus" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowRename(true)} disabled={!currentShow}>
          <IconSymbol name="pencil" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => currentShow && handleDeleteShow(currentShow.id)} disabled={!currentShow}>
          <IconSymbol name="trash" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <IconSymbol name="square.and.arrow.up" size={22} color="#fff" />
        </TouchableOpacity>
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
      <Modal visible={showAddMeasure} transparent animationType="fade">
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

      {/* Rename Show Popup */}
      <Modal visible={showRename} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRename(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={e => e.stopPropagation()}>
            <ThemedText type="title">Rename Show</ThemedText>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              style={styles.input}
              placeholderTextColor="#888"
              keyboardType="default"
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button onPress={() => setShowRename(false)} mode="text">Cancel</Button>
              <Button onPress={handleRenameShow} mode="contained">Rename</Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* New Show Popup */}
      <Modal visible={showNew} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNew(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={e => e.stopPropagation()}>
            <ThemedText type="title">New Show</ThemedText>
            <TextInput
              value={newShowName}
              onChangeText={setNewShowName}
              style={styles.input}
              placeholder="Show name"
              placeholderTextColor="#888"
              keyboardType="default"
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button onPress={() => setShowNew(false)} mode="text">Cancel</Button>
              <Button onPress={handleAddShow} mode="contained">Create</Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
}); 