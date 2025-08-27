// Unified message protocol for SoundSystem communication

export interface SoundSystemMessage {
  type: string;
  payload?: any;
  requestId?: string;
  timestamp?: number;
}

// Message types - React Native to WebView
export const MESSAGE_TYPES = {
  // System
  INIT_AUDIO: 'INIT_AUDIO',
  SUSPEND_AUDIO: 'SUSPEND_AUDIO',
  UPDATE_THEME: 'UPDATE_THEME',

  // Metronome
  START_METRONOME: 'START_METRONOME',
  STOP_METRONOME: 'STOP_METRONOME',
  UPDATE_METRONOME_SETTINGS: 'UPDATE_METRONOME_SETTINGS',

  // Show
  LOAD_SHOW: 'LOAD_SHOW',
  START_SHOW: 'START_SHOW',
  STOP_SHOW: 'STOP_SHOW',
  UPDATE_SHOW_SETTINGS: 'UPDATE_SHOW_SETTINGS',

  // Tuner
  START_TUNER: 'START_TUNER',
  STOP_TUNER: 'STOP_TUNER',
  UPDATE_TUNER_SETTINGS: 'UPDATE_TUNER_SETTINGS',
} as const;

// Message types - WebView to React Native
export const RESPONSE_TYPES = {
  // Metronome responses
  METRONOME_BEAT: 'METRONOME_BEAT',
  METRONOME_STARTED: 'METRONOME_STARTED',
  METRONOME_STOPPED: 'METRONOME_STOPPED',

  // Show responses
  SHOW_LOADED: 'SHOW_LOADED',
  SHOW_MEASURE_COMPLETED: 'SHOW_MEASURE_COMPLETED',
  SHOW_STARTED: 'SHOW_STARTED',
  SHOW_STOPPED: 'SHOW_STOPPED',

  // Tuner responses
  TUNER_STARTED: 'TUNER_STARTED',
  TUNER_STOPPED: 'TUNER_STOPPED',
  TUNER_DATA: 'TUNER_DATA',

  // System responses
  AUDIO_INITIALIZED: 'AUDIO_INITIALIZED',
  AUDIO_ERROR: 'AUDIO_ERROR',
} as const;

// Payload type definitions
export interface MetronomeStartPayload {
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  soundType: string;
  subdivision?: number;
}

export interface MetronomeBeatPayload {
  beatNumber: number;
  totalBeats: number;
  isDownbeat: boolean;
}

export interface ShowLoadPayload {
  id: string;
  name: string;
  measures: {
    id: string;
    timeSignature: { numerator: number; denominator: number };
    tempo: number;
    count: number;
    letter?: string;
  }[];
}

export interface ShowStartPayload {
  startType: 'beginning' | 'current' | 'specific';
  startMeasure?: number;
  startLetter?: string;
  endType: 'end' | 'specific';
  endMeasure?: number;
  endLetter?: string;
}

export interface ShowMeasureCompletedPayload {
  measureNumber: number;
  beatsPerMeasure: number;
  tempo: number;
  nextTempo: number;
  nextTimeSignature: { numerator: number; denominator: number };
}

export interface TunerStartPayload {
  referencePitch: number;
}

export interface TunerDataPayload {
  note: string | null;
  frequency: number | null;
  cents: number | null;
  isInTune: boolean;
}

export interface ThemeColorsPayload {
  background: string;
  surface: string;
  primary: string;
  text: string;
  icon: string;
  accent: string;
  orange: string;
}

// Helper type for message payloads
export type MessagePayload =
  | MetronomeStartPayload
  | MetronomeBeatPayload
  | ShowLoadPayload
  | ShowStartPayload
  | ShowMeasureCompletedPayload
  | TunerStartPayload
  | TunerDataPayload
  | ThemeColorsPayload
  | {};

// Helper type for response payloads
export type ResponsePayload =
  | MetronomeBeatPayload
  | ShowMeasureCompletedPayload
  | TunerDataPayload
  | {};
