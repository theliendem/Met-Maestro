import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSoundSystem } from '../../contexts/SoundSystemContext';
import { useAppTheme } from '../../theme/AppTheme';
import { PlaybackControls } from './PlaybackControls';
import { PlaybackOptionsModal } from './PlaybackOptionsModal';
import { ShowSelector } from './ShowSelector';
import { ShowVisualizer } from './ShowVisualizer';

/**
 * Example Show Screen using React Native UI components
 * This demonstrates how the new architecture will work for show mode
 */
export const ShowScreenExample: React.FC = () => {
  const { soundSystemRef, setCurrentMode } = useSoundSystem();
  const theme = useAppTheme();

  // Show state
  const [shows, setShows] = useState([
    {
      id: '1',
      name: 'Concert Set 1',
      measures: [
        {
          id: 'm1',
          timeSignature: { numerator: 4, denominator: 4 },
          tempo: 120,
          count: 1,
          letter: 'A'
        },
        {
          id: 'm2',
          timeSignature: { numerator: 4, denominator: 4 },
          tempo: 140,
          count: 1,
          letter: 'B'
        },
        {
          id: 'm3',
          timeSignature: { numerator: 3, denominator: 4 },
          tempo: 160,
          count: 1,
          letter: 'C'
        },
      ],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'Practice Session',
      measures: [
        {
          id: 'm4',
          timeSignature: { numerator: 4, denominator: 4 },
          tempo: 100,
          count: 1,
        },
        {
          id: 'm5',
          timeSignature: { numerator: 4, denominator: 4 },
          tempo: 120,
          count: 1,
        },
      ],
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02',
    },
  ]);

  const [selectedShowId, setSelectedShowId] = useState<string | null>('1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [showPlaybackOptions, setShowPlaybackOptions] = useState(false);

  // Playback options state
  const [playbackOptions, setPlaybackOptions] = useState({
    startType: 'beginning' as 'beginning' | 'current' | 'specific',
    startMeasure: '1',
    startLetter: '',
    endType: 'end' as 'end' | 'specific',
    endMeasure: '1',
    endLetter: '',
  });

  // Set mode when component mounts
  React.useEffect(() => {
    setCurrentMode('show');
  }, [setCurrentMode]);

  // Get selected show
  const selectedShow = selectedShowId ? shows.find(s => s.id === selectedShowId) : null;

  const handleSelectShow = (showId: string) => {
    setSelectedShowId(showId);
    const show = shows.find(s => s.id === showId);
    if (show && soundSystemRef.current) {
      soundSystemRef.current.loadShow(show);
    }
  };

  const handleAddShow = () => {
    console.log('Add new show');
    // TODO: Implement add show functionality
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Stop playback
      soundSystemRef.current?.stopShowPlayback();
      setIsPlaying(false);
      setCurrentMeasure(1);
    } else {
      // Start playback
      if (selectedShow && soundSystemRef.current) {
        soundSystemRef.current.startShowPlayback(selectedShow, playbackOptions);
        setIsPlaying(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentMeasure > 1) {
      setCurrentMeasure(currentMeasure - 1);
    }
  };

  const handleNext = () => {
    if (selectedShow && currentMeasure < selectedShow.measures.length) {
      setCurrentMeasure(currentMeasure + 1);
    }
  };

  const handleRestart = () => {
    setCurrentMeasure(1);
    if (selectedShow && soundSystemRef.current) {
      soundSystemRef.current.startShowPlayback(selectedShow, {
        ...playbackOptions,
        startType: 'specific',
        startMeasure: '1',
      });
    }
  };

  const handlePlaybackOptionsChange = (newOptions: typeof playbackOptions) => {
    setPlaybackOptions(newOptions);
  };

  const handleMeasurePress = (measureIndex: number) => {
    setCurrentMeasure(measureIndex + 1);
    // Could implement jumping to specific measure
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Show Selector */}
      <View style={styles.section}>
        <ShowSelector
          shows={shows}
          selectedShowId={selectedShowId}
          onSelectShow={handleSelectShow}
          onAddShow={handleAddShow}
        />
      </View>

      {/* Show Visualizer */}
      <View style={styles.section}>
        <ShowVisualizer
          show={selectedShow}
          currentMeasure={currentMeasure}
          onMeasurePress={handleMeasurePress}
        />
      </View>

      {/* Playback Controls */}
      <View style={styles.section}>
        <PlaybackControls
          isPlaying={isPlaying}
          currentMeasure={currentMeasure}
          totalMeasures={selectedShow?.measures.length || 0}
          onPlayPause={handlePlayPause}
          onPrevious={currentMeasure > 1 ? handlePrevious : undefined}
          onNext={selectedShow && currentMeasure < selectedShow.measures.length ? handleNext : undefined}
          onRestart={handleRestart}
          showPlaybackOptions={() => setShowPlaybackOptions(true)}
        />
      </View>

      {/* Playback Options Modal */}
      <PlaybackOptionsModal
        visible={showPlaybackOptions}
        options={playbackOptions}
        onChange={handlePlaybackOptionsChange}
        onClose={() => setShowPlaybackOptions(false)}
        totalMeasures={selectedShow?.measures.length || 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
});
