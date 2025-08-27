import React, { createContext, useContext, useRef, useState } from 'react';
import { View } from 'react-native';
import SoundSystem, { SoundSystemRef } from '../components/SoundSystem';

interface SoundSystemContextType {
  soundSystemRef: React.RefObject<SoundSystemRef>;
  isInitialized: boolean;
  currentMode: 'metronome' | 'show' | 'tuner' | null;
  setCurrentMode: (mode: 'metronome' | 'show' | 'tuner' | null) => void;
  initializeSoundSystem: () => void;
}

const SoundSystemContext = createContext<SoundSystemContextType | null>(null);

export const useSoundSystem = () => {
  const context = useContext(SoundSystemContext);
  if (!context) {
    throw new Error('useSoundSystem must be used within SoundSystemProvider');
  }
  return context;
};

interface SoundSystemProviderProps {
  children: React.ReactNode;
}

export const SoundSystemProvider: React.FC<SoundSystemProviderProps> = ({ children }) => {
  const soundSystemRef = useRef<SoundSystemRef>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentMode, setCurrentMode] = useState<'metronome' | 'show' | 'tuner' | null>(null);

  const initializeSoundSystem = () => {
    if (soundSystemRef.current && !isInitialized) {
      soundSystemRef.current.initializeAudio();
      setIsInitialized(true);
      console.log('SoundSystem initialized');
    }
  };

  const value: SoundSystemContextType = {
    soundSystemRef,
    isInitialized,
    currentMode,
    setCurrentMode,
    initializeSoundSystem,
  };

  return (
    <SoundSystemContext.Provider value={value}>
      {children}
      <View style={{ display: 'none' }}>
        <SoundSystem ref={soundSystemRef} />
      </View>
    </SoundSystemContext.Provider>
  );
};
