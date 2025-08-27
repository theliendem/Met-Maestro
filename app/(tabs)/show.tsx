import { SettingsModal } from '@/components/SettingsModal';
import { SettingsPage } from '@/components/SettingsPage';
import { ThemedView } from '@/components/ThemedView';
import { PlaybackControls } from '@/components/show/PlaybackControls';
import { PlaybackOptionsModal } from '@/components/show/PlaybackOptionsModal';
import { ShowSelector } from '@/components/show/ShowSelector';
import { ShowVisualizer } from '@/components/show/ShowVisualizer';
import { useSoundSystem } from '@/contexts/SoundSystemContext';
import { useAppTheme } from '@/theme/AppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

// Show data structure
interface Measure {
  id: string;
  timeSignature: { numerator: number; denominator: number };
  tempo: number;
  count: number; // number of measures
  letter?: string; // optional letter to signify different parts of the show
}

interface Show {
  id: string;
  name: string;
  measures: Measure[];
  createdAt: string;
  updatedAt: string;
}

export default function ShowModeScreen() {
  const { soundSystemRef, setCurrentMode } = useSoundSystem();
  const themeColors = useAppTheme().colors;
  const theme = useAppTheme();

  const [shows, setShows] = useState<Show[]>([]);
  const [selectedShow, setSelectedShow] = useState<string>('');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [playbackOptionsVisible, setPlaybackOptionsVisible] = useState(false);
  const [currentSound, setCurrentSound] = useState('synth');

  // Show playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState(1);

  // Playback options state
  const [playbackOptions, setPlaybackOptions] = useState({
    startType: 'beginning' as 'beginning' | 'current' | 'specific',
    startMeasure: '1',
    startLetter: '',
    endType: 'end' as 'end' | 'specific',
    endMeasure: '1',
    endLetter: '',
  });

  // Load shows from storage on component mount
  useEffect(() => {
    loadShows();
    loadSoundType();
  }, []);

  // Set mode when component mounts and handle focus/blur
  useFocusEffect(
    React.useCallback(() => {
      console.log('Show screen focused');
      setCurrentMode('show');

      return () => {
        console.log('Navigating away from show screen - stopping playback');
        if (soundSystemRef.current && isPlaying) {
          soundSystemRef.current.stopShowPlayback();
          setIsPlaying(false);
          setCurrentMeasure(1);
        }
      };
    }, [setCurrentMode, soundSystemRef, isPlaying])
  );

  const loadShows = async () => {
    try {
      const showsData = await AsyncStorage.getItem('metMaestro_shows');
      if (showsData) {
        const parsedShows = JSON.parse(showsData);
        setShows(parsedShows);
        // Select the first show if available
        if (parsedShows.length > 0 && !selectedShow) {
          setSelectedShow(parsedShows[0].id);
        }
        console.log('Loaded shows:', parsedShows);
      } else {
        // Create default shows if none exist
        const defaultShows = createDefaultShows();
        setShows(defaultShows);
        setSelectedShow(defaultShows[0].id);
        await saveShows(defaultShows);
        console.log('Created default shows:', defaultShows);
      }
    } catch (error) {
      console.error('Error loading shows:', error);
    }
  };

  const loadSoundType = async () => {
    try {
      const savedSound = await AsyncStorage.getItem('metMaestro_soundType');
      if (savedSound) {
        setCurrentSound(savedSound);
        console.log('Loaded sound type:', savedSound);
      }
    } catch (error) {
      console.error('Error loading sound type:', error);
    }
  };

  const createDefaultShows = (): Show[] => {
    const now = new Date().toISOString();
    return [
      {
        id: '1',
        name: 'Show 1',
        measures: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        name: 'Show 2',
        measures: [],
        createdAt: now,
        updatedAt: now
      }
    ];
  };

  const saveShows = async (showsToSave: Show[]) => {
    try {
      await AsyncStorage.setItem('metMaestro_shows', JSON.stringify(showsToSave));
      console.log('Saved shows to storage');
    } catch (error) {
      console.error('Error saving shows:', error);
    }
  };

  const handleAddShow = async () => {
    const newShowId = (shows.length + 1).toString();
    const now = new Date().toISOString();
    const newShow: Show = {
      id: newShowId,
      name: `Show ${newShowId}`,
      measures: [],
      createdAt: now,
      updatedAt: now
    };
    
    const updatedShows = [...shows, newShow];
    setShows(updatedShows);
    setSelectedShow(newShowId);
    await saveShows(updatedShows);
    console.log('Added new show:', newShow);
  };



  const handleRenameShow = async (showId: string, newName: string) => {
    console.log('handleRenameShow called with:', showId, newName);
    const updatedShows = shows.map(show => 
      show.id === showId 
        ? { ...show, name: newName, updatedAt: new Date().toISOString() }
        : show
    );
    console.log('Updated shows:', updatedShows);
    setShows(updatedShows);
    await saveShows(updatedShows);
    console.log('Renamed show:', showId, 'to:', newName);
  };

  const handleUpdateShowMeasures = async (showId: string, measures: Measure[]) => {
    const updatedShows = shows.map(show => 
      show.id === showId 
        ? { ...show, measures, updatedAt: new Date().toISOString() }
        : show
    );
    setShows(updatedShows);
    await saveShows(updatedShows);
    console.log('Updated measures for show:', showId);
  };

  const handleDeleteShow = async (showId: string) => {
    const updatedShows = shows.filter(show => show.id !== showId);
    setShows(updatedShows);
    if (selectedShow === showId && updatedShows.length > 0) {
      setSelectedShow(updatedShows[0].id);
    }
    await saveShows(updatedShows);
    console.log('Deleted show:', showId);
  };

  const handleImportShow = async () => {
    try {
      // Pick a JSON file - try with specific MIME type first
      let result;
      try {
        result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });
      } catch (error) {
        result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
      }

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      // Parse and validate the JSON
      let importedShow: Show;
      try {
        const parsedData = JSON.parse(fileContent);
        
        // Validate the show structure
        if (!parsedData.name || !Array.isArray(parsedData.measures)) {
          throw new Error('Invalid show format: missing name or measures array');
        }

        // Validate each measure
        for (const measure of parsedData.measures) {
          if (!measure.id || 
              !measure.timeSignature || 
              typeof measure.timeSignature.numerator !== 'number' ||
              typeof measure.timeSignature.denominator !== 'number' ||
              typeof measure.tempo !== 'number') {
            throw new Error('Invalid measure format in imported show');
          }
          // Add count property if missing (default to 1)
          if (typeof measure.count !== 'number') {
            measure.count = 1;
          }
        }

        importedShow = {
          id: (shows.length + 1).toString(),
          name: parsedData.name,
          measures: parsedData.measures,
          createdAt: parsedData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

      } catch (parseError) {
        console.error('Error parsing imported file:', parseError);
        Alert.alert(
          'Import Error',
          'The selected file is not a valid Met Maestro show file. Please make sure it\'s a JSON file exported from this app.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check for name conflicts
      const existingShow = shows.find(show => show.name === importedShow.name);
      if (existingShow) {
        Alert.alert(
          'Show Name Conflict',
          `A show named "${importedShow.name}" already exists. Would you like to import it as a copy?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Import as Copy', 
              onPress: () => {
                importedShow.name = `${importedShow.name} (Copy)`;
                addImportedShow(importedShow);
              }
            }
          ]
        );
        return;
      }

      // Add the imported show
      addImportedShow(importedShow);

    } catch (error) {
      console.error('Error importing show:', error);
      Alert.alert(
        'Import Error',
        'Failed to import the show. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const addImportedShow = async (importedShow: Show) => {
    const updatedShows = [...shows, importedShow];
    setShows(updatedShows);
    setSelectedShow(importedShow.id);
    await saveShows(updatedShows);
    Alert.alert(
      'Import Successful',
      `Show "${importedShow.name}" has been imported successfully.`,
      [{ text: 'OK' }]
    );
  };

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', message);

      switch (message.type) {
        case 'SELECT_SHOW':
          setSelectedShow(message.showId);
          break;
        case 'ADD_SHOW':
          handleAddShow();
          break;
        case 'RENAME_SHOW':
          handleRenameShow(message.showId, message.newName);
          break;
        case 'UPDATE_SHOW_MEASURES':
          handleUpdateShowMeasures(message.showId, message.measures);
          break;
        case 'DELETE_SHOW':
          handleDeleteShow(message.showId);
          break;
        case 'MEASURE_COMPLETED':
          console.log('Measure completed:', message);
          break;
        case 'OPEN_SETTINGS':
          console.log('Opening settings...');
          openSettings();
          break;
        case 'OPEN_PLAYBACK_OPTIONS':
          console.log('Received OPEN_PLAYBACK_OPTIONS message');
          openPlaybackOptions();
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };

  const openSettings = () => {
    setSettingsVisible(true);
  };

  const closeSettings = () => {
    setSettingsVisible(false);
  };

  const openPlaybackOptions = () => {
    console.log('Opening playback options modal...');
    console.log('Current playbackOptionsVisible:', playbackOptionsVisible);
    setPlaybackOptionsVisible(true);
    console.log('Set playbackOptionsVisible to true');
  };

  const closePlaybackOptions = () => {
    setPlaybackOptionsVisible(false);
  };

  const handlePlaybackOptionsChange = (options: {
    startType: 'beginning' | 'measure' | 'letter';
    startMeasure: string;
    startLetter: string;
    endType: 'beginning' | 'measure' | 'letter';
    endMeasure: string;
    endLetter: string;
  }) => {
    // Update the WebView with new playback options
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.updatePlaybackOptions) {
          window.updatePlaybackOptions(${JSON.stringify(options)});
        }
      `);
    }
  };

  const handleSoundChange = async (soundType: string) => {
    try {
      await AsyncStorage.setItem('metMaestro_soundType', soundType);
      setCurrentSound(soundType);
      console.log('Saved sound type:', soundType);

      // Update SoundSystem sound dynamically
      if (soundSystemRef.current) {
        soundSystemRef.current.updateSound(soundType);
      }
    } catch (error) {
      console.error('Error saving sound type:', error);
      // Still update the state even if saving fails
      setCurrentSound(soundType);

      // Update SoundSystem sound even if saving failed
      if (soundSystemRef.current) {
        soundSystemRef.current.updateSound(soundType);
      }
    }
  };

  // Show control handlers
  const handleSelectShow = (showId: string) => {
    setSelectedShow(showId);
    const show = shows.find(s => s.id === showId);
    if (show && soundSystemRef.current) {
      soundSystemRef.current.loadShow(show);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Stop playback
      soundSystemRef.current?.stopShowPlayback();
      setIsPlaying(false);
      setCurrentMeasure(1);
    } else {
      // Start playback
      const show = shows.find(s => s.id === selectedShow);
      if (show && soundSystemRef.current) {
        soundSystemRef.current.startShowPlayback(show, playbackOptions);
        setIsPlaying(true);
      }
    }
  };



  const selectedShowData = selectedShow ? shows.find(s => s.id === selectedShow) : null;

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Show Selector */}
      <ShowSelector
        shows={shows}
        selectedShowId={selectedShow}
        onSelectShow={handleSelectShow}
        onAddShow={handleAddShow}
        onRenameShow={handleRenameShow}
        onDeleteShow={handleDeleteShow}
      />

      {/* Show Visualizer */}
      <ShowVisualizer
        show={selectedShowData}
        currentMeasure={currentMeasure}
      />

      {/* Playback Controls */}
      <PlaybackControls
        isPlaying={isPlaying}
        currentMeasure={currentMeasure}
        totalMeasures={selectedShowData?.measures.length || 0}
        onPlayPause={handlePlayPause}
        onPrevious={currentMeasure > 1 ? () => setCurrentMeasure(currentMeasure - 1) : undefined}
        onNext={selectedShowData && currentMeasure < selectedShowData.measures.length ? () => setCurrentMeasure(currentMeasure + 1) : undefined}
        onRestart={() => setCurrentMeasure(1)}
        showPlaybackOptions={() => setPlaybackOptionsVisible(true)}
      />

      {/* Playback Options Modal */}
      <PlaybackOptionsModal
        visible={playbackOptionsVisible}
        options={playbackOptions}
        onChange={handlePlaybackOptionsChange}
        onClose={() => setPlaybackOptionsVisible(false)}
        totalMeasures={selectedShowData?.measures.length || 0}
      />

      <SettingsModal visible={settingsVisible} onClose={closeSettings}>
        <SettingsPage
          onClose={closeSettings}
          currentSound={currentSound}
          onSoundChange={handleSoundChange}
        />
      </SettingsModal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 