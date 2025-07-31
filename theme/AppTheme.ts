import { useTheme } from './ThemeContext';

export const AppTheme = {
  colors: {
    background: '#151718',
    surface: '#151718',
    text: '#ECEDEE',
    icon: '#9BA1A6',
    accent: '#BB86FC',
    orange: '#FFA726',
  },
  typography: {
    fontSize: '15px',
  },
};

export const useAppTheme = () => {
  try {
    const { getAccentColorValue } = useTheme();
    
    return {
      colors: {
        background: '#151718',
        surface: '#151718',
        primary: '#0a7ea4',
        text: '#ECEDEE',
        icon: '#9BA1A6',
        accent: getAccentColorValue(),
        orange: '#FFA726',
      },
      typography: {
        fontSize: '15px',
      },
    };
  } catch (error) {
    // Fallback if ThemeContext is not available
    return {
      colors: {
        background: '#151718',
        surface: '#151718',
        primary: '#0a7ea4',
        text: '#ECEDEE',
        icon: '#9BA1A6',
        accent: '#BB86FC',
        orange: '#FFA726',
      },
      typography: {
        fontSize: '15px',
      },
    };
  }
}; 