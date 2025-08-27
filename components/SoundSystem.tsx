import { forwardRef, useImperativeHandle, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { soundSystemEvents, SoundSystemEventType } from '../utils/SoundSystemEvents';

interface SoundSystemProps {
  // No visual props - invisible component
}

export interface SoundSystemRef {
  // Metronome methods
  startMetronome: (bpm: number, timeSignature: { numerator: number; denominator: number }, soundType: string) => void;
  stopMetronome: () => void;
  updateMetronomeSettings: (settings: any) => void;

  // Show methods
  loadShow: (showData: any) => void;
  startShowPlayback: (startOptions: any) => void;
  stopShowPlayback: () => void;
  updateShowSettings: (settings: any) => void;

  // Tuner methods
  startTuner: (referencePitch: number) => void;
  stopTuner: () => void;
  updateTunerSettings: (settings: any) => void;

  // System methods
  initializeAudio: () => void;
  suspendAudio: () => void;
  updateTheme: (colors: any) => void;
}

// Consolidated HTML template for all sound logic
const soundSystemHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SoundSystem</title>
    <style>
        body {
            background: transparent;
            display: none; /* Completely hidden */
        }
    </style>
</head>
<body>
    <!-- Consolidated JavaScript for all sound logic -->
    <script>
        // Message handling
        window.addEventListener('message', handleMessage);

        function handleMessage(event) {
            const message = JSON.parse(event.data);
            console.log('SoundSystem received:', message);

            switch (message.type) {
                case 'INIT_AUDIO':
                    initAudioContext();
                    break;
                case 'START_METRONOME':
                    startMetronome(message.payload);
                    break;
                case 'STOP_METRONOME':
                    stopMetronome();
                    break;
                case 'LOAD_SHOW':
                    loadShow(message.payload);
                    break;
                case 'START_SHOW':
                    startShowPlayback(message.payload);
                    break;
                case 'STOP_SHOW':
                    stopShowPlayback();
                    break;
                case 'START_TUNER':
                    startTuner(message.payload);
                    break;
                case 'STOP_TUNER':
                    stopTuner();
                    break;
                case 'UPDATE_THEME':
                    updateTheme(message.payload);
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        }

        // Audio context and sound logic will be consolidated here
        let audioContext = null;

        function initAudioContext() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('SoundSystem: Audio context initialized');
            }
        }

        function suspendAudio() {
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close();
                audioContext = null;
                console.log('SoundSystem: Audio context suspended');
            }
        }

        function updateTheme(colors) {
            console.log('SoundSystem: Theme updated', colors);
            // Theme colors will be applied to sound system elements if needed
        }

        // Placeholder functions - will be consolidated from existing WebViews
        function startMetronome(payload) {
            console.log('SoundSystem: Starting metronome', payload);
            // TODO: Consolidate metronome logic from WebViewMetronome
        }

        function stopMetronome() {
            console.log('SoundSystem: Stopping metronome');
            // TODO: Consolidate metronome stop logic
        }

        function loadShow(showData) {
            console.log('SoundSystem: Loading show', showData);
            // TODO: Consolidate show loading logic from WebViewShow
        }

        function startShowPlayback(options) {
            console.log('SoundSystem: Starting show playback', options);
            // TODO: Consolidate show playback logic
        }

        function stopShowPlayback() {
            console.log('SoundSystem: Stopping show playback');
            // TODO: Consolidate show stop logic
        }

        function startTuner(settings) {
            console.log('SoundSystem: Starting tuner', settings);
            // TODO: Consolidate tuner logic from WebViewTuner
        }

        function stopTuner() {
            console.log('SoundSystem: Stopping tuner');
            // TODO: Consolidate tuner stop logic
        }

        // Send messages back to React Native
        function sendMessage(type, payload) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type,
                payload,
                timestamp: Date.now()
            }));
        }

        console.log('SoundSystem: Initialized');
    </script>
