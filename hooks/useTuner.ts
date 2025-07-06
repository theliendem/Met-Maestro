// React hook for tuner state
// Exports: useTuner
// TODO: Implement state, effect, and API for tuner logic.

import { useEffect, useRef, useState } from 'react';
import { freqToNote, getCents, noteToString } from '../utils/noteUtils';
import { detectPitch } from '../utils/pitchDetector';
import { useAudioStream } from './useAudioStream';

const SMOOTHING = 4; // moving average window

/**
 * useTuner React hook
 * @param active boolean - if true, tuner listens and processes audio; if false, tuner is paused
 */
export function useTuner(active: boolean = true) {
  const [note, setNote] = useState<string | null>(null);
  const [freq, setFreq] = useState<number | null>(null);
  const [cents, setCents] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const freqBuffer = useRef<number[]>([]);
  const missedCount = useRef(0);

  // Use the audio stream hook
  const { chunk, permission, error: audioError } = useAudioStream();

  useEffect(() => {
    if (audioError) setError(audioError);
    else setError(null);
  }, [audioError]);

  useEffect(() => {
    if (!active || permission !== 'granted') {
      setNote(null);
      setFreq(null);
      setCents(null);
      freqBuffer.current = [];
      missedCount.current = 0;
      return;
    }
    if (!chunk) return;
    try {
      const detectedFreq = detectPitch(chunk);
      if (detectedFreq && detectedFreq > 0 && detectedFreq < 5000) {
        // Smoothing
        freqBuffer.current.push(detectedFreq);
        if (freqBuffer.current.length > SMOOTHING) freqBuffer.current.shift();
        const avgFreq = freqBuffer.current.reduce((a, b) => a + b, 0) / freqBuffer.current.length;
        setFreq(avgFreq);
        const { note, octave, midi } = freqToNote(avgFreq);
        setNote(noteToString(note, octave));
        setCents(getCents(avgFreq, midi));
        missedCount.current = 0; // reset missed counter
      } else {
        missedCount.current += 1;
        if (missedCount.current >= 4) {
          freqBuffer.current = [];
          setFreq(null);
          setNote(null);
          setCents(null);
        }
      }
    } catch (e) {
      setError('Pitch detection error');
      setFreq(null);
      setNote(null);
      setCents(null);
    }
  }, [chunk, permission, active]);

  return {
    note,
    freq,
    cents,
    error,
    permission,
  };
} 