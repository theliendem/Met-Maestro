import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { configureWebViewAudioSession } from '../utils/audioSession';

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
  updateSound: (soundType: string) => void;
  updateColors: (colors: any) => void;
  resetWebView: () => void;
}

// Helper function to convert hex color to RGB
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '187, 134, 252';
};

const WebViewMetronome = forwardRef<WebViewMetronomeRef, WebViewMetronomeProps>(({ themeColors, onOpenSettings, soundType = 'synth', onSoundChange }, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [webViewKey, setWebViewKey] = useState(0); // For forcing WebView re-mount
  
  // Create methods object that can be used internally and exposed via ref
  const methods = {
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
          
          // Also inject JavaScript directly to ensure audio is reinitialized
          webViewRef.current.injectJavaScript(`
            (function() {
              console.log('Force reinitializing audio via JavaScript injection');
              if (typeof initAudio === 'function') {
                initAudio();
                console.log('Audio reinitialized via JavaScript injection');
              }
            })();
          `);
        } catch (error) {
          console.log('Error sending reinitialize message:', error);
        }
      }
    },
    updateSound: (soundType: string) => {
      console.log('WebViewMetronome: updateSound called with:', soundType);
      if (webViewRef.current) {
        try {
          // Send message to WebView to update sound type
          webViewRef.current.postMessage(JSON.stringify({
            type: 'SOUND_CHANGE',
            soundType: soundType
          }));
        } catch (error) {
          console.log('Error sending sound change message:', error);
        }
      }
    },
    updateColors: (colors: any) => {
      console.log('WebViewMetronome: updateColors called with:', colors);
      if (webViewRef.current) {
        try {
          // Send message to WebView to update colors
          webViewRef.current.postMessage(JSON.stringify({
            type: 'COLOR_CHANGE',
            colors: colors
          }));
        } catch (error) {
          console.log('Error sending color change message:', error);
        }
      }
    },
    resetWebView: () => {
      console.log('WebViewMetronome: resetWebView called');
      try {
        // Force re-mount the WebView by changing the key
        setWebViewKey(prev => prev + 1);
      } catch (error) {
        console.log('Error resetting WebView:', error);
      }
    }
  };

  // Expose methods via the ref
  useImperativeHandle(ref, () => methods);

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

  // HTML content for the complete metronome UI (memoized to prevent re-renders)
  const htmlContent = useMemo(() => `
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
        
        .subdivision-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        
        .subdivision-card {
            background: var(--surface);
            border: 1px solid var(--icon);
            border-radius: 12px;
            padding: 12px 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-height: 70px;
        }
        
        .subdivision-card:hover {
            border-color: var(--accent);
            background: rgba(var(--accent-rgb), 0.05);
        }
        
        .subdivision-card.selected {
            border-color: var(--accent);
            background: rgba(var(--accent-rgb), 0.1);
        }
        
        .subdivision-icon {
            font-size: 24px;
            line-height: 1;
            color: var(--text);
            transition: color 0.2s ease;
        }
        
        .subdivision-card.selected .subdivision-icon {
            color: var(--accent);
        }
        
        .subdivision-title {
            color: var(--text);
            font-size: 13px;
            font-weight: 500;
            margin: 0;
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
            width: 360px;
            max-width: 90vw;
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
        
        /* Troubleshooting Modal */
        .troubleshooting-modal {
            display: none;
            position: fixed;
            top: 10vh;
            left: 50%;
            transform: translateX(-50%);
            background: var(--surface);
            border-radius: 16px;
            padding: 24px;
            max-width: 90vw;
            width: 320px;
            z-index: 2000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--accent);
            flex-direction: column;
            align-items: center;
        }
        
        .troubleshooting-title {
            color: var(--text);
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 16px;
            text-align: center;
            width: 100%;
        }
        
        .troubleshooting-description {
            color: var(--text);
            font-size: 14px;
            margin-bottom: 24px;
            text-align: center;
            opacity: 0.8;
            line-height: 1.4;
            width: 100%;
        }
        
        .troubleshooting-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            width: 100%;
        }
        
        .troubleshooting-btn {
            border-radius: 8px;
            padding: 12px 24px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            border: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            transition: all 0.2s ease;
            flex: 1;
            max-width: 120px;
        }
        
        .troubleshooting-btn.dismiss {
            background: var(--light-gray);
            color: var(--text);
        }
        
        .troubleshooting-btn.reset {
            background: var(--accent);
            color: white;
        }
        
        .troubleshooting-btn:hover {
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
            <div class="subdivision-grid">
                <div class="subdivision-card" data-subdivision="1">
                    <div class="subdivision-icon">♪</div>
                    <div class="subdivision-title">None</div>
                </div>
                <div class="subdivision-card" data-subdivision="2">
                    <div class="subdivision-icon">♫</div>
                    <div class="subdivision-title">Eighth</div>
                </div>
                <div class="subdivision-card" data-subdivision="3">
                    <div class="subdivision-icon">♫♪</div>
                    <div class="subdivision-title">Triplet</div>
                </div>
                <div class="subdivision-card" data-subdivision="4">
                    <div class="subdivision-icon">♫♫</div>
                    <div class="subdivision-title">Sixteenth</div>
                </div>
                <div class="subdivision-card" data-subdivision="5">
                    <div class="subdivision-icon">♫♫♪</div>
                    <div class="subdivision-title">Quintuplet</div>
                </div>
                <div class="subdivision-card" data-subdivision="6">
                    <div class="subdivision-icon">♫♫♫</div>
                    <div class="subdivision-title">Sixtuplet</div>
                </div>
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel" id="subdivisionCancelBtn">Close</button>
            </div>
        </div>
    </div>
    
    <!-- Troubleshooting Modal -->
    <div class="troubleshooting-modal" id="troubleshootingModal">
        <div class="troubleshooting-title">Sound not working?</div>
        <div class="troubleshooting-description">
            If you're not hearing any sound, try resetting the app. This will refresh the audio system.
        </div>
        <div class="troubleshooting-buttons">
            <button class="troubleshooting-btn dismiss" id="dismissTroubleshootingBtn">Dismiss</button>
            <button class="troubleshooting-btn reset" id="resetWebViewBtn">Reset App</button>
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
        let pendingSubdivision = null; // New subdivision to apply on next downbeat
        let beatCount = 0; // Track which subdivision we're on within a beat
        let intervalId = null;
        let nextBeatTime = null; // Next scheduled beat time (ms since epoch)
        let tapTimes = [];
        let isTapBpmActive = false;
        let tapBpmTimeout = null;
        let currentSound = 'synth'; // Current sound type - will be updated dynamically
        let drbeatBuffer = null; // Audio buffer for drbeat sound
        
        // Rapid tap detection for troubleshooting
        let playButtonTaps = [];
        let rapidTapThreshold = 6; // Number of taps
        let rapidTapTimeWindow = 1500; // Time window in milliseconds
        
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
        
        // Rapid tap detection for troubleshooting
        function detectRapidTaps() {
            const now = Date.now();
            playButtonTaps.push(now);
            
            // Remove taps older than the time window
            playButtonTaps = playButtonTaps.filter(tapTime => now - tapTime <= rapidTapTimeWindow);
            
            // Check if we've hit the threshold
            if (playButtonTaps.length >= rapidTapThreshold) {
                console.log('Rapid tapping detected - showing troubleshooting modal');
                showTroubleshootingModal();
                playButtonTaps = []; // Reset the tap counter
            }
        }
        
        // Show troubleshooting modal
        function showTroubleshootingModal() {
            const modal = document.getElementById('troubleshootingModal');
            if (modal) {
                modal.style.display = 'flex';
                resetTroubleshootingTimer();
            }
        }
        
        // Hide troubleshooting modal
        function hideTroubleshootingModal() {
            const modal = document.getElementById('troubleshootingModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Reset WebView (equivalent to closing and reopening app)
        function resetWebView() {
            // Send message to React Native to reset the WebView
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'RESET_WEBVIEW'
            }));
            hideTroubleshootingModal();
        }
        
        // Timer for auto-hiding modal
        let troubleshootingTimer = null;
        function resetTroubleshootingTimer() {
            if (troubleshootingTimer) {
                clearTimeout(troubleshootingTimer);
            }
            troubleshootingTimer = setTimeout(() => {
                hideTroubleshootingModal();
            }, 10000); // 10 seconds
        }
        
        // Initialize audio context
        function initAudio() {
            try {
                // Close existing audio context if it exists
                if (audioContext && audioContext.state !== 'closed') {
                    console.log('Closing existing audio context');
                    audioContext.close();
                }
                
                console.log('Creating new audio context');
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
                
                // Load drbeat audio buffer
                loadDrbeatAudio();
                
                return true;
            } catch (e) {
                console.error('AudioContext not supported:', e);
                return false;
            }
        }
        
        // Load drbeat audio buffer
        async function loadDrbeatAudio() {
            try {
                const response = await fetch('assets/sounds/drbeat.mp3');
                if (!response.ok) {
                    throw new Error('HTTP error! status: ' + response.status);
                }
                const arrayBuffer = await response.arrayBuffer();
                drbeatBuffer = await audioContext.decodeAudioData(arrayBuffer);
                console.log('Drbeat audio loaded successfully');
            } catch (error) {
                console.error('Failed to load drbeat audio:', error);
                drbeatBuffer = null;
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
            } else if (currentSound === 'drbeat') {
                // Drbeat sound - play the loaded audio file
                if (drbeatBuffer) {
                    const source = audioContext.createBufferSource();
                    const gainNode = audioContext.createGain();
                    
                    source.buffer = drbeatBuffer;
                    
                    // Adjust volume based on downbeat
                    gainNode.gain.setValueAtTime(isDownbeat ? 1.0 : 0.8, startTime);
                    
                    source.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    source.start(startTime);
                } else {
                    // Fallback to synth sound if drbeat buffer is not loaded
                    console.warn('Drbeat buffer not loaded, falling back to synth sound');
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.frequency.setValueAtTime(isDownbeat ? 800 : 600, startTime);
                    gainNode.gain.setValueAtTime(isDownbeat ? 0.3 : 0.2, startTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.start(startTime);
                    oscillator.stop(startTime + duration);
                }
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
            
            // Start the interval with the smallest subdivision (base timing)
            const baseInterval = calculateInterval();
            nextBeatTime = Date.now() + baseInterval;
            
            intervalId = setInterval(() => {
                if (!isPlaying) return;
                
                const now = Date.now();
                
                // Check if we need to apply a pending subdivision change on the downbeat
                const currentIsDownbeat = (beatCount % subdivision) === 0;
                
                if (pendingSubdivision !== null && currentIsDownbeat) {
                    // Apply the pending subdivision change
                    subdivision = pendingSubdivision;
                    pendingSubdivision = null;
                    
                    // Reset beat count to start fresh with new subdivision
                    beatCount = 0;
                    
                    // Recalculate timing for new subdivision
                    const newInterval = calculateInterval();
                    nextBeatTime = now + newInterval;
                }
                
                // Check if it's time for the next beat
                if (now >= nextBeatTime - 10) { // 10ms tolerance
                    const isDownbeat = (beatCount % subdivision) === 0;
                    playClick(isDownbeat);
                    beatCount++;
                    
                    // Schedule next beat
                    const currentInterval = calculateInterval();
                    nextBeatTime += currentInterval;
                }
            }, 5); // Check every 5ms for precise timing
            
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
            
            // Apply any pending subdivision change when stopping
            if (pendingSubdivision !== null) {
                subdivision = pendingSubdivision;
                pendingSubdivision = null;
                updateSubdivisionSelection();
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
            
            // If playing, adjust scheduling without stopping
            if (isPlaying) {
                const now = Date.now();
                const newInterval = calculateInterval();
                // Schedule the next beat according to the new interval
                nextBeatTime = now + newInterval;
            }
        }
        
        // Tap BPM functionality
        function startTapBpm() {
            isTapBpmActive = true;
            tapTimes = [];
            document.getElementById('tapBpmBtn').classList.add('active');
            
            // Set timeout to auto-disengage after 5 seconds of inactivity
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
            
            // Only reset timeout if there's been a significant gap (indicating inactivity)
            // This prevents the timeout from resetting during active tapping
            if (tapTimes.length >= 2) {
                const lastInterval = now - tapTimes[tapTimes.length - 2];
                if (lastInterval > 2000) { // If gap is more than 2 seconds, reset timeout
                    if (tapBpmTimeout) {
                        clearTimeout(tapBpmTimeout);
                    }
                    tapBpmTimeout = setTimeout(() => {
                        stopTapBpm();
                    }, 5000);
                }
            }
            
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
            document.querySelectorAll('.subdivision-card').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Add selected class to the subdivision that will be active (current or pending)
            const activeSubdivision = pendingSubdivision !== null ? pendingSubdivision : subdivision;
            const currentOption = document.querySelector('[data-subdivision="' + activeSubdivision + '"]');
            if (currentOption) {
                currentOption.classList.add('selected');
            }
        }
        
        function selectSubdivision(newSubdivision) {
            if (isPlaying) {
                // If metronome is playing, queue the subdivision change for the next downbeat
                pendingSubdivision = newSubdivision;
            } else {
                // If not playing, apply immediately
                subdivision = newSubdivision;
            }
            
            // Don't close the modal - just update the selection
            updateSubdivisionSelection();
        }
        
        // Event listeners
        document.getElementById('playButton').addEventListener('click', () => {
            // Detect rapid tapping for troubleshooting
            detectRapidTaps();
            
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
        document.querySelectorAll('.subdivision-card').forEach(option => {
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
            console.log('Auto-initializing audio on WebView load');
            initAudio(); // Always reinitialize audio when WebView loads
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
        
        // Troubleshooting modal event listeners
        document.getElementById('dismissTroubleshootingBtn').addEventListener('click', () => {
            hideTroubleshootingModal();
        });
        
        document.getElementById('resetWebViewBtn').addEventListener('click', () => {
            resetWebView();
        });
        
        // Reset timer when user interacts with the troubleshooting modal
        document.getElementById('troubleshootingModal').addEventListener('click', (e) => {
            e.stopPropagation(); // Don't close when clicking inside modal
            resetTroubleshootingTimer(); // Reset the auto-hide timer
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
              
              // Stop any currently playing audio
              if (isPlaying) {
                isPlaying = false;
                if (intervalId) {
                  clearInterval(intervalId);
                  intervalId = null;
                }
              }
              
              // Close existing audio context completely
              if (audioContext && audioContext.state !== 'closed') {
                console.log('Closing existing audio context for reinit');
                audioContext.close();
                audioContext = null;
              }
              
              // Re-initialize audio context
              const success = initAudio();
              console.log('Audio context re-initialized:', success);
              
              // Reset UI state
              const playButton = document.getElementById('playButton');
              if (playButton) {
                playButton.classList.remove('playing');
                playButton.innerHTML = '<div class="play-icon"></div>';
              }
              beatCount = 0;
            } else if (message.type === 'SOUND_CHANGE') {
              console.log('Received SOUND_CHANGE message:', message.soundType);
              currentSound = message.soundType;
              console.log('Sound type updated to:', currentSound);
            } else if (message.type === 'COLOR_CHANGE') {
              console.log('Received COLOR_CHANGE message:', message.colors);
              // Update CSS custom properties
              const root = document.documentElement;
              const colors = message.colors;
              if (colors) {
                root.style.setProperty('--background', colors.background);
                root.style.setProperty('--surface', colors.surface);
                root.style.setProperty('--primary', colors.primary);
                root.style.setProperty('--text', colors.text);
                root.style.setProperty('--icon', colors.icon);
                root.style.setProperty('--accent', colors.accent);
                root.style.setProperty('--orange', colors.orange);
                // Update RGB version for transparency use
                const hexToRgb = (hex) => {
                  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
                  return result ? \`\${parseInt(result[1], 16)}, \${parseInt(result[2], 16)}, \${parseInt(result[3], 16)}\` : '187, 134, 252';
                };
                root.style.setProperty('--accent-rgb', hexToRgb(colors.accent));
                console.log('Colors updated');
              }
            } else if (message.type === 'RESET_WEBVIEW') {
              console.log('Received RESET_WEBVIEW message');
              // This will be handled by React Native to reload the WebView
            }
          } catch (error) {
            console.log('Error parsing message:', error);
          }
        });

    </script>
</body>
</html>
  `, [webViewKey]); // Only recalculate when WebView is intentionally reset



  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsProtectedMedia={true}
        mixedContentMode="compatibility"
        onLoad={() => {
          console.log('WebView loaded');
          // Give WebView a moment to initialize, then update everything
          setTimeout(() => {
            console.log('WebView loaded - updating sound, colors, and reinitializing audio');
            // Update sound to current value
            methods.updateSound(soundType);
            // Update colors to current values
            methods.updateColors(themeColors);
            // Reinitialize audio
            methods.reinitializeAudio();
          }, 200);
        }}
        onError={(error) => console.log('WebView error:', error)}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'OPEN_SETTINGS' && onOpenSettings) {
              onOpenSettings();
            } else if (message.type === 'SOUND_CHANGE' && onSoundChange) {
              onSoundChange(message.sound);
            } else if (message.type === 'RESET_WEBVIEW') {
              console.log('Handling RESET_WEBVIEW message in React Native');
              
              // Configure audio session first
              configureWebViewAudioSession();
              
              // Reset the WebView by re-mounting it
              setWebViewKey(prev => prev + 1);
              
              // After WebView resets, restore settings and reinitialize audio system
              setTimeout(() => {
                console.log('First restore after WebView reset - updating sound, colors, and reinitializing audio');
                configureWebViewAudioSession(); // Reconfigure audio session
                methods.updateSound(soundType); // Restore sound setting
                methods.updateColors(themeColors); // Restore color settings
                methods.reinitializeAudio();
              }, 200);
              
              setTimeout(() => {
                console.log('Second reinitialize after WebView reset');
                methods.reinitializeAudio();
              }, 500);
              
              setTimeout(() => {
                console.log('Final reinitialize after WebView reset');
                methods.reinitializeAudio();
              }, 1000);
            }
          } catch (error) {
            console.log('Error parsing WebView message:', error);
          }
        }}
      />
    </View>
  );
});

WebViewMetronome.displayName = 'WebViewMetronome';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewMetronome; 