</body>
</html>
`;

const SoundSystem = forwardRef<SoundSystemRef, SoundSystemProps>((props, ref) => {
  const webViewRef = useRef<WebView>(null);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    // Metronome methods
    startMetronome: (bpm: number, timeSignature: { numerator: number; denominator: number }, soundType: string) => {
      sendMessage('START_METRONOME', { bpm, timeSignature, soundType });
    },
    stopMetronome: () => {
      sendMessage('STOP_METRONOME', {});
    },
    updateMetronomeSettings: (settings: any) => {
      sendMessage('UPDATE_METRONOME_SETTINGS', settings);
    },

    // Show methods
    loadShow: (showData: any) => {
      sendMessage('LOAD_SHOW', showData);
    },
    startShowPlayback: (startOptions: any) => {
      sendMessage('START_SHOW', startOptions);
    },
    stopShowPlayback: () => {
      sendMessage('STOP_SHOW', {});
    },
    updateShowSettings: (settings: any) => {
      sendMessage('UPDATE_SHOW_SETTINGS', settings);
    },

    // Tuner methods
    startTuner: (referencePitch: number) => {
      sendMessage('START_TUNER', { referencePitch });
    },
    stopTuner: () => {
      sendMessage('STOP_TUNER', {});
    },
    updateTunerSettings: (settings: any) => {
      sendMessage('UPDATE_TUNER_SETTINGS', settings);
    },

    // System methods
    initializeAudio: () => {
      sendMessage('INIT_AUDIO', {});
    },
    suspendAudio: () => {
      sendMessage('SUSPEND_AUDIO', {});
    },
    updateTheme: (colors: any) => {
      sendMessage('UPDATE_THEME', colors);
    },
  }));

  const sendMessage = (type: string, payload: any) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type,
        payload,
        timestamp: Date.now()
      }));
    }
  };

  const handleWebViewMessage = (event: any) => {
    const message = JSON.parse(event.nativeEvent.data);
    console.log('SoundSystem received message from WebView:', message);

    // Handle responses from WebView (beats, measure completion, tuner data, etc.)
    switch (message.type) {
      case 'METRONOME_BEAT':
        // Emit metronome beat event
        soundSystemEvents.emit(SoundSystemEventType.METRONOME_BEAT, message.payload);
        break;
      case 'METRONOME_STARTED':
        soundSystemEvents.emit(SoundSystemEventType.METRONOME_STARTED, message.payload);
        break;
      case 'METRONOME_STOPPED':
        soundSystemEvents.emit(SoundSystemEventType.METRONOME_STOPPED, message.payload);
        break;
      case 'SHOW_MEASURE_COMPLETED':
        // Emit show measure completed event
        soundSystemEvents.emit(SoundSystemEventType.SHOW_MEASURE_COMPLETED, message.payload);
        break;
      case 'SHOW_STARTED':
        soundSystemEvents.emit(SoundSystemEventType.SHOW_STARTED, message.payload);
        break;
      case 'SHOW_STOPPED':
        soundSystemEvents.emit(SoundSystemEventType.SHOW_STOPPED, message.payload);
        break;
      case 'TUNER_DATA':
        // Emit tuner data event
        soundSystemEvents.emit(SoundSystemEventType.TUNER_DATA, message.payload);
        break;
      case 'TUNER_STARTED':
        soundSystemEvents.emit(SoundSystemEventType.TUNER_STARTED, message.payload);
        break;
      case 'TUNER_STOPPED':
        soundSystemEvents.emit(SoundSystemEventType.TUNER_STOPPED, message.payload);
        break;
      case 'AUDIO_INITIALIZED':
        soundSystemEvents.emit(SoundSystemEventType.AUDIO_INITIALIZED, message.payload);
        break;
      case 'AUDIO_ERROR':
        soundSystemEvents.emit(SoundSystemEventType.AUDIO_ERROR, message.payload);
        break;
      default:
        console.log('Unknown WebView message type:', message.type);
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ html: soundSystemHTML }}
      style={{
        position: 'absolute',
        top: -10000, // Move far off-screen
        left: -10000,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none'
      }}
      onMessage={handleWebViewMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
      mixedContentMode="always"
      originWhitelist={['*']}
      // Prevent any visual rendering
      scalesPageToFit={false}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  );
});

SoundSystem.displayName = 'SoundSystem';

export default SoundSystem;
