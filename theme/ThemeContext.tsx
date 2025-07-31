import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type AccentColor = 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'pink' | 'darkBlue' | 'yellow' | 'gray';

interface ThemeContextType {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  getAccentColorValue: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const ACCENT_COLOR_STORAGE_KEY = 'metMaestro_accentColor';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [accentColor, setAccentColorState] = useState<AccentColor>('purple');
  const [isLoaded, setIsLoaded] = useState(false);

  const accentColorMap = {
    purple: '#BB86FC',
    blue: '#2196F3',
    green: '#4CAF50',
    orange: '#FF9800',
    red: '#F44336',
    pink: '#E91E63',
    darkBlue: '#1976D2',
    yellow: '#FFC107',
    gray: '#9E9E9E',
  };

  // Load saved accent color on app start
  useEffect(() => {
    const loadAccentColor = async () => {
      try {
        const savedColor = await AsyncStorage.getItem(ACCENT_COLOR_STORAGE_KEY);
        if (savedColor && savedColor in accentColorMap) {
          setAccentColorState(savedColor as AccentColor);
        }
      } catch (error) {
        console.error('Error loading accent color:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadAccentColor();
  }, []);

  const setAccentColor = async (color: AccentColor) => {
    try {
      await AsyncStorage.setItem(ACCENT_COLOR_STORAGE_KEY, color);
      setAccentColorState(color);
    } catch (error) {
      console.error('Error saving accent color:', error);
      // Still update the state even if saving fails
      setAccentColorState(color);
    }
  };

  const getAccentColorValue = () => {
    return accentColorMap[accentColor];
  };

  // Don't render children until the accent color is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor, getAccentColorValue }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 