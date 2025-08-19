import { AppTheme, useAppTheme } from '@/theme/AppTheme';
import { AccentColor, useTheme } from '@/theme/ThemeContext';
import React from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface SettingsPageProps {
  onClose: () => void;
  currentSound?: string;
  onSoundChange?: (soundType: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose, currentSound = 'synth', onSoundChange }) => {
  const { accentColor, setAccentColor } = useTheme();
  const appTheme = useAppTheme();
  const themeColors = appTheme?.colors || AppTheme.colors;
  
  const accentColors = [
    { name: 'Purple', value: 'purple' as AccentColor, color: '#BB86FC' },
    { name: 'Blue', value: 'blue' as AccentColor, color: '#2196F3' },
    { name: 'Dark Blue', value: 'darkBlue' as AccentColor, color: '#1976D2' },
    { name: 'Green', value: 'green' as AccentColor, color: '#4CAF50' },
    { name: 'Yellow', value: 'yellow' as AccentColor, color: '#FFC107' },
    { name: 'Orange', value: 'orange' as AccentColor, color: '#FF9800' },
    { name: 'Red', value: 'red' as AccentColor, color: '#F44336' },
    { name: 'Pink', value: 'pink' as AccentColor, color: '#E91E63' },
    { name: 'Gray', value: 'gray' as AccentColor, color: '#9E9E9E' },
  ];

  const soundOptions = [
    { name: 'Woodblock', value: 'woodblock' },
    { name: 'Synth', value: 'synth' },
    { name: 'Cowbell', value: 'cowbell' },
    { name: 'Click', value: 'click' },
    { name: 'Beep', value: 'beep' },
    { name: 'Dr Beat', value: 'drbeat' },
    { name: 'Sharp', value: 'sharp' },
  ];

  const handleAccentColorSelect = (colorValue: AccentColor) => {
    setAccentColor(colorValue);
  };

  const handleSoundSelect = (soundValue: string) => {
    onSoundChange?.(soundValue);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: themeColors.text }]}>Interface</ThemedText>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={[styles.settingTitle, { color: themeColors.text }]}>Accent Color</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Choose your preferred accent color for the app
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.colorGrid}>
            {accentColors.map((colorOption) => (
              <TouchableOpacity
                key={colorOption.value}
                style={[
                  styles.colorOption,
                  { backgroundColor: colorOption.color },
                  accentColor === colorOption.value && styles.selectedColor
                ]}
                onPress={() => handleAccentColorSelect(colorOption.value)}
              >
                {accentColor === colorOption.value && (
                  <View style={styles.checkmark}>
                    <ThemedText style={styles.checkmarkText}>✓</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: themeColors.text }]}>Sound</ThemedText>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={[styles.settingTitle, { color: themeColors.text }]}>Metronome Sound</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Choose the sound for your metronome clicks
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.soundGrid}>
            {soundOptions.map((soundOption) => (
              <TouchableOpacity
                key={soundOption.value}
                style={[
                  styles.soundOption,
                  currentSound === soundOption.value && {
                    borderColor: themeColors.accent,
                    backgroundColor: `${themeColors.accent}1A`, // 10% opacity
                  }
                ]}
                onPress={() => handleSoundSelect(soundOption.value)}
              >
                <ThemedText style={[
                  styles.soundOptionText,
                  { color: currentSound === soundOption.value ? themeColors.accent : themeColors.text }
                ]}>
                  {soundOption.name}
                </ThemedText>
                {currentSound === soundOption.value && (
                  <View style={[styles.soundCheckmark, { backgroundColor: themeColors.accent }]}>
                    <ThemedText style={styles.soundCheckmarkText}>✓</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: themeColors.text }]}>About</ThemedText>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={[styles.settingTitle, { color: themeColors.text }]}>Version</ThemedText>
              <ThemedText style={styles.settingDescription}>4.1</ThemedText>
            </View>
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: themeColors.accent }]} onPress={() => {
            Linking.openURL('https://metmaestro.com');
          }}>
            <ThemedText style={styles.buttonText}>Help & Feedback</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#fff',
    borderWidth: 3,
  },
  checkmark: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  soundGrid: {
    marginTop: 12,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 8,
  },
  selectedSound: {
    borderColor: '#BB86FC', // This will be overridden dynamically
    backgroundColor: 'rgba(187, 134, 252, 0.1)', // This will be overridden dynamically
  },
  soundOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  soundCheckmark: {
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundCheckmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 