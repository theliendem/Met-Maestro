import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSoundSystem } from '../../contexts/SoundSystemContext';
import { useAppTheme } from '../../theme/AppTheme';
import { TunerDisplay } from './TunerDisplay';

/**
 * Example Tuner Screen using React Native UI components
 * This demonstrates how the new architecture will work for tuner mode
 */
export const TunerScreenExample: React.FC = () => {
  const { soundSystemRef, setCurrentMode } = useSoundSystem();
  const theme = useAppTheme();

  // Tuner state
  const [note, setNote] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [cents, setCents] = useState<number | null>(null);
  const [referencePitch, setReferencePitch] = useState(440);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('granted');

  // Set mode when component mounts
  React.useEffect(() => {
    setCurrentMode('tuner');
    // Start tuner if permission is granted
    if (permissionStatus === 'granted' && soundSystemRef.current) {
      soundSystemRef.current.startTuner(referencePitch);
    }
  }, [setCurrentMode, permissionStatus, referencePitch, soundSystemRef]);

  // Handle tuner data updates (in real implementation, this would come from SoundSystem events)
  React.useEffect(() => {
    // Simulate tuner data updates for demo purposes
    const interval = setInterval(() => {
      if (permissionStatus === 'granted') {
        // Simulate detecting different notes
        const notes = ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4'];
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        const baseFreq = 440; // A4 frequency
        const randomFreq = baseFreq + (Math.random() - 0.5) * 20;
        const randomCents = (Math.random() - 0.5) * 100;

        setNote(randomNote);
        setFrequency(randomFreq);
        setCents(randomCents);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [permissionStatus]);

  const handleRequestPermission = () => {
    // Simulate permission request
    setPermissionStatus('granted');
    if (soundSystemRef.current) {
      soundSystemRef.current.startTuner(referencePitch);
    }
  };

  const handleReferencePitchChange = (newPitch: number) => {
    setReferencePitch(newPitch);
    if (permissionStatus === 'granted' && soundSystemRef.current) {
      soundSystemRef.current.updateTunerSettings({ referencePitch: newPitch });
    }
  };

  const handleOpenSettings = () => {
    console.log('Open app settings');
    // TODO: Implement navigation to app settings
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TunerDisplay
        note={note}
        frequency={frequency}
        cents={cents}
        referencePitch={referencePitch}
        permissionStatus={permissionStatus}
        onRequestPermission={handleRequestPermission}
        onReferencePitchChange={handleReferencePitchChange}
        onOpenSettings={handleOpenSettings}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
