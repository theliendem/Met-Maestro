import { ThemedView } from '@/components/ThemedView';
import WebViewShow from '@/components/WebViewShow';
import { AppTheme } from '@/theme/AppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

// Show data structure
interface Measure {
  id: string;
  timeSignature: { numerator: number; denominator: number };
  tempo: number;
  count: number; // number of measures
}

interface Show {
  id: string;
  name: string;
  measures: Measure[];
  createdAt: string;
  updatedAt: string;
}

export default function ShowModeScreen() {
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedShow, setSelectedShow] = useState<string>('');

  // Load shows from storage on component mount
  useEffect(() => {
    loadShows();
  }, []);

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

  const handleSelectShow = (showId: string) => {
    setSelectedShow(showId);
    console.log('Selected show:', showId);
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

  return (
    <ThemedView style={styles.container}>
      <WebViewShow 
        themeColors={AppTheme.colors} 
        shows={shows}
        selectedShow={selectedShow}
        onAddShow={handleAddShow}
        onSelectShow={handleSelectShow}
        onRenameShow={handleRenameShow}
        onUpdateShowMeasures={handleUpdateShowMeasures}
        onDeleteShow={handleDeleteShow}
        onMessage={async (event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'EXPORT_SHOW') {
              const show = message.showData;
              const fileName = (show.name || 'show').replace(/[^a-zA-Z0-9-_]/g, '_') + '.json';
              const fileUri = FileSystem.cacheDirectory + fileName;
              await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(show, null, 2));
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, { mimeType: 'application/json' });
              } else {
                alert('Sharing is not available on this device.');
              }
            } else if (message.type === 'IMPORT_SHOW') {
              await handleImportShow();
            }
          } catch (e) {
            console.error('Error handling WebView message:', e);
          }
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
}); 