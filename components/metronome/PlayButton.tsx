import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';

interface PlayButtonProps {
  isPlaying: boolean;
  onPress: () => void;
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  isPlaying,
  onPress,
}) => {
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isPlaying ? theme.colors.accent : 'rgba(187, 134, 252, 0.1)',
          borderColor: theme.colors.accent,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <IconSymbol
        name={isPlaying ? "pause.fill" : "play.fill"}
        size={32}
        color={theme.colors.text}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    // Add shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
