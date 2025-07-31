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
  const persistenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastValidData = useRef<{
    note: string | null;
    freq: number | null;
    cents: number | null;
  } | null>(null);

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
      lastValidData.current = null;
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
        persistenceTimeoutRef.current = null;
      }
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
        const { note, octave, midi } = freqToNote(avgFreq);
        const noteString = noteToString(note, octave);
        const centsValue = getCents(avgFreq, midi);
        
        // Update state
        setFreq(avgFreq);
        setNote(noteString);
        setCents(centsValue);
        
        // Store last valid data
        lastValidData.current = {
          note: noteString,
          freq: avgFreq,
          cents: centsValue,
        };
        
        // Clear any existing persistence timeout
        if (persistenceTimeoutRef.current) {
          clearTimeout(persistenceTimeoutRef.current);
          persistenceTimeoutRef.current = null;
        }
        
        missedCount.current = 0; // reset missed counter
      } else {
        missedCount.current += 1;
        if (missedCount.current >= 4) {
          freqBuffer.current = [];
          
          // Start persistence timeout if we have last valid data
          if (lastValidData.current && !persistenceTimeoutRef.current) {
            persistenceTimeoutRef.current = setTimeout(() => {
              setFreq(null);
              setNote(null);
              setCents(null);
              lastValidData.current = null;
              persistenceTimeoutRef.current = null;
            }, 5000); // 5 seconds
          } else if (!lastValidData.current) {
            // No valid data to persist, clear immediately
            setFreq(null);
            setNote(null);
            setCents(null);
          }
        }
      }
    } catch (e) {
      setError('Pitch detection error');
      setFreq(null);
      setNote(null);
      setCents(null);
      lastValidData.current = null;
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
        persistenceTimeoutRef.current = null;
      }
    }
  }, [chunk, permission, active]);

  // Cleanup on unmount (clear buffers)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      setNote(null);
      setFreq(null);
      setCents(null);
      freqBuffer.current = [];
      missedCount.current = 0;
      lastValidData.current = null;
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
        persistenceTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    note,
    freq,
    cents,
    error,
    permission,
  };
} 