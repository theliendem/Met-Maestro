import { ThemedView } from '@/components/ThemedView';
import WebViewShow from '@/components/WebViewShow';
import { AppTheme } from '@/theme/AppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

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
        measures: [
          {
            id: '1-1',
            timeSignature: { numerator: 4, denominator: 4 },
            tempo: 120,
            count: 4
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        name: 'Show 2',
        measures: [
          {
            id: '2-1',
            timeSignature: { numerator: 3, denominator: 4 },
            tempo: 100,
            count: 2
          },
          {
            id: '2-2',
            timeSignature: { numerator: 4, denominator: 4 },
            tempo: 140,
            count: 2
          }
        ],
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
      measures: [
        {
          id: `${newShowId}-1`,
          timeSignature: { numerator: 4, denominator: 4 },
          tempo: 120,
          count: 4
        }
      ],
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