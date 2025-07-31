import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface WebViewMetronomeProps {
  themeColors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    icon: string;
    accent: string;
    orange: string;
  };
  onOpenSettings?: () => void;
  soundType?: string;
  onSoundChange?: (soundType: string) => void;
}

export interface WebViewMetronomeRef {
  stopMetronome: () => void;
  reinitializeAudio: () => void;
}

// Helper function to convert hex color to RGB
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '187, 134, 252';
};

const WebViewMetronome = forwardRef<WebViewMetronomeRef, WebViewMetronomeProps>(({ themeColors, onOpenSettings, soundType = 'synth', onSoundChange }, ref) => {
  const webViewRef = useRef<WebView>(null);

  // Expose stopMetronome function to parent component
  useImperativeHandle(ref, () => ({
    stopMetronome: () => {
      console.log('WebViewMetronome: stopMetronome called');
      if (webViewRef.current) {
        try {
          // Send message to WebView to stop metronome
          webViewRef.current.postMessage(JSON.stringify({
            type: 'STOP_METRONOME'
          }));
          
          // Also inject JavaScript directly to ensure it stops
          webViewRef.current.injectJavaScript(`
            (function() {
              console.log('Direct JavaScript injection - stopping metronome');
              if (typeof window.forceStopMetronome === 'function') {
                window.forceStopMetronome();
              } else if (typeof isPlaying !== 'undefined' && isPlaying) {
                isPlaying = false;
                if (intervalId) {
                  clearInterval(intervalId);
                  intervalId = null;
                }
                beatCount = 0;
                const playButton = document.getElementById('playButton');
                if (playButton) {
                  playButton.classList.remove('playing');
                  playButton.innerHTML = '<div class="play-icon"></div>';
                }
                updateTempoBar(0);
                if (audioContext && audioContext.state !== 'closed') {
                  audioContext.close();
                }
                console.log('Metronome stopped via direct injection');
              }
            })();
          `);
        } catch (error) {
          console.log('Error sending stop message:', error);
        }
      }
    },
    reinitializeAudio: () => {
      console.log('WebViewMetronome: reinitializeAudio called');
      if (webViewRef.current) {
        try {
          // Send message to WebView to reinitialize audio context
          webViewRef.current.postMessage(JSON.stringify({
            type: 'REINITIALIZE_AUDIO'
          }));
        } catch (error) {
          console.log('Error sending reinitialize message:', error);
        }
      }
    }
  }));

  // Stop metronome when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function - stop metronome when component unmounts
      console.log('WebViewMetronome component unmounting - stopping metronome');
      if (webViewRef.current) {
        try {
          // Send message to WebView
          webViewRef.current.postMessage(JSON.stringify({
            type: 'STOP_METRONOME'
          }));
          
          // Also inject JavaScript directly to ensure it stops
          webViewRef.current.injectJavaScript(`
            (function() {
              console.log('Direct JavaScript injection - stopping metronome');
              if (typeof window.forceStopMetronome === 'function') {
                window.forceStopMetronome();
              } else if (typeof isPlaying !== 'undefined' && isPlaying) {
                isPlaying = false;
                if (intervalId) {
                  clearInterval(intervalId);
                  intervalId = null;
                }
                beatCount = 0;
                const playButton = document.getElementById('playButton');
                if (playButton) {
                  playButton.classList.remove('playing');
                  playButton.innerHTML = '<div class="play-icon"></div>';
                }
                updateTempoBar(0);
                if (audioContext && audioContext.state !== 'closed') {
                  audioContext.close();
                }
                console.log('Metronome stopped via direct injection');
              }
            })();
          `);
        } catch (error) {
          console.log('Error sending stop message:', error);
        }
      }
    };
  }, []);

  // HTML content for the complete metronome UI
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Metronome</title>
    <style>
        :root {
            --background: ${themeColors.background};
            --surface: ${themeColors.surface};
            --primary: ${themeColors.primary};
            --text: ${themeColors.text};
            --icon: ${themeColors.icon};
            --accent: ${themeColors.accent};
            --orange: ${themeColors.orange};
            --white: #ffffff;
            --dark-gray: #202127;
            --medium-gray: #23242A;
            --light-gray: #333;
            --accent-rgb: ${hexToRgb(themeColors.accent)};
        }
        html {
            height: 100%;
            overflow: hidden;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--background);
            color: var(--text);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            overflow: hidden;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .container {
            text-align: center;
            width: 100%;
            max-width: 400px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .tempo-display {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
            color: var(--text);
            cursor: pointer;
        }
        
        .tempo-slider-container {
            width: 100%;
            margin: 20px 0;
        }
        
        .slider-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .slider {
            flex: 1;
            height: 40px;
            -webkit-appearance: none;
            appearance: none;
            background: #2a2a2a;
            outline: none;
            border-radius: 20px;
            padding: 0 10px;
        }
        
        .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--accent);
            cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--accent);
            cursor: pointer;
            border: none;
        }
        
        .tempo-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .tempo-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--surface);
            border: none;
            color: var(--text);
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
        
        .tempo-btn:hover {
            background: var(--accent);
        }
        
        .tempo-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .play-button {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: var(--accent) !important;
            border: none;
            color: white;
            font-size: 48px;
            cursor: pointer;
            transition: all 0.2s ease;
            margin: 30px 0;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .play-button:hover {
            background: var(--accent);
            transform: scale(1.05);
        }
        
        .play-button.playing {
            background: var(--orange);
        }
        
        .play-button.playing:hover {
            background: #e6951f;
        }
        
        .play-icon {
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 12px 0 12px 20px;
            border-color: transparent transparent transparent #ffffff;
            margin-left: 4px;
        }
        
        .stop-icon {
            width: 16px;
            height: 16px;
            background-color: #ffffff;
            border-radius: 2px;
        }
        
        .tap-bpm-btn {
            position: absolute;
            top: 8vh;
            left: 20px;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: var(--surface);
            border: 2px solid var(--icon);
            color: var(--text);
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
        

        
        .tap-bpm-btn:hover {
            border-color: var(--accent);
            background: rgba(var(--accent-rgb), 0.2);
        }
        
        .tap-bpm-btn.active {
            border-color: var(--accent);
            background: rgba(var(--accent-rgb), 0.2);
        }
        
        .tap-bpm-btn::before {
            content: "";
            width: 24px;
            height: 24px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 11l3 3l8-8'/%3E%3Cpath d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'/%3E%3C/svg%3E");
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            display: inline-block;
        }
        
        .subdivision-btn {
            position: absolute;
            top: 8vh;
            right: 20px;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: var(--surface);
            border: 2px solid var(--icon);
            color: var(--text);
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
        

        
        .subdivision-btn:hover {
            border-color: var(--accent);
            background: rgba(var(--accent-rgb), 0.2);
        }
        
        .button-label {
            position: absolute;
            font-size: 12px;
            color: var(--icon);
            font-weight: 500;
            text-align: center;
            white-space: nowrap;
        }
        
        .tap-bpm-label {
            top: calc(8vh + 90px);
            left: 20px;
            width: 80px;
        }
        
        .subdivision-label {
            top: calc(8vh + 90px);
            right: 20px;
            width: 80px;
        }
        
        .subdivision-btn::before {
            content: "";
            width: 24px;
            height: 24px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18V5l12-2v13'/%3E%3Ccircle cx='6' cy='18' r='3'/%3E%3Ccircle cx='18' cy='16' r='3'/%3E%3C/svg%3E");
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            display: inline-block;
        }
        
        .subdivision-option {
            background: var(--surface);
            border: 2px solid var(--icon);
            border-radius: 12px;
            padding: 16px;
            margin: 8px 0;
            cursor: pointer;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .subdivision-option:hover {
            border-color: var(--accent);
            background: rgba(var(--accent-rgb), 0.1);
        }
        
        .subdivision-option.selected {
            border-color: var(--accent);
            background: rgba(var(--accent-rgb), 0.2);
        }
        
        .subdivision-title {
            color: var(--text);
            font-size: 18px;
            font-weight: bold;
        }
        
        .subdivision-icon {
            font-size: 24px;
            line-height: 1;
            flex-shrink: 0;
        }
        
        .subdivision-description {
            color: var(--icon);
            font-size: 14px;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: var(--surface);
            border-radius: 16px;
            padding: 32px;
            width: 320px;
            text-align: center;
        }
        
        .modal-title {
            color: var(--text);
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 12px;
        }
        
        .modal-input {
            background: var(--background);
            color: var(--text);
            border-radius: 8px;
            padding: 12px;
            font-size: 28px;
            width: 120px;
            text-align: center;
            border: 1px solid var(--icon);
            margin-bottom: 12px;
        }
        
        .modal-buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
        }
        
        .modal-btn {
            border-radius: 8px;
            padding: 10px 24px;
            font-weight: bold;
            font-size: 18px;
            cursor: pointer;
            border: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
        
        .modal-btn.cancel {
            background: var(--icon);
            color: var(--text);
        }
        
        .modal-btn.save {
            background: var(--accent);
            color: var(--text);
        }
        
        .modal-btn.save:disabled {
            background: #888;
            cursor: not-allowed;
        }
        
        /* Settings Button */
        .settings-button {
            position: fixed;
            bottom: 15vh;
            right: 20px;
            width: 56px;
            height: 56px;
            background-color: var(--surface);
            border-radius: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            z-index: 1000;
            transition: all 0.2s ease;
            border: 1px solid var(--light-gray);
        }
        
        .settings-button:hover {
            background-color: var(--medium-gray);
            transform: scale(1.05);
        }
        
        .settings-button:active {
            transform: scale(0.95);
        }
        
        .settings-icon {
            width: 24px;
            height: 24px;
            fill: var(--text);
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Tap BPM Button -->
        <button class="tap-bpm-btn" id="tapBpmBtn" title="Tap BPM"></button>
        <div class="button-label tap-bpm-label">Tap BPM</div>
        
        <!-- Subdivision Button -->
        <button class="subdivision-btn" id="subdivisionBtn" title="Subdivision"></button>
        <div class="button-label subdivision-label">Subdivision</div>
        
        <!-- Tempo Display -->
        <div class="tempo-display" id="tempoDisplay">120 BPM</div>
        
        <!-- Tempo Slider -->
        <div class="tempo-slider-container">
            <div class="slider-row">
                <button class="tempo-btn" id="minusBtn">−</button>
                <input type="range" class="slider" id="tempoSlider" min="40" max="240" value="120" step="1">
                <button class="tempo-btn" id="plusBtn">+</button>
            </div>
        </div>
        
        <!-- Play Button -->
        <button class="play-button" id="playButton">
            <div class="play-icon"></div>
        </button>
    </div>
    
    <!-- BPM Edit Modal -->
    <div class="modal" id="bpmModal">
        <div class="modal-content">
            <div class="modal-title">Edit BPM</div>
            <input type="text" class="modal-input" id="bpmInput" value="120" inputmode="numeric" pattern="[0-9]*">
            <div class="modal-buttons">
                <button class="modal-btn cancel" id="cancelBtn">Cancel</button>
                <button class="modal-btn save" id="saveBtn">Save</button>
            </div>
        </div>
    </div>
    
    <!-- Subdivision Modal -->
    <div class="modal" id="subdivisionModal">
        <div class="modal-content">
            <div class="modal-title">Choose Subdivision</div>
            <div class="subdivision-option" data-subdivision="1">
                <div class="subdivision-icon">♪</div>
                <div class="subdivision-title">None</div>
            </div>
            <div class="subdivision-option" data-subdivision="2">
                <div class="subdivision-icon">♫</div>
                <div class="subdivision-title">Eighth</div>
            </div>
            <div class="subdivision-option" data-subdivision="3">
                <div class="subdivision-icon">♫♪</div>
                <div class="subdivision-title">Triplet</div>
            </div>
            <div class="subdivision-option" data-subdivision="4">
                <div class="subdivision-icon">♫♫</div>
                <div class="subdivision-title">Sixteenth</div>
            </div>
            <div class="subdivision-option" data-subdivision="5">
                <div class="subdivision-icon">♫♫♪</div>
                <div class="subdivision-title">Quintuplet</div>
            </div>
            <div class="subdivision-option" data-subdivision="6">
                <div class="subdivision-icon">♫♫♫</div>
                <div class="subdivision-title">Sixtuplet</div>
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel" id="subdivisionCancelBtn">Cancel</button>
            </div>
        </div>
    </div>
    
    <!-- Settings Button -->
    <div class="settings-button" id="settingsButton">
        <svg class="settings-icon" viewBox="0 0 24 24">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
        </svg>
    </div>

    <script>
        let audioContext;
        let isPlaying = false;
        let tempo = 120;
        let subdivision = 1; // 1 = no subdivision, 2 = eighth notes, 3 = triplets, etc.
        let beatCount = 0; // Track which subdivision we're on within a beat
        let intervalId = null;
        let tapTimes = [];
        let isTapBpmActive = false;
        let tapBpmTimeout = null;
        let currentSound = '${soundType}'; // Current sound type
        
        // Global function to force stop metronome
        window.forceStopMetronome = function() {
            console.log('Force stopping metronome from global function');
            isPlaying = false;
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            beatCount = 0;
            const playButton = document.getElementById('playButton');
            if (playButton) {
                playButton.classList.remove('playing');
                playButton.innerHTML = '<div class="play-icon"></div>';
            }
            updateTempoBar(0);
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close();
            }
            console.log('Metronome force stopped');
        };
        
        // Initialize audio context
        function initAudio() {
            try {
                // Close existing audio context if it exists
                if (audioContext && audioContext.state !== 'closed') {
                    audioContext.close();
                }
                
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Audio context initialized successfully');
                
                // Configure audio context for silent mode bypass
                // Set the audio context to use the 'playback' category
                if (audioContext.setSinkId) {
                    // This helps with audio routing on some devices
                    console.log('Audio context supports sink ID setting');
                }
                
                // Resume audio context if it's suspended
                if (audioContext.state === 'suspended') {
                    audioContext.resume().then(() => {
                        console.log('Audio context resumed successfully');
                    }).catch(e => {
                        console.error('Failed to resume audio context:', e);
                    });
                }
                
                // Test audio context with a silent oscillator to ensure it's working
                try {
                    const testOscillator = audioContext.createOscillator();
                    const testGain = audioContext.createGain();
                    testGain.gain.setValueAtTime(0, audioContext.currentTime); // Silent
                    testOscillator.connect(testGain);
                    testGain.connect(audioContext.destination);
                    testOscillator.start();
                    testOscillator.stop(audioContext.currentTime + 0.001);
                    console.log('Audio context test passed');
                } catch (testError) {
                    console.log('Audio context test failed:', testError);
                }
                
                return true;
            } catch (e) {
                console.error('AudioContext not supported:', e);
                return false;
            }
        }
        
        // Play a click sound using Web Audio API
        function playClick(isDownbeat = false) {
            if (!audioContext) {
                console.error('No audio context available');
                return;
            }
            
            // Ensure audio context is running
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('Audio context resumed in playClick');
                }).catch(e => {
                    console.error('Failed to resume audio context in playClick:', e);
                    return;
                });
            }
            
            const startTime = audioContext.currentTime;
            const duration = 0.08;
            
            // Different sound types
            if (currentSound === 'synth') {
                if (isDownbeat) {
                    // Downbeat: higher frequency with more harmonics
                    const oscillator1 = audioContext.createOscillator();
                    const oscillator2 = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator1.frequency.setValueAtTime(800, startTime);
                    oscillator2.frequency.setValueAtTime(1200, startTime);
                    
                    gainNode.gain.setValueAtTime(0.3, startTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                    
                    oscillator1.connect(gainNode);
                    oscillator2.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator1.start(startTime);
                    oscillator2.start(startTime);
                    oscillator1.stop(startTime + duration);
                    oscillator2.stop(startTime + duration);
                } else {
                    // Offbeat: simpler sound
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.frequency.setValueAtTime(600, startTime);
                    gainNode.gain.setValueAtTime(0.2, startTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.start(startTime);
                    oscillator.stop(startTime + duration);
                }
            } else if (currentSound === 'woodblock') {
                // Woodblock sound - authentic synthesis with proper envelopes and filtering
                const oscillator1 = audioContext.createOscillator();
                const oscillator2 = audioContext.createOscillator();
                const noiseBuffer = audioContext.createBuffer(1, 2048, audioContext.sampleRate);
                const noiseData = noiseBuffer.getChannelData(0);
                for (let i = 0; i < 2048; i++) {
                    noiseData[i] = Math.random() * 2 - 1;
                }
                const noiseSource = audioContext.createBufferSource();
                noiseSource.buffer = noiseBuffer;
                
                const gainNode = audioContext.createGain();
                const noiseGain = audioContext.createGain();
                const filterNode = audioContext.createBiquadFilter();
                const filterEnv = audioContext.createGain();
                
                // Fundamental pitch - higher for accent
                const baseFreq = isDownbeat ? 1200 : 800;
                
                // Primary oscillator - square wave for rich harmonics
                oscillator1.frequency.setValueAtTime(baseFreq, startTime);
                oscillator1.type = 'square';
                
                // Secondary oscillator - slightly detuned for complexity
                oscillator2.frequency.setValueAtTime(baseFreq * 1.01, startTime);
                oscillator2.type = 'square';
                
                // Filter configuration - low-pass with resonance
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(6000, startTime);
                filterNode.Q.setValueAtTime(0.2, startTime);
                
                // Amplitude envelope - extremely fast attack, short decay
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(isDownbeat ? 1.5 : 1.2, startTime + 0.001); // Fast attack
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08); // Short decay
                
                // Noise envelope - very short burst for initial "thwack"
                noiseGain.gain.setValueAtTime(0, startTime);
                noiseGain.gain.linearRampToValueAtTime(0.8, startTime + 0.001); // Fast attack
                noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.005); // Very short decay
                
                // Filter envelope - brighten then muffle
                filterEnv.gain.setValueAtTime(1, startTime);
                filterEnv.gain.exponentialRampToValueAtTime(0.3, startTime + 0.06); // Filter decay
                
                // Connect oscillators
                oscillator1.connect(filterNode);
                oscillator2.connect(filterNode);
                
                // Connect noise
                noiseSource.connect(noiseGain);
                noiseGain.connect(filterNode);
                
                // Connect filter with envelope
                filterNode.connect(filterEnv);
                filterEnv.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Start oscillators
                oscillator1.start(startTime);
                oscillator2.start(startTime);
                noiseSource.start(startTime);
                
                // Stop oscillators
                oscillator1.stop(startTime + 0.08);
                oscillator2.stop(startTime + 0.08);
                noiseSource.stop(startTime + 0.005);
            } else if (currentSound === 'cowbell') {
                // Cowbell sound - authentic metallic synthesis with inharmonic relationships
                const oscillator1 = audioContext.createOscillator();
                const oscillator2 = audioContext.createOscillator();
                const oscillator3 = audioContext.createOscillator();
                const oscillator4 = audioContext.createOscillator();
                const oscillator5 = audioContext.createOscillator();
                const noiseBuffer = audioContext.createBuffer(1, 2048, audioContext.sampleRate);
                const noiseData = noiseBuffer.getChannelData(0);
                for (let i = 0; i < 2048; i++) {
                    noiseData[i] = Math.random() * 2 - 1;
                }
                const noiseSource = audioContext.createBufferSource();
                noiseSource.buffer = noiseBuffer;
                
                const gainNode = audioContext.createGain();
                const noiseGain = audioContext.createGain();
                const filterNode = audioContext.createBiquadFilter();
                const filterEnv = audioContext.createGain();
                
                // Fundamental frequency - higher for accent
                const baseFreq = isDownbeat ? 600 : 400;
                
                // Additive synthesis with inharmonic relationships for metallic tone
                oscillator1.frequency.setValueAtTime(baseFreq, startTime);
                oscillator2.frequency.setValueAtTime(baseFreq * 1.6, startTime);
                oscillator3.frequency.setValueAtTime(baseFreq * 2.1, startTime);
                oscillator4.frequency.setValueAtTime(baseFreq * 2.7, startTime);
                oscillator5.frequency.setValueAtTime(baseFreq * 3.2, startTime);
                
                // All sine waves for metallic, inharmonic character
                oscillator1.type = 'sine';
                oscillator2.type = 'sine';
                oscillator3.type = 'sine';
                oscillator4.type = 'sine';
                oscillator5.type = 'sine';
                
                // Band-pass filter for metallic "clang" character
                filterNode.type = 'bandpass';
                filterNode.frequency.setValueAtTime(baseFreq * 2.0, startTime);
                filterNode.Q.setValueAtTime(0.6, startTime);
                
                // Amplitude envelope - fast attack, metallic decay
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(isDownbeat ? 1.8 : 1.5, startTime + 0.001); // Fast attack
                gainNode.gain.exponentialRampToValueAtTime(0.02, startTime + 0.2); // Metallic decay
                
                // Noise envelope - very short burst for initial "clank"
                noiseGain.gain.setValueAtTime(0, startTime);
                noiseGain.gain.linearRampToValueAtTime(1.0, startTime + 0.001); // Fast attack
                noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.008); // Very short decay
                
                // Filter envelope - brighten then muffle for metallic resonance
                filterEnv.gain.setValueAtTime(1, startTime);
                filterEnv.gain.exponentialRampToValueAtTime(0.4, startTime + 0.15); // Filter decay
                
                // Connect oscillators
                oscillator1.connect(filterNode);
                oscillator2.connect(filterNode);
                oscillator3.connect(filterNode);
                oscillator4.connect(filterNode);
                oscillator5.connect(filterNode);
                
                // Connect noise
                noiseSource.connect(noiseGain);
                noiseGain.connect(filterNode);
                
                // Connect filter with envelope
                filterNode.connect(filterEnv);
                filterEnv.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Start oscillators
                oscillator1.start(startTime);
                oscillator2.start(startTime);
                oscillator3.start(startTime);
                oscillator4.start(startTime);
                oscillator5.start(startTime);
                noiseSource.start(startTime);
                
                // Stop oscillators
                oscillator1.stop(startTime + 0.2);
                oscillator2.stop(startTime + 0.2);
                oscillator3.stop(startTime + 0.2);
                oscillator4.stop(startTime + 0.2);
                oscillator5.stop(startTime + 0.2);
                noiseSource.stop(startTime + 0.008);
            } else if (currentSound === 'click') {
                // Click sound - extremely loud, thick, woody, percussive
                const oscillator1 = audioContext.createOscillator();
                const oscillator2 = audioContext.createOscillator();
                const oscillator3 = audioContext.createOscillator();
                const oscillator4 = audioContext.createOscillator();
                const oscillator5 = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const filterNode = audioContext.createBiquadFilter();
                const filterNode2 = audioContext.createBiquadFilter();
                const filterNode3 = audioContext.createBiquadFilter();
                
                // Multiple oscillators for a thick, woody percussive sound
                oscillator1.frequency.setValueAtTime(isDownbeat ? 800 : 600, startTime);
                oscillator2.frequency.setValueAtTime(isDownbeat ? 1200 : 900, startTime);
                oscillator3.frequency.setValueAtTime(isDownbeat ? 1600 : 1200, startTime);
                oscillator4.frequency.setValueAtTime(isDownbeat ? 2400 : 1800, startTime);
                oscillator5.frequency.setValueAtTime(isDownbeat ? 3200 : 2400, startTime);
                
                oscillator1.type = 'sawtooth';
                oscillator2.type = 'square';
                oscillator3.type = 'triangle';
                oscillator4.type = 'sawtooth';
                oscillator5.type = 'square';
                
                // Low-pass filter to make it thicker and less sharp
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(1600, startTime);
                filterNode.Q.setValueAtTime(2, startTime);
                
                // Band-pass filter for woody character
                filterNode2.type = 'bandpass';
                filterNode2.frequency.setValueAtTime(1200, startTime);
                filterNode2.Q.setValueAtTime(8, startTime);
                
                // High-pass filter to cut very low frequencies
                filterNode3.type = 'highpass';
                filterNode3.frequency.setValueAtTime(400, startTime);
                filterNode3.Q.setValueAtTime(1, startTime);
                
                // Extremely loud, thick envelope with very hard attack
                gainNode.gain.setValueAtTime(isDownbeat ? 3.5 : 3.0, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.02, startTime + 0.08); // Harder, shorter decay
                
                oscillator1.connect(filterNode);
                oscillator2.connect(filterNode);
                oscillator3.connect(filterNode);
                oscillator4.connect(filterNode);
                oscillator5.connect(filterNode);
                filterNode.connect(filterNode2);
                filterNode2.connect(filterNode3);
                filterNode3.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator1.start(startTime);
                oscillator2.start(startTime);
                oscillator3.start(startTime);
                oscillator4.start(startTime);
                oscillator5.start(startTime);
                oscillator1.stop(startTime + 0.08);
                oscillator2.stop(startTime + 0.08);
                oscillator3.stop(startTime + 0.08);
                oscillator4.stop(startTime + 0.08);
                oscillator5.stop(startTime + 0.08);
            } else if (currentSound === 'beep') {
                // Beep sound - extremely loud, flat, annoying
                const oscillator1 = audioContext.createOscillator();
                const oscillator2 = audioContext.createOscillator();
                const oscillator3 = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const filterNode = audioContext.createBiquadFilter();
                
                // High frequencies for annoying, piercing sound
                const baseFreq = isDownbeat ? 2000 : 1800;
                oscillator1.frequency.setValueAtTime(baseFreq, startTime);
                oscillator2.frequency.setValueAtTime(baseFreq * 1.0, startTime); // No detuning for flat sound
                oscillator3.frequency.setValueAtTime(baseFreq * 1.0, startTime); // No detuning for flat sound
                
                // Square waves for harsh, flat tone
                oscillator1.type = 'square';
                oscillator2.type = 'square';
                oscillator3.type = 'square';
                
                // High-pass filter to make it piercing and annoying
                filterNode.type = 'highpass';
                filterNode.frequency.setValueAtTime(baseFreq * 0.8, startTime);
                filterNode.Q.setValueAtTime(8, startTime); // High resonance for piercing sound
                
                // Extremely loud, flat envelope
                gainNode.gain.setValueAtTime(isDownbeat ? 3.5 : 3.0, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.1, startTime + 0.1); // Longer, flat decay
                
                oscillator1.connect(filterNode);
                oscillator2.connect(filterNode);
                oscillator3.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator1.start(startTime);
                oscillator2.start(startTime);
                oscillator3.start(startTime);
                oscillator1.stop(startTime + 0.1);
                oscillator2.stop(startTime + 0.1);
                oscillator3.stop(startTime + 0.1);
            }
        }
        
        // Calculate interval based on tempo and subdivision
        function calculateInterval() {
            const baseInterval = 60000 / tempo; // Convert BPM to milliseconds
            return baseInterval / subdivision; // Apply subdivision
        }
        
        // Start metronome
        function startMetronome() {
            console.log('Starting metronome');
            
            if (isPlaying) {
                console.log('Already playing, stopping first');
                stopMetronome();
                return;
            }
            
            // Initialize audio context if needed
            if (!audioContext) {
                if (!initAudio()) {
                    console.error('Failed to initialize audio context');
                    return;
                }
            }
            
            // Ensure audio context is running
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('Audio context resumed');
                    startMetronomeInternal();
                }).catch(e => {
                    console.error('Failed to resume audio context:', e);
                });
            } else {
                startMetronomeInternal();
            }
        }
        
        function startMetronomeInternal() {
            console.log('Starting metronome internal');
            
            // Clear any existing interval first
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            
            isPlaying = true;
            
            const interval = calculateInterval();
            
            // Play first beat immediately
            beatCount = 0;
            playClick(true);
            beatCount++;
            
            // Start the interval
            intervalId = setInterval(() => {
                if (isPlaying) {
                    // First subdivision of each beat gets high note, others get low note
                    const isDownbeat = (beatCount % subdivision) === 0;
                    playClick(isDownbeat);
                    beatCount++;
                }
            }, interval);
            
            document.getElementById('playButton').innerHTML = '<div class="stop-icon"></div>';
            document.getElementById('playButton').classList.add('playing');
        }
        
        // Stop metronome
        function stopMetronome() {
            console.log('Stopping metronome');
            
            if (!isPlaying) {
                console.log('Not playing, nothing to stop');
                return;
            }
            
            isPlaying = false;
            
            // Clear any existing interval
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            
            // Reset beat count
            beatCount = 0;
            
            // Update play button appearance
            const playButton = document.getElementById('playButton');
            if (playButton) {
                playButton.classList.remove('playing');
                playButton.innerHTML = '<div class="play-icon"></div>';
            }
            
            // Reset tempo bar
            updateTempoBar(0);
            
            console.log('Metronome stopped');
        }
        
        // Update tempo display
        function updateTempoDisplay() {
            document.getElementById('tempoDisplay').textContent = tempo + ' BPM';
            document.getElementById('tempoSlider').value = tempo;
        }
        
        // Update tempo
        function updateTempo(newTempo) {
            tempo = newTempo;
            updateTempoDisplay();
            
            // Restart if currently playing
            if (isPlaying) {
                stopMetronome();
                setTimeout(() => {
                    startMetronome();
                }, 10);
            }
        }
        
        // Tap BPM functionality
        function startTapBpm() {
            isTapBpmActive = true;
            tapTimes = [];
            document.getElementById('tapBpmBtn').classList.add('active');
            
            // Set timeout to auto-disengage after 5 seconds
            if (tapBpmTimeout) {
                clearTimeout(tapBpmTimeout);
            }
            tapBpmTimeout = setTimeout(() => {
                stopTapBpm();
            }, 5000);
        }
        
        function tap() {
            const now = Date.now();
            tapTimes.push(now);
            
            // Keep only last 8 taps
            if (tapTimes.length > 8) {
                tapTimes.shift();
            }
            
            // Reset timeout on each tap
            if (tapBpmTimeout) {
                clearTimeout(tapBpmTimeout);
            }
            tapBpmTimeout = setTimeout(() => {
                stopTapBpm();
            }, 5000);
            
            // Calculate BPM if we have at least 2 taps
            if (tapTimes.length >= 2) {
                const intervals = [];
                for (let i = 1; i < tapTimes.length; i++) {
                    intervals.push(tapTimes[i] - tapTimes[i - 1]);
                }
                
                const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
                const newTempo = Math.round(60000 / avgInterval);
                
                // Clamp to valid range
                const clampedTempo = Math.max(40, Math.min(240, newTempo));
                updateTempo(clampedTempo);
            }
        }
        
        function stopTapBpm() {
            isTapBpmActive = false;
            tapTimes = [];
            const button = document.getElementById('tapBpmBtn');
            button.classList.remove('active');
            
            // Ensure color reset
            button.style.borderColor = '';
            button.style.backgroundColor = '';
            
            // Clear timeout
            if (tapBpmTimeout) {
                clearTimeout(tapBpmTimeout);
                tapBpmTimeout = null;
            }
        }
        
        // Modal functionality
        function showBpmModal() {
            document.getElementById('bpmInput').value = tempo;
            document.getElementById('bpmModal').style.display = 'flex';
            document.getElementById('bpmInput').focus();
            document.getElementById('bpmInput').select();
        }
        
        function hideBpmModal() {
            document.getElementById('bpmModal').style.display = 'none';
        }
        
        function saveBpm() {
            const inputValue = document.getElementById('bpmInput').value;
            const newTempo = parseInt(inputValue);
            if (inputValue && !isNaN(newTempo) && newTempo >= 40 && newTempo <= 240) {
                updateTempo(newTempo);
                hideBpmModal();
            }
        }
        
        // Subdivision modal functions
        function showSubdivisionModal() {
            document.getElementById('subdivisionModal').style.display = 'flex';
            updateSubdivisionSelection();
        }
        
        function hideSubdivisionModal() {
            document.getElementById('subdivisionModal').style.display = 'none';
        }
        
        function updateSubdivisionSelection() {
            // Remove selected class from all options
            document.querySelectorAll('.subdivision-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Add selected class to current subdivision
            const currentOption = document.querySelector('[data-subdivision="' + subdivision + '"]');
            if (currentOption) {
                currentOption.classList.add('selected');
            }
        }
        
        function selectSubdivision(newSubdivision) {
            subdivision = newSubdivision;
            
            // Restart if currently playing
            if (isPlaying) {
                stopMetronome();
                setTimeout(() => {
                    startMetronome();
                }, 10);
            }
            
            hideSubdivisionModal();
        }
        
        // Event listeners
        document.getElementById('playButton').addEventListener('click', () => {
            // Ensure audio context is initialized on first user interaction
            if (!audioContext) {
                if (!initAudio()) {
                    console.error('Failed to initialize audio context');
                    return;
                }
            }
            
            if (isPlaying) {
                stopMetronome();
            } else {
                startMetronome();
            }
        });
        
        document.getElementById('tempoSlider').addEventListener('input', (e) => {
            updateTempo(parseInt(e.target.value));
        });
        
        document.getElementById('minusBtn').addEventListener('click', () => {
            if (tempo > 40) {
                updateTempo(tempo - 1);
            }
        });
        
        document.getElementById('plusBtn').addEventListener('click', () => {
            if (tempo < 240) {
                updateTempo(tempo + 1);
            }
        });
        
        document.getElementById('tempoDisplay').addEventListener('click', showBpmModal);
        
        document.getElementById('tapBpmBtn').addEventListener('click', () => {
            // Ensure audio context is initialized on first user interaction
            if (!audioContext) {
                if (!initAudio()) {
                    console.error('Failed to initialize audio context');
                    return;
                }
            }
            
            if (isTapBpmActive) {
                tap();
            } else {
                startTapBpm();
            }
        });
        
        document.getElementById('tapBpmBtn').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (isTapBpmActive) {
                stopTapBpm();
            }
        });
        
        document.getElementById('subdivisionBtn').addEventListener('click', () => {
            // Ensure audio context is initialized on first user interaction
            if (!audioContext) {
                if (!initAudio()) {
                    console.error('Failed to initialize audio context');
                    return;
                }
            }
            showSubdivisionModal();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', hideBpmModal);
        document.getElementById('saveBtn').addEventListener('click', saveBpm);
        
        document.getElementById('subdivisionCancelBtn').addEventListener('click', hideSubdivisionModal);
        
        document.getElementById('bpmInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBpm();
            }
        });
        
        // Close modal when clicking outside
        document.getElementById('bpmModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('bpmModal')) {
                hideBpmModal();
            }
        });
        
        document.getElementById('subdivisionModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('subdivisionModal')) {
                hideSubdivisionModal();
            }
        });
        
        // Subdivision option click handlers
        document.querySelectorAll('.subdivision-option').forEach(option => {
            option.addEventListener('click', () => {
                const newSubdivision = parseInt(option.getAttribute('data-subdivision'));
                selectSubdivision(newSubdivision);
            });
        });
        
        // Initialize
        console.log('WebView JavaScript initialized');
        
        // Configure audio session for silent mode bypass
        if (typeof window.webkit !== 'undefined' && window.webkit.messageHandlers) {
            // iOS WebView - try to configure audio session
            console.log('iOS WebView detected, configuring audio session');
        }
        
        // Try to initialize audio context immediately for better silent mode support
        setTimeout(() => {
            if (!audioContext) {
                initAudio();
            }
        }, 100);
        
        // Add a global click handler to ensure audio context is initialized on first user interaction
        document.addEventListener('click', function() {
            if (!audioContext) {
                initAudio();
            }
        }, { once: true });
        
        updateTempoDisplay();
        
        // Settings button event listener
        document.getElementById('settingsButton').addEventListener('click', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'OPEN_SETTINGS'
          }));
        });
        
        // Handle messages from React Native
        window.addEventListener('message', function(event) {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'STOP_METRONOME') {
              console.log('Received STOP_METRONOME message');
              
              // Force stop the metronome
              isPlaying = false;
              
              // Clear any existing interval
              if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
              }
              
              // Reset beat count
              beatCount = 0;
              
              // Update play button appearance
              const playButton = document.getElementById('playButton');
              if (playButton) {
                playButton.classList.remove('playing');
                playButton.innerHTML = '<div class="play-icon"></div>';
              }
              
              // Reset tempo bar
              updateTempoBar(0);
              
              // Force stop any ongoing audio
              if (audioContext && audioContext.state !== 'closed') {
                audioContext.close();
              }
              
              console.log('Metronome forcefully stopped');
            } else if (message.type === 'REINITIALIZE_AUDIO') {
              console.log('Received REINITIALIZE_AUDIO message');
              const success = initAudio(); // Re-initialize audio context
              console.log('Audio context re-initialized:', success);
            }
          } catch (error) {
            console.log('Error parsing message:', error);
          }
        });

    </script>
</body>
</html>
  `;



  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsProtectedMedia={true}
        mixedContentMode="compatibility"
        onLoad={() => console.log('WebView loaded')}
        onError={(error) => console.log('WebView error:', error)}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'OPEN_SETTINGS' && onOpenSettings) {
              onOpenSettings();
            } else if (message.type === 'SOUND_CHANGE' && onSoundChange) {
              onSoundChange(message.sound);
            }
          } catch (error) {
            console.log('Error parsing WebView message:', error);
          }
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewMetronome; 