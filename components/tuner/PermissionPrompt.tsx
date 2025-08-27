import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';

interface PermissionPromptProps {
  onRequestPermission: () => void;
  onOpenSettings?: () => void;
}

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({
  onRequestPermission,
  onOpenSettings,
}) => {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Microphone Icon */}
        <View style={[styles.iconContainer, { borderColor: theme.colors.icon }]}>
          <IconSymbol name="mic.slash" size={48} color={theme.colors.icon} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Microphone Access Required
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: theme.colors.icon }]}>
          To use the tuner, Met Maestro needs access to your device's microphone to detect and analyze audio frequencies in real-time.
        </Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>
            This allows you to:
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <IconSymbol name="checkmark" size={16} color={theme.colors.accent} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>
                Detect musical notes in real-time
              </Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="checkmark" size={16} color={theme.colors.accent} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>
                Measure pitch accuracy in cents
              </Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="checkmark" size={16} color={theme.colors.accent} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>
                Tune instruments precisely
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Request Permission Button */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
            onPress={onRequestPermission}
          >
            <IconSymbol name="mic" size={20} color={theme.colors.text} />
            <Text style={[styles.primaryButtonText, { color: theme.colors.text }]}>
              Grant Microphone Access
            </Text>
          </TouchableOpacity>

          {/* Settings Button (if provided) */}
          {onOpenSettings && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.icon }]}
              onPress={onOpenSettings}
            >
              <IconSymbol name="gear" size={20} color={theme.colors.icon} />
              <Text style={[styles.secondaryButtonText, { color: theme.colors.icon }]}>
                Open App Settings
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyContainer}>
          <Text style={[styles.privacyText, { color: theme.colors.icon }]}>
            🔒 Your privacy is protected. Audio data is processed locally on your device and is never stored or transmitted.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  privacyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.3)',
  },
  privacyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
