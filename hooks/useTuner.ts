// React hook for tuner state
// Exports: useTuner
// TODO: Implement state, effect, and API for tuner logic.

import { useEffect, useRef, useState } from 'react';
import * as audioStream from '../utils/audioStream';
import { freqToNote, getCents, noteToString } from '../utils/noteUtils';
import { detectPitch } from '../utils/pitchDetector';

const SMOOTHING = 4; // moving average window

export function useTuner() {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [freq, setFreq] = useState<number | null>(null);
  const [cents, setCents] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const freqBuffer = useRef<number[]>([]);

  // Start listening
  const start = () => {
    if (isListening) return;
    setIsListening(true);
    setError(null);
    audioStream.start(onData);
  };

  // Stop listening
  const stop = () => {
    if (!isListening) return;
    setIsListening(false);
    audioStream.stop();
    setNote(null);
    setFreq(null);
    setCents(null);
  };

  // PCM data handler
  function onData(pcm: Int16Array) {
    try {
      const detectedFreq = detectPitch(pcm);
      if (detectedFreq && detectedFreq > 0 && detectedFreq < 5000) {
        // Smoothing
        freqBuffer.current.push(detectedFreq);
        if (freqBuffer.current.length > SMOOTHING) freqBuffer.current.shift();
        const avgFreq = freqBuffer.current.reduce((a, b) => a + b, 0) / freqBuffer.current.length;
        setFreq(avgFreq);
        const { note, octave, midi } = freqToNote(avgFreq);
        setNote(noteToString(note, octave));
        setCents(getCents(avgFreq, midi));
      } else {
        freqBuffer.current = [];
        setFreq(null);
        setNote(null);
        setCents(null);
      }
    } catch (e) {
      setError('Pitch detection error');
      setFreq(null);
      setNote(null);
      setCents(null);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioStream.stop();
    };
  }, []);

  return {
    isListening,
    note,
    freq,
    cents,
    error,
    start,
    stop,
  };
} 