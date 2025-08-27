import React from 'react';
import { DeviceEventEmitter } from 'react-native';

// Event types for SoundSystem communication
export enum SoundSystemEventType {
  // Metronome events
  METRONOME_BEAT = 'metronome-beat',
  METRONOME_STARTED = 'metronome-started',
  METRONOME_STOPPED = 'metronome-stopped',

  // Show events
  SHOW_MEASURE_COMPLETED = 'show-measure-completed',
  SHOW_STARTED = 'show-started',
  SHOW_STOPPED = 'show-stopped',

  // Tuner events
  TUNER_DATA = 'tuner-data',
  TUNER_STARTED = 'tuner-started',
  TUNER_STOPPED = 'tuner-stopped',

  // System events
  AUDIO_INITIALIZED = 'audio-initialized',
  AUDIO_ERROR = 'audio-error',
}

// Event payload interfaces
export interface MetronomeBeatPayload {
  beatNumber: number;
  totalBeats: number;
  isDownbeat: boolean;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
}

export interface ShowMeasureCompletedPayload {
  measureNumber: number;
  beatsPerMeasure: number;
  tempo: number;
  nextTempo: number;
  nextTimeSignature: { numerator: number; denominator: number };
  showName: string;
}

export interface TunerDataPayload {
  note: string | null;
  frequency: number | null;
  cents: number | null;
  isInTune: boolean;
  referencePitch: number;
}

export interface AudioErrorPayload {
  error: string;
  code?: string;
  mode: 'metronome' | 'show' | 'tuner' | 'system';
}

// Union type for all event payloads
export type SoundSystemEventPayload =
  | MetronomeBeatPayload
  | ShowMeasureCompletedPayload
  | TunerDataPayload
  | AudioErrorPayload
  | {};

// Event interface
export interface SoundSystemEvent {
  type: SoundSystemEventType;
  payload: SoundSystemEventPayload;
  timestamp: number;
}

// Event emitter class using DeviceEventEmitter for cross-component communication
class SoundSystemEventEmitter {
  private static instance: SoundSystemEventEmitter;

  static getInstance(): SoundSystemEventEmitter {
    if (!SoundSystemEventEmitter.instance) {
      SoundSystemEventEmitter.instance = new SoundSystemEventEmitter();
    }
    return SoundSystemEventEmitter.instance;
  }

  emit(eventType: SoundSystemEventType, payload: SoundSystemEventPayload) {
    const event: SoundSystemEvent = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    };

    console.log('SoundSystemEventEmitter: Emitting event', eventType, payload);
    DeviceEventEmitter.emit('SoundSystemEvent', event);
  }

  addListener(callback: (event: SoundSystemEvent) => void) {
    return DeviceEventEmitter.addListener('SoundSystemEvent', callback);
  }

  removeAllListeners() {
    DeviceEventEmitter.removeAllListeners('SoundSystemEvent');
  }
}

// Export singleton instance
export const soundSystemEvents = SoundSystemEventEmitter.getInstance();

// React hook for listening to SoundSystem events
export const useSoundSystemEvents = () => {
  const [events, setEvents] = React.useState<Map<SoundSystemEventType, SoundSystemEventPayload>>(new Map());

  React.useEffect(() => {
    const subscription = soundSystemEvents.addListener((event) => {
      setEvents(prev => {
        const newEvents = new Map(prev);
        newEvents.set(event.type, event.payload);
        return newEvents;
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const getLatestEvent = (eventType: SoundSystemEventType): SoundSystemEventPayload | null => {
    return events.get(eventType) || null;
  };

  const clearEvent = (eventType: SoundSystemEventType) => {
    setEvents(prev => {
      const newEvents = new Map(prev);
      newEvents.delete(eventType);
      return newEvents;
    });
  };

  return {
    events,
    getLatestEvent,
    clearEvent,
  };
};
