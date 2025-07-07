import { View, type ViewProps } from 'react-native';

import { AppTheme } from '@/theme/AppTheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = AppTheme.colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
