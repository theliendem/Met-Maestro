import { useCallback, useRef, useState } from 'react';

interface TapBpmState {
  isActive: boolean;
  currentBpm: number | null;
  tapCount: number;
}

export const useTapBpm = (minBpm: number = 40, maxBpm: number = 240) => {
  const [state, setState] = useState<TapBpmState>({
    isActive: false,
    currentBpm: null,
    tapCount: 0,
  });
  
  const tapTimesRef = useRef<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculateBpm = useCallback((times: number[]): number | null => {
    if (times.length < 2) return null;
    
    // Calculate intervals between taps
    const intervals: number[] = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i - 1]);
    }
    
    // Use the last 4 intervals for more responsive calculation
    const recentIntervals = intervals.slice(-4);
    const avgInterval = recentIntervals.reduce((sum, interval) => sum + interval, 0) / recentIntervals.length;
    
    // Convert to BPM (60,000 ms / interval = BPM)
    const calculatedBpm = Math.round(60000 / avgInterval);
    
    // Ensure BPM is within valid range
    if (calculatedBpm >= minBpm && calculatedBpm <= maxBpm) {
      return calculatedBpm;
    }
    
    return null;
  }, [minBpm, maxBpm]);

  const startTapBpm = useCallback(() => {
    setState({
      isActive: true,
      currentBpm: null,
      tapCount: 0,
    });
    tapTimesRef.current = [];
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const tap = useCallback(() => {
    if (!state.isActive) return;
    
    const now = Date.now();
    tapTimesRef.current.push(now);
    
    // Keep only the last 10 taps to avoid memory issues
    if (tapTimesRef.current.length > 10) {
      tapTimesRef.current = tapTimesRef.current.slice(-10);
    }
    
    const newTapCount = tapTimesRef.current.length;
    const calculatedBpm = calculateBpm(tapTimesRef.current);
    
    setState(prev => ({
      ...prev,
      currentBpm: calculatedBpm,
      tapCount: newTapCount,
    }));
    
    // Reset after 3 seconds of inactivity
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setState({
        isActive: false,
        currentBpm: null,
        tapCount: 0,
      });
      tapTimesRef.current = [];
    }, 3000);
  }, [state.isActive, calculateBpm]);

  const stopTapBpm = useCallback(() => {
    setState({
      isActive: false,
      currentBpm: null,
      tapCount: 0,
    });
    tapTimesRef.current = [];
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    isActive: state.isActive,
    currentBpm: state.currentBpm,
    tapCount: state.tapCount,
    startTapBpm,
    tap,
    stopTapBpm,
  };
}; 