import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
 
export const vw = (percentage: number) => (SCREEN_WIDTH * percentage) / 100;
export const vh = (percentage: number) => (SCREEN_HEIGHT * percentage) / 100;
export const vmin = (percentage: number) => Math.min(vw(percentage), vh(percentage));
export const vmax = (percentage: number) => Math.max(vw(percentage), vh(percentage)); 