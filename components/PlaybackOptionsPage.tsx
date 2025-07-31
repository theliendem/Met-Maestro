import { AppTheme, useAppTheme } from '@/theme/AppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface Measure {
  id: string;
  timeSignature: { numerator: number; denominator: number };
  tempo: number;
  count: number;
  letter?: string;
}

interface PlaybackOptionsPageProps {
  onClose: () => void;
  currentSound?: string;
  onSoundChange?: (soundType: string) => void;
  totalMeasures?: number;
  currentShow?: {
    id: string;
    name: string;
    measures: Measure[];
    createdAt: string;
    updatedAt: string;
  };
  onPlaybackOptionsChange?: (options: {
    startType: StartEndType;
    startMeasure: string;
    startLetter: string;
    endType: StartEndType;
    endMeasure: string;
    endLetter: string;
  }) => void;
}

type StartEndType = 'beginning' | 'measure' | 'letter';

interface DropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  placeholder: string;
  style?: any;
}

const CustomDropdown: React.FC<DropdownProps> = ({ value, onValueChange, items, placeholder, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = items.find(item => item.value === value) || { label: placeholder, value: '' };
  const appTheme = useAppTheme();
  const themeColors = appTheme?.colors || AppTheme.colors;

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownButton, style]}
        onPress={() => setIsOpen(true)}
      >
        <ThemedText style={[styles.dropdownButtonText, { color: themeColors.text }]}>{selectedItem.label}</ThemedText>
        <ThemedText style={[styles.dropdownArrow, { color: themeColors.text }]}>▼</ThemedText>
      </TouchableOpacity>
      
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.dropdownModal, { backgroundColor: themeColors.surface }]}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomColor: themeColors.icon }]}
                  onPress={() => {
                    onValueChange(item.value);
                    setIsOpen(false);
                  }}
                >
                  <ThemedText style={[styles.dropdownItemText, { color: themeColors.text }]}>{item.label}</ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export const PlaybackOptionsPage: React.FC<PlaybackOptionsPageProps> = ({ 
  onClose, 
  currentSound = 'synth', 
  onSoundChange, 
  totalMeasures = 1,
  currentShow,
  onPlaybackOptionsChange
}) => {
  const appTheme = useAppTheme();
  const themeColors = appTheme?.colors || AppTheme.colors;
  
  // Start options
  const [startType, setStartType] = useState<StartEndType>('beginning');
  const [startMeasure, setStartMeasure] = useState('1');
  const [startLetter, setStartLetter] = useState('');
  
  // End options
  const [endType, setEndType] = useState<StartEndType>('beginning');
  const [endMeasure, setEndMeasure] = useState('1');
  const [endLetter, setEndLetter] = useState('');

  // Load saved playback options
  useEffect(() => {
    loadPlaybackOptions();
  }, []);

  // Save playback options whenever they change
  useEffect(() => {
    savePlaybackOptions();
  }, [startType, startMeasure, startLetter, endType, endMeasure, endLetter]);

  // Notify parent component when options change
  useEffect(() => {
    onPlaybackOptionsChange?.({
      startType,
      startMeasure,
      startLetter,
      endType,
      endMeasure,
      endLetter
    });
  }, [startType, startMeasure, startLetter, endType, endMeasure, endLetter, onPlaybackOptionsChange]);

  const loadPlaybackOptions = async () => {
    try {
      const savedOptions = await AsyncStorage.getItem('playbackOptions');
      if (savedOptions) {
        const options = JSON.parse(savedOptions);
        setStartType(options.startType || 'beginning');
        setStartMeasure(options.startMeasure || '1');
        setStartLetter(options.startLetter || '');
        setEndType(options.endType || 'beginning');
        setEndMeasure(options.endMeasure || '1');
        setEndLetter(options.endLetter || '');
      }
    } catch (error) {
      console.error('Error loading playback options:', error);
    }
  };

  const savePlaybackOptions = async () => {
    try {
      const options = {
        startType,
        startMeasure,
        startLetter,
        endType,
        endMeasure,
        endLetter
      };
      await AsyncStorage.setItem('playbackOptions', JSON.stringify(options));
    } catch (error) {
      console.error('Error saving playback options:', error);
    }
  };

  // Get unique letters from the show
  const availableLetters = React.useMemo(() => {
    if (!currentShow?.measures) return [];
    const letters = currentShow.measures
      .map(measure => measure.letter)
      .filter(letter => letter && letter.trim() !== '')
      .filter((letter, index, arr) => arr.indexOf(letter) === index); // Remove duplicates
    return letters.sort();
  }, [currentShow]);

  const validateStartMeasure = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) return '1';
    if (num >= totalMeasures) return (totalMeasures - 1).toString();
    return value;
  };

  const validateEndMeasure = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) return '1';
    if (num > totalMeasures) return totalMeasures.toString();
    return value;
  };

  const handleStartMeasureChange = (value: string) => {
    const validated = validateStartMeasure(value);
    setStartMeasure(validated);
  };

  const handleEndMeasureChange = (value: string) => {
    const validated = validateEndMeasure(value);
    setEndMeasure(validated);
  };

  const startTypeItems = [
    { label: 'Beginning', value: 'beginning' },
    { label: 'Measure', value: 'measure' },
    { label: 'Letter', value: 'letter' }
  ];

  const endTypeItems = [
    { label: 'End', value: 'beginning' },
    { label: 'Measure', value: 'measure' },
    { label: 'Letter', value: 'letter' }
  ];

  const letterItems = [
    { label: 'Select a letter...', value: '' },
    ...availableLetters.map(letter => ({ label: letter || '', value: letter || '' }))
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: themeColors.text }]}>Playback Options</ThemedText>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={[styles.settingTitle, { color: themeColors.text }]}>Playback Range</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Choose where to start and end playback
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.columnsContainer}>
            {/* Left Column - Start Options */}
            <View style={styles.column}>
              <ThemedText style={[styles.columnTitle, { color: themeColors.text }]}>Start</ThemedText>
              
              {/* Start Type Selector */}
              <View style={styles.selectorContainer}>
                <ThemedText style={[styles.inputLabel, { color: themeColors.text }]}>Start Type</ThemedText>
                <CustomDropdown
                  value={startType}
                  onValueChange={(value: string) => setStartType(value as StartEndType)}
                  items={startTypeItems}
                  placeholder="Select start type..."
                  style={[styles.dropdown, { 
                    borderColor: themeColors.accent,
                    backgroundColor: themeColors.surface
                  }]}
                />
              </View>
              
              {/* Dynamic Start Input */}
              {startType === 'measure' && (
                <View style={styles.inputContainer}>
                  <ThemedText style={[styles.inputLabel, { color: themeColors.text }]}>Measure Number</ThemedText>
                  <TextInput
                    style={[styles.input, { 
                      color: themeColors.text, 
                      borderColor: themeColors.accent,
                      backgroundColor: themeColors.surface
                    }]}
                    value={startMeasure}
                    onChangeText={handleStartMeasureChange}
                    keyboardType="numeric"
                    selectTextOnFocus={true}
                  />
                </View>
              )}
              
              {startType === 'letter' && (
                <View style={styles.inputContainer}>
                  <ThemedText style={[styles.inputLabel, { color: themeColors.text }]}>Letter</ThemedText>
                  <CustomDropdown
                    value={startLetter}
                    onValueChange={(value: string) => setStartLetter(value)}
                    items={letterItems}
                    placeholder="Select a letter..."
                    style={[styles.dropdown, { 
                      borderColor: themeColors.accent,
                      backgroundColor: themeColors.surface
                    }]}
                  />
                </View>
              )}
            </View>
            
            {/* Right Column - End Options */}
            <View style={styles.column}>
              <ThemedText style={[styles.columnTitle, { color: themeColors.text }]}>End</ThemedText>
              
              {/* End Type Selector */}
              <View style={styles.selectorContainer}>
                <ThemedText style={[styles.inputLabel, { color: themeColors.text }]}>End Type</ThemedText>
                <CustomDropdown
                  value={endType}
                  onValueChange={(value: string) => setEndType(value as StartEndType)}
                  items={endTypeItems}
                  placeholder="Select end type..."
                  style={[styles.dropdown, { 
                    borderColor: themeColors.accent,
                    backgroundColor: themeColors.surface
                  }]}
                />
              </View>
              
              {/* Dynamic End Input */}
              {endType === 'measure' && (
                <View style={styles.inputContainer}>
                  <ThemedText style={[styles.inputLabel, { color: themeColors.text }]}>Measure Number</ThemedText>
                  <TextInput
                    style={[styles.input, { 
                      color: themeColors.text, 
                      borderColor: themeColors.accent,
                      backgroundColor: themeColors.surface
                    }]}
                    value={endMeasure}
                    onChangeText={handleEndMeasureChange}
                    keyboardType="numeric"
                    selectTextOnFocus={true}
                  />
                </View>
              )}
              
              {endType === 'letter' && (
                <View style={styles.inputContainer}>
                  <ThemedText style={[styles.inputLabel, { color: themeColors.text }]}>Letter</ThemedText>
                  <CustomDropdown
                    value={endLetter}
                    onValueChange={(value: string) => setEndLetter(value)}
                    items={letterItems}
                    placeholder="Select a letter..."
                    style={[styles.dropdown, { 
                      borderColor: themeColors.accent,
                      backgroundColor: themeColors.surface
                    }]}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  settingRow: {
    marginBottom: 15,
  },
  settingInfo: {
    marginBottom: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  selectorContainer: {
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    width: '100%',
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: 200,
    width: '80%',
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
  },
}); 