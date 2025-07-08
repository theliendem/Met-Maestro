import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

interface SettingsButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ onPress, style }) => (
  <Pressable
    style={[styles.settingsBtn, style]}
    hitSlop={16}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel="Open settings"
  >
    <Ionicons name="settings-outline" size={36} color="#888" />
  </Pressable>
);

const styles = StyleSheet.create({
  settingsBtn: {
    position: 'absolute',
    top: 70,
    left: 20,
    zIndex: 10,
    opacity: 0.7,
  },
}); 