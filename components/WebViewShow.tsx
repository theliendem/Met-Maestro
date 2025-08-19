import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface WebViewShowProps {
  themeColors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    icon: string;
    accent: string;
    orange: string;
    fontSize: string;
  };
  shows?: {
    id: string;
    name: string;
    measures: {
      id: string;
      timeSignature: { numerator: number; denominator: number };
      tempo: number;
      count: number;
      letter?: string;
    }[];
    createdAt: string;
    updatedAt: string;
  }[];
  selectedShow?: string;
  onAddShow?: () => void;
  onSelectShow?: (showId: string) => void;
  onRenameShow?: (showId: string, newName: string) => void;
  onUpdateShowMeasures?: (showId: string, measures: any[]) => void;
  onDeleteShow?: (showId: string) => void;
  onMessage?: (event: any) => void;
  onMeasureCompleted?: (measure: number, beatsPerMeasure: number, tempo: number) => void;
  onOpenSettings?: () => void;
  soundType?: string;
  onSoundChange?: (soundType: string) => void;
}

export interface WebViewShowRef {
  injectJavaScript: (script: string) => void;
}

const WebViewShow = forwardRef<WebViewShowRef, WebViewShowProps>(({ 
  themeColors, 
  shows = [], 
  selectedShow, 
  onAddShow, 
  onSelectShow, 
  onRenameShow, 
  onUpdateShowMeasures, 
  onDeleteShow,
  onMessage,
  onMeasureCompleted,
  onOpenSettings,
  soundType,
  onSoundChange
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [playbackOptions, setPlaybackOptions] = React.useState({
    startType: 'beginning',
    startMeasure: '1',
    startLetter: '',
    endType: 'beginning',
    endMeasure: '1',
    endLetter: ''
  });

  // Expose injectJavaScript method to parent component
  useImperativeHandle(ref, () => ({
    injectJavaScript: (script: string) => {
      webViewRef.current?.injectJavaScript(script);
    }
  }));

  // Load playback options from AsyncStorage
  useEffect(() => {
    loadPlaybackOptions();
  }, []);

  const loadPlaybackOptions = async () => {
    try {
      const savedOptions = await AsyncStorage.getItem('playbackOptions');
      if (savedOptions) {
        const options = JSON.parse(savedOptions);
        setPlaybackOptions(options);
      }
    } catch (error) {
      console.error('Error loading playback options:', error);
    }
  };
  
  // Update WebView when shows data changes
  React.useEffect(() => {
    if (webViewRef.current) {
      // Use a timeout to ensure the WebView is ready
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          if (window.updateShowsData) {
            window.updateShowsData(${JSON.stringify(shows)}, '${selectedShow}');
          }
        `);
      }, 100);
    }
  }, [shows, selectedShow]);

  // Update WebView when sound type changes
  React.useEffect(() => {
    if (webViewRef.current && soundType) {
      // Use a timeout to ensure the WebView is ready
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          if (window.updateSoundType) {
            window.updateSoundType('${soundType}');
          }
        `);
      }, 100);
    }
  }, [soundType]);

  // Update WebView when playback options change
  React.useEffect(() => {
    if (webViewRef.current) {
      // Use a timeout to ensure the WebView is ready
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          if (window.updatePlaybackOptions) {
            window.updatePlaybackOptions(${JSON.stringify(playbackOptions)});
          }
        `);
      }, 100);
    }
  }, [playbackOptions]);

  // Function to update beats per measure
  const updateBeatsPerMeasure = React.useCallback((beatsPerMeasure: number) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.updateBeatsPerMeasure) {
          window.updateBeatsPerMeasure(${beatsPerMeasure});
        }
      `);
    }
  }, []);

  // HTML content for the complete show UI
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Show Mode</title>
    <style>
        :root {
            --background: ${themeColors.background};
            --surface: ${themeColors.surface};
            --primary: ${themeColors.primary};
            --text: ${themeColors.text};
            --icon: ${themeColors.icon};
            --accent: ${themeColors.accent};
            --orange: ${themeColors.orange};
            --font-size: ${themeColors.fontSize};
            --white: #ffffff;
            --dark-gray: #202127;
            --medium-gray: #23242A;
            --light-gray: #333;
            --input-bg: #181A20;
            --red: #e53935;
            --accent-10: ${themeColors.accent}1A;
            --accent-30: ${themeColors.accent}4D;
            --accent-40: ${themeColors.accent}66;
            --accent-70: ${themeColors.accent}B3;
            --measure-manager-margin-bottom: ${Platform.OS === 'android' ? '0' : '100px'};
            --measure-manager-max-height: ${Platform.OS === 'android' ? 'none' : '60vh'};
            --measure-manager-height: ${Platform.OS === 'android' ? 'calc(100vh - 300px)' : 'auto'};
            --settings-button-bottom: ${Platform.OS === 'android' ? '4vh' : '15vh'};
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html {
            height: 100%;
            overflow: hidden;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--background);
            color: var(--text);
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            padding: 10px;
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
            display: flex;
            flex-direction: column;
            height: 100%;
            gap: 4px;
            padding-top: 5vh;
        }
        

        

        

        
        /* Playback Range Display */
        .playback-range-container {
            display: flex;
            margin-bottom: 4px;
            border-radius: 16px;
            padding: 2vh 8px;
            // box-shadow: 0 0 10px rgba(0,0,0,0.2);
            height: calc(36px + 4vh);
            align-items: center;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            transition: all 0.2s ease;
        }
        
        .playback-range-container:hover {
            opacity: 0.8;
        }
        
        .playback-range-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            color: var(--text);
            font-size: var(--font-size);
        }
        
        .playback-range-label {
            font-size: var(--font-size);
            font-weight: 600;
            margin-bottom: 2px;
            opacity: 0.8;
        }
        
        .playback-range-display {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: calc(var(--font-size) * 1.2);
            font-weight: bold;
        }
        
        .playback-start {
            color: var(--accent);
            font-size: calc(var(--font-size) * 1.2);
        }
        
        .playback-separator {
            color: var(--icon);
            font-weight: normal;
            font-size: calc(var(--font-size) * 1.2);
        }
        
        .playback-end {
            color: var(--accent);
            font-size: calc(var(--font-size) * 1.2);
        }
        
        /* Tempo Bar */
        .tempo-bar-container {
            display: flex;
            margin-bottom: 4px;
            background-color: var(--dark-gray);
            border-radius: 16px;
            padding: 1vh 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            align-items: stretch;
            gap: 3px;
        }
        
        .tempo-bar {
            flex: 1;
            display: flex;
            gap: 2px;
            height: 100%;
        }
        
        .tempo-segment {
            flex: 1;
            background-color: var(--medium-gray);
            border-radius: 6px;
            transition: all 0.1s ease;
            height: 100%;
        }
        
        .tempo-segment.active {
            background-color: var(--accent);
-            box-shadow: 0 0 8px rgba(187,134,252,0.4);
+            box-shadow: 0 0 8px var(--accent-40);
        }
        
        .tempo-segment.silent-beat {
            background-color: var(--medium-gray);
            box-shadow: 0 0 12px var(--accent-70), 0 0 4px var(--accent-40);
        }
        
        .tempo-segment.count-off-segment {
            background-color: var(--medium-gray);
        }
        
        .tempo-segment.count-off-segment.active {
            background-color: var(--orange);
            box-shadow: 0 0 8px rgba(255,165,0,0.4);
        }
        
        .tempo-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-width: 80px;
            color: var(--text);
            font-size: var(--font-size);
            font-weight: 600;
        }
        
        .tempo-bpm {
            font-size: var(--font-size);
            font-weight: bold;
            color: var(--accent);
        }
        
        .tempo-time-signature {
            font-size: var(--font-size);
            opacity: 0.7;
        }
        
        .measure-button {
            font-size: var(--font-size);
            font-weight: bold;
            color: var(--accent);
            background-color: transparent;
            border: 2px solid var(--accent);
            border-radius: 8px;
            padding: 4px 10px;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            transition: all 0.2s ease;
            min-width: 60px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0;
        }
        
        .measure-number {
            font-size: var(--font-size);
            font-weight: bold;
        }
        
        .measure-total {
            font-size: var(--font-size);
            opacity: 0.7;
        }
        
        .measure-total.count-off {
            font-size: var(--font-size);
            font-weight: bold;
            opacity: 1;
        }
        
        .measure-button:hover {
            background-color: rgba(var(--accent-rgb), 0.1);
        }
        
        /* Show Manager Row */
        .show-manager-row {
            display: flex;
            margin-bottom: 4px;
            background-color: var(--dark-gray);
            border-radius: 16px;
            padding: 2vh 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            height: calc(36px + 4vh);
            align-items: center;
        }
        
        .show-scroll {
            display: flex;
            flex: 1;
            overflow-x: auto;
            align-items: center;
            gap: 8px;
        }
        
        .icon-button {
            background-color: var(--medium-gray);
            border-radius: 16px;
            padding: 8px;
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            transition: all 0.2s ease;
        }
        
        .icon-button:hover {
            background-color: var(--accent);
        }
        
        .show-chip {
            background-color: var(--medium-gray);
            border-radius: 12px;
            padding: 4px 16px;
            margin-right: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            font-size: var(--font-size);
        }
        
        .show-chip.active {
            background-color: var(--accent);
        }
        
        .icon-button-small {
            background-color: var(--accent);
            border-radius: 12px;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
        
        /* Measure Manager */
        .measure-manager {
            flex: 1;
            background-color: var(--dark-gray);
            border-radius: 16px;
            padding: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: var(--measure-manager-margin-bottom);
            max-height: var(--measure-manager-max-height);
            height: var(--measure-manager-height);
        }
        

        
        .measure-header {
            display: flex;
            align-items: center;
            margin-bottom: 2px;
        }
        
        .add-measure-btn {
            background-color: transparent;
            border: 1px solid var(--accent);
            border-radius: 8px;
            padding: 8px 16px;
            color: var(--text);
            cursor: pointer;
            font-size: var(--font-size);
            display: flex;
            align-items: center;
            gap: 8px;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
        
        .add-measure-btn:hover {
            background-color: var(--accent-10);
        }
        
        .condensed-toggle {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .toggle-switch {
            width: 40px;
            height: 20px;
            background-color: var(--light-gray);
            border-radius: 10px;
            position: relative;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .toggle-switch.active {
            background-color: var(--accent);
        }
        
        .toggle-switch::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 16px;
            height: 16px;
            background-color: var(--white);
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        
        .toggle-switch.active::after {
            transform: translateX(20px);
        }
        
        .measure-list {
            flex: 1;
            overflow-y: auto;
            max-height: ${Platform.OS === 'android' ? 'calc(100vh - 350px)' : '45vh'};
        }
        
        .measure-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--medium-gray);
            border-radius: 12px;
            padding: 8px;
            margin-bottom: 2px;
            font-size: var(--font-size);
        }
        
        .measure-info {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .measure-actions {
            display: flex;
            gap: 4px;
        }
        
        .empty-state {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.5;
        }
        

        
        /* Play Button */
        .play-button-container {
            position: fixed;
            bottom: 17vh;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10;
        }
        
        .play-button {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            border: 2px solid var(--accent);
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            box-shadow: 0 0 16px var(--accent-70);
        }
        
        .play-button:hover {
            box-shadow: 0 0 16px var(--accent-70);
        }
        
        .play-button.playing {
            border: 2px solid var(--orange);
            box-shadow: 0 0 16px rgba(255, 165, 38, 0.7);
        }
        
        .play-icon {
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 10px 0 10px 18px;
            border-color: transparent transparent transparent var(--white);
            margin-left: 3px;
            transition: all 0.3s ease;
        }
        
        .stop-icon {
            width: 16px;
            height: 16px;
            background-color: var(--white);
            border-radius: 2px;
            transition: all 0.3s ease;
        }
        
        /* Animation for icon morphing */
        .icon-container {
            position: relative;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .icon-container .play-icon,
        .icon-container .stop-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        
        .icon-container .play-icon {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        
        .icon-container .stop-icon {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
        
        .icon-container.playing .play-icon {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
        
        .icon-container.playing .stop-icon {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        
        /* Modals */
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
            padding: 24px;
            width: 320px;
            max-width: 90vw;
        }
        
        .modal-title {
            color: var(--text);
            font-size: var(--font-size);
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .input-group {
            margin-bottom: 8px;
        }
        
        .input-label {
            color: var(--text);
            margin-bottom: 4px;
            font-size: var(--font-size);
        }
        
        .input {
            background: var(--input-bg);
            color: var(--text);
            border-radius: 8px;
            padding: 12px;
            border: 1px solid var(--light-gray);
            width: 100%;
            font-size: var(--font-size);
        }
        
        .input-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .input-row .input {
            flex: 1;
        }
        
        .modal-buttons {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }
        
        .modal-btn {
            border-radius: 8px;
            padding: 8px 16px;
            font-weight: bold;
            font-size: var(--font-size);
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
        
        .modal-btn.delete {
            background: var(--red);
            color: var(--white);
        }
        
        .modal-actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }
        
        .action-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 20px;
        }
        
        .btn {
            flex: 1;
            padding: 12px 16px;
            border: none;
            border-radius: 8px;
            font-size: var(--font-size);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: center;
        }
        
        .btn-primary {
            background: var(--accent);
            color: var(--white);
        }
        
        .btn-secondary {
            background: var(--medium-gray);
            color: var(--text);
        }
        
        .btn-danger {
            background: var(--red);
            color: var(--white);
        }
        
        .modal-btn.outline {
            background: transparent;
            border: 1px solid var(--accent);
            color: var(--text);
        }
        
        /* Beat Sound Configuration Styles */
        .beat-sound-description {
            color: var(--text);
            font-size: 14px;
            margin-bottom: 20px;
            text-align: center;
            opacity: 0.8;
        }
        
        .beat-sound-grid {
            display: grid;
            gap: 8px;
            margin: 20px 0;
            padding-bottom: 30px;
            justify-content: center;
            overflow-x: auto;
        }
        
        .beat-sound-row {
            display: grid;
            gap: 8px;
            align-items: center;
        }
        
        .beat-sound-label {
            color: var(--text);
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
        }
        
        .beat-sound-cell-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        
        .beat-sound-cell {
            width: 100%;
            aspect-ratio: 1;
            min-width: 24px;
            max-width: 48px;
            border: 2px solid var(--light-gray);
            border-radius: 4px;
            background: var(--surface);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .beat-sound-cell:hover {
            border-color: var(--accent);
            background: rgba(var(--accent-rgb), 0.1);
        }
        
        .beat-sound-cell.selected {
            background: var(--accent);
            border-color: var(--accent);
        }
        
        
        .beat-number {
            color: var(--text);
            font-size: 12px;
            font-weight: 500;
            text-align: center;
        }
        
        /* Snackbar removed */
        
        /* Settings Button */
        .settings-button {
            position: fixed;
            bottom: var(--settings-button-bottom);
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

        

        

        
        <!-- Playback Range Display -->
        <div class="playback-range-container" id="playbackRangeContainer">
            <div class="playback-range-info">
                <div class="playback-range-display" id="playbackRangeDisplay">
                    <span class="playback-start" id="playbackStart">Beginning</span>
                    <span class="playback-separator">→</span>
                    <span class="playback-end" id="playbackEnd">End</span>
                </div>
            </div>
        </div>
        
        <!-- Tempo Bar -->
        <div class="tempo-bar-container">
            <div class="tempo-bar" id="tempoBar">
                <!-- Tempo segments will be dynamically generated here -->
            </div>
            <div class="tempo-info">
                <button class="measure-button" id="measureButton">
                    <div class="measure-number" id="measureNumber">-</div>
                    <div class="measure-total" id="measureTotal">of 0</div>
                </button>
            </div>
        </div>
        
        <!-- Show Manager Row -->
        <div class="show-manager-row">
            <div class="show-scroll" id="showScroll">
                <div class="icon-button" id="addShowBtn" title="Add Show">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </div>
                <div class="icon-button" id="importShowBtn" title="Import Show">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7,10 12,15 17,10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </div>
            </div>
        </div>
        
        <!-- Measure Manager -->
        <div class="measure-manager">
            <div class="measure-header">
                <button class="add-measure-btn" id="addMeasureBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Measures
                </button>
                <div class="condensed-toggle">
                    <span style="color: var(--white); margin-right: 6px; font-size: var(--font-size);">Condensed</span>
                    <div class="toggle-switch active" id="condensedToggle"></div>
                </div>
            </div>
            
            <div class="measure-list" id="measureList">
                <!-- Measures will be dynamically populated here -->
            </div>
        </div>
        
        <!-- Play Button -->
        <div class="play-button-container">
            <button class="play-button" id="playButton">
                <div class="icon-container" id="iconContainer">
                    <div class="play-icon"></div>
                    <div class="stop-icon"></div>
                </div>
            </button>
        </div>
        

    </div>
    
    <!-- Add Measure Modal -->
    <div class="modal" id="addMeasureModal">
        <div class="modal-content">
            <div class="modal-title">Add Measures</div>
            <div class="input-group">
                <div class="input-label">Number of measures (1-500)</div>
                <input type="text" class="input" id="numMeasuresInput" value="1" inputmode="numeric" pattern="[0-9]*">
            </div>
            <div class="input-group">
                <div class="input-label">Tempo (BPM) (40-300)</div>
                <input type="text" class="input" id="tempoInput" value="120" inputmode="numeric" pattern="[0-9]*">
            </div>
            <div class="input-group">
                <div class="input-label">Time Signature</div>
                <div class="input-row">
                    <input type="text" class="input" id="numeratorInput" value="4" inputmode="numeric" pattern="[0-9]*">
                    <span style="color: var(--text); font-weight: 600; font-size: var(--font-size);">/</span>
                    <input type="text" class="input" id="denominatorInput" value="4" inputmode="numeric" pattern="[0-9]*">
                </div>
            </div>
            <div class="input-group">
                <div class="input-label">Section Letter (Optional)</div>
                <select class="input" id="letterInput" style="background: var(--input-bg); color: var(--text); border: 1px solid var(--light-gray); border-radius: 8px; padding: 12px; font-size: var(--font-size);">
                    <option value="">None</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                    <option value="H">H</option>
                    <option value="I">I</option>
                    <option value="J">J</option>
                    <option value="K">K</option>
                    <option value="L">L</option>
                    <option value="M">M</option>
                    <option value="N">N</option>
                    <option value="O">O</option>
                    <option value="P">P</option>
                    <option value="Q">Q</option>
                    <option value="R">R</option>
                    <option value="S">S</option>
                    <option value="T">T</option>
                    <option value="U">U</option>
                    <option value="V">V</option>
                    <option value="W">W</option>
                    <option value="X">X</option>
                    <option value="Y">Y</option>
                    <option value="Z">Z</option>
                </select>
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel" id="addMeasureCancelBtn">Cancel</button>
                <button class="modal-btn save" id="addMeasureSaveBtn">Add</button>
            </div>
        </div>
    </div>
    
    <!-- Edit Show Modal -->
    <div class="modal" id="editShowModal">
        <div class="modal-content">
            <div class="modal-title">Edit Show</div>
            <div class="input-group">
                <div class="input-label">Show Name</div>
                <input type="text" class="input" id="showNameInput" value="Show 1">
            </div>
            <button class="modal-btn outline" id="exportShowBtn" style="margin-top: 12px; width: 100%;">Export as File</button>
            <button class="modal-btn delete" id="deleteShowBtn" style="margin-top: 8px; width: 100%;">Delete Show</button>
            <div class="modal-buttons" style="margin-top: 16px;">
                <button class="modal-btn cancel" id="editShowCancelBtn">Cancel</button>
                <button class="modal-btn save" id="editShowSaveBtn">Save</button>
            </div>
        </div>
    </div>
    
    <!-- Import Conflict Modal -->
    <div class="modal" id="importConflictModal">
        <div class="modal-content">
            <div class="modal-title">Import Conflict</div>
            <div style="color: var(--text); margin-bottom: 16px; font-size: var(--font-size);">
                A show with the same ID already exists. Would you like to replace it or import as a copy?
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel" id="importConflictCancelBtn">Cancel</button>
                <button class="modal-btn outline" id="importAsCopyBtn">Import as Copy</button>
                <button class="modal-btn save" id="replaceShowBtn">Replace</button>
            </div>
        </div>
    </div>
    
    <!-- Edit Measures Modal -->
    <div class="modal" id="editMeasuresModal">
        <div class="modal-content">
            <div class="modal-title">Edit Measures</div>
            <div class="input-group">
                <div class="input-label">Number of measures</div>
                <input type="text" class="input" id="editNumMeasuresInput" value="1" inputmode="numeric" pattern="[0-9]*" disabled>
            </div>
            <div class="input-group">
                <div class="input-label">Tempo (BPM)</div>
                <input type="text" class="input" id="editTempoInput" value="120" inputmode="numeric" pattern="[0-9]*">
            </div>
            <div class="input-group">
                <div class="input-label">Time Signature</div>
                <div class="input-row">
                    <input type="text" class="input" id="editNumeratorInput" value="4" inputmode="numeric" pattern="[0-9]*">
                    <span style="color: var(--text); font-weight: 600; font-size: var(--font-size);">/</span>
                    <input type="text" class="input" id="editDenominatorInput" value="4" inputmode="numeric" pattern="[0-9]*">
                </div>
            </div>
            <div class="input-group">
                <div class="input-label">Section Letter (Optional)</div>
                <select class="input" id="editLetterInput" style="background: var(--input-bg); color: var(--text); border: 1px solid var(--light-gray); border-radius: 8px; padding: 12px; font-size: var(--font-size);">
                    <option value="">None</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                    <option value="H">H</option>
                    <option value="I">I</option>
                    <option value="J">J</option>
                    <option value="K">K</option>
                    <option value="L">L</option>
                    <option value="M">M</option>
                    <option value="N">N</option>
                    <option value="O">O</option>
                    <option value="P">P</option>
                    <option value="Q">Q</option>
                    <option value="R">R</option>
                    <option value="S">S</option>
                    <option value="T">T</option>
                    <option value="U">U</option>
                    <option value="V">V</option>
                    <option value="W">W</option>
                    <option value="X">X</option>
                    <option value="Y">Y</option>
                    <option value="Z">Z</option>
                </select>
            </div>
            <div class="input-group">
                <button class="modal-btn outline" id="beatSoundConfigBtn" style="width: 100%; margin-bottom: 16px;">Configure Beat Sounds</button>
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel" id="editMeasuresCancelBtn">Cancel</button>
                <button class="modal-btn delete" id="deleteMeasuresBtn">Delete</button>
                <button class="modal-btn save" id="editMeasuresSaveBtn">Save</button>
            </div>
        </div>
    </div>
    
    <!-- Beat Sound Configuration Modal -->
    <div class="modal" id="beatSoundModal">
        <div class="modal-content" style="max-width: 95vw; width: fit-content; min-width: 350px;">
            <div class="modal-title">Configure Beat Sounds</div>
            <div class="beat-sound-description">
                Select which beats should play high or low sounds. Each column represents a beat in the measure.
            </div>
            <div class="beat-sound-grid" id="beatSoundGrid">
                <!-- Grid will be populated dynamically -->
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel" id="beatSoundCancelBtn">Cancel</button>
                <button class="modal-btn save" id="beatSoundSaveBtn">Save</button>
            </div>
        </div>
    </div>
    
    <!-- Edit Show Modal -->
    <div class="modal" id="editShowModal">
        <div class="modal-content">
            <div class="modal-title">Edit Show</div>
            
            <div class="input-group">
                <div class="input-label">Show Name</div>
                <input type="text" class="input" id="editShowNameInput" value="Show 1">
            </div>
            
            <div class="action-buttons">
                <button class="btn btn-secondary" id="exportShowBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7,10 12,15 17,10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Export to File
                </button>
                
                <button class="btn btn-danger" id="deleteShowBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete Show
                </button>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-secondary" id="cancelEditShowBtn">Cancel</button>
                <button class="btn btn-primary" id="saveEditShowBtn">Save</button>
            </div>
        </div>
    </div>
    
    <!-- Settings Button -->
    <div class="settings-button" id="settingsButton">
        <svg class="settings-icon" viewBox="0 0 24 24">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
        </svg>
    </div>
    
    <!-- Snackbar removed -->

    <script>
        // Show data from React Native
        let shows = ${JSON.stringify(shows)};
        let selectedShow = '${selectedShow || '1'}';
        let currentSound = '${soundType || 'synth'}'; // Current sound type
        
        // Playback options from React Native
        let playbackOptions = ${JSON.stringify(playbackOptions)};
        
        // Function to update shows data from React Native
        function updateShowsData(newShows, newSelectedShow) {
            console.log('WebView: updateShowsData called, condensedView before:', condensedView, 'skipNextRender:', window.skipNextRender);
            
            // If this is a result of a local update, just update the data without re-rendering
            if (window.skipNextRender) {
                console.log('WebView: Skipping render due to skipNextRender flag');
                shows = newShows;
                selectedShow = newSelectedShow;
                window.skipNextRender = false;
                return;
            }
            
            // Preserve the current condensedView state
            const wasCondensed = condensedView;
            
            shows = newShows;
            selectedShow = newSelectedShow;
            renderShows();
            
            // Restore condensedView state and update toggle UI
            condensedView = wasCondensed;
            console.log('WebView: condensedView restored to:', condensedView);
            
            const toggle = document.getElementById('condensedToggle');
            if (toggle) {
                if (condensedView) {
                    toggle.classList.add('active');
                } else {
                    toggle.classList.remove('active');
                }
                console.log('WebView: toggle UI updated, active classes:', toggle.classList.contains('active'));
            }
            
            // Render measures for the initially selected show
            if (selectedShow) {
                const selectedShowData = shows.find(s => s.id === selectedShow);
                if (selectedShowData) {
                    renderMeasures(selectedShowData);
                }
            }
        }
        
        // Function to update sound type from React Native
        function updateSoundType(newSoundType) {
            console.log('Updating sound type:', newSoundType);
            currentSound = newSoundType;
        }
        
        // Function to update playback options from React Native
        function updatePlaybackOptions(newOptions) {
            console.log('Updating playback options:', newOptions);
            playbackOptions = newOptions;
            updatePlaybackRangeDisplay();
        }
        
        // Function to calculate start position based on playback options
        function calculateStartPosition(show) {
            if (!show || !show.measures || show.measures.length === 0) {
                return 0;
            }
            
            if (playbackOptions.startType === 'beginning') {
                return 0;
            } else if (playbackOptions.startType === 'measure') {
                const measureIndex = parseInt(playbackOptions.startMeasure) - 1;
                return Math.max(0, Math.min(measureIndex, show.measures.length - 1));
            } else if (playbackOptions.startType === 'letter') {
                if (!playbackOptions.startLetter) {
                    return 0;
                }
                
                // Find the first measure with the specified letter
                for (let i = 0; i < show.measures.length; i++) {
                    if (show.measures[i].letter === playbackOptions.startLetter) {
                        return i;
                    }
                }
                return 0; // If letter not found, start from beginning
            }
            
            return 0;
        }
        
        // Function to calculate end position based on playback options
        function calculateEndPosition(show) {
            if (!show || !show.measures || show.measures.length === 0) {
                return 0;
            }
            
            if (playbackOptions.endType === 'beginning') {
                return show.measures.length; // End at the end of the show
            } else if (playbackOptions.endType === 'measure') {
                const measureIndex = parseInt(playbackOptions.endMeasure);
                return Math.max(1, Math.min(measureIndex, show.measures.length));
            } else if (playbackOptions.endType === 'letter') {
                if (!playbackOptions.endLetter) {
                    return show.measures.length; // End at the end of the show
                }
                
                // Find the first measure with the specified letter
                for (let i = 0; i < show.measures.length; i++) {
                    if (show.measures[i].letter === playbackOptions.endLetter) {
                        return i; // Stop before this measure
                    }
                }
                return show.measures.length; // If letter not found, end at the end
            }
            
            return show.measures.length;
        }
        
        // Function to get used letters from current show
        function getUsedLetters(show) {
            if (!show || !show.measures) return [];
            return show.measures
                .map(measure => measure.letter)
                .filter(letter => letter && letter.trim() !== '')
                .filter((letter, index, arr) => arr.indexOf(letter) === index); // Remove duplicates
        }
        
        // Function to get available letters (not used in current show)
        function getAvailableLetters(show) {
            const usedLetters = getUsedLetters(show);
            const allLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            return allLetters.filter(letter => !usedLetters.includes(letter));
        }
        
        // Function to update letter dropdown options
        function updateLetterDropdown(dropdownId, show, currentLetter = '') {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;
            
            // Clear existing options except "None"
            dropdown.innerHTML = '<option value="">None</option>';
            
            // Get available letters
            const availableLetters = getAvailableLetters(show);
            
            // Add available letters as options
            availableLetters.forEach(letter => {
                const option = document.createElement('option');
                option.value = letter;
                option.textContent = letter;
                dropdown.appendChild(option);
            });
            
            // Set current value if provided
            if (currentLetter && availableLetters.includes(currentLetter)) {
                dropdown.value = currentLetter;
            } else {
                dropdown.value = '';
            }
        }
        
        // Function to render shows
        function renderShows() {
            const showScroll = document.getElementById('showScroll');
            const existingShows = showScroll.querySelectorAll('.show-chip');
            existingShows.forEach(chip => chip.remove());
            
            shows.forEach(show => {
                const showChip = document.createElement('div');
                showChip.className = 'show-chip';
                showChip.setAttribute('data-show-id', show.id);
                if (show.id === selectedShow) {
                    showChip.classList.add('active');
                }
                
                showChip.innerHTML = \`
                    <span>\${show.name}</span>
                    <div class="icon-button-small edit-show-btn" title="Edit Show" data-show-id="\${show.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>
                \`;
                
                showChip.addEventListener('click', () => {
                    document.querySelectorAll('.show-chip').forEach(c => c.classList.remove('active'));
                    showChip.classList.add('active');
                    selectedShow = show.id;
                    
                    // Send message to React Native
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'SELECT_SHOW',
                        showId: show.id
                    }));
                    
                    // Render measures for the selected show
                    renderMeasures(show);
                    
                    // Update measure display to show total measures
                    updateMeasureDisplay();
                    
                    // Update playback range display
                    updatePlaybackRangeDisplay();
                });
                
                showScroll.appendChild(showChip);
            });
            
            // Update measure display for initially selected show
            updateMeasureDisplay();
            
            // Update playback range display
            updatePlaybackRangeDisplay();
        }
        
        // Function to update playback range display
        function updatePlaybackRangeDisplay() {
            const startElement = document.getElementById('playbackStart');
            const endElement = document.getElementById('playbackEnd');
            
            // Get current show for letter validation
            const currentShowData = shows.find(s => s.id === selectedShow);
            const availableLetters = currentShowData?.measures
                ?.map(measure => measure.letter)
                ?.filter(letter => letter && letter.trim() !== '')
                ?.filter((letter, index, arr) => arr.indexOf(letter) === index)
                ?.sort() || [];
            
            // Format start display
            let startText = 'Beginning';
            if (playbackOptions.startType === 'measure') {
                startText = \`Measure \${playbackOptions.startMeasure}\`;
            } else if (playbackOptions.startType === 'letter') {
                if (playbackOptions.startLetter && availableLetters.includes(playbackOptions.startLetter)) {
                    startText = \`Letter \${playbackOptions.startLetter}\`;
                } else {
                    startText = 'Beginning';
                }
            }
            
            // Format end display
            let endText = 'End';
            if (playbackOptions.endType === 'measure') {
                endText = \`Measure \${playbackOptions.endMeasure}\`;
            } else if (playbackOptions.endType === 'letter') {
                if (playbackOptions.endLetter && availableLetters.includes(playbackOptions.endLetter)) {
                    endText = \`Letter \${playbackOptions.endLetter}\`;
                } else {
                    endText = 'End';
                }
            }
            
            startElement.textContent = startText;
            endElement.textContent = endText;
        }
        
        // Function to render measures for a show
        function renderMeasures(show) {
            console.log('Rendering measures with condensedView:', condensedView);
            const measureList = document.getElementById('measureList');
            // Store current scroll position
            const scrollTop = measureList.scrollTop;
            measureList.innerHTML = '';
            
            if (!show.measures || show.measures.length === 0) {
                measureList.innerHTML = '<div class="empty-state">No measures in this show</div>';
                return;
            }
            let toRender;
            if (condensedView) {
                // Group consecutive measures with the same time signature, tempo, and letter
                console.log('Grouping measures in condensed view...');
                const clumped = [];
                for (let i = 0; i < show.measures.length; i++) {
                    const m = show.measures[i];
                    const lastClumped = clumped.length > 0 ? clumped[clumped.length - 1] : null;
                    
                    if (
                        lastClumped &&
                        lastClumped.timeSignature.numerator === m.timeSignature.numerator &&
                        lastClumped.timeSignature.denominator === m.timeSignature.denominator &&
                        lastClumped.tempo === m.tempo &&
                        lastClumped.letter === m.letter &&
                        compareBeatSounds(lastClumped.beatSounds, m.beatSounds)
                    ) {
                        console.log('Grouping measure', i+1, 'with previous group');
                        clumped[clumped.length - 1].count += 1;
                    } else {
                        console.log('Starting new group for measure', i+1);
                        clumped.push({ ...m, count: 1 });
                    }
                }
                console.log('Condensed groups:', clumped.length, 'from', show.measures.length, 'measures');
                toRender = clumped;
            } else {
                // Show each measure individually (no grouping)
                toRender = show.measures.map(m => ({ ...m, count: 1 }));
            }
            toRender.forEach((measure, index) => {
                const measureItem = document.createElement('div');
                measureItem.className = 'measure-item';
                measureItem.setAttribute('data-measure-id', measure.id);
                
                measureItem.innerHTML =
                    '<div class="measure-info">' +
                        (measure.letter ? '<span style="background: var(--accent); color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-right: 8px;">' + measure.letter + '</span>' : '') +
                        (condensedView ? '<span>' + measure.count + ' mes.</span>' : '') +
                        '<span>' + measure.timeSignature.numerator + '/' + measure.timeSignature.denominator + '</span>' +
                        '<span>' + measure.tempo + ' BPM</span>' +
                    '</div>' +
                    '<div class="measure-actions">' +
                        '<div class="icon-button-small" title="Move Up"' + (index === 0 ? ' style="opacity: 0.3;"' : '') + '>' +
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                                '<polyline points="18,15 12,9 6,15"></polyline>' +
                            '</svg>' +
                        '</div>' +
                        '<div class="icon-button-small" title="Move Down"' + (index === toRender.length - 1 ? ' style="opacity: 0.3;"' : '') + '>' +
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                                '<polyline points="6,9 12,15 18,9"></polyline>' +
                            '</svg>' +
                        '</div>' +
                        '<div class="icon-button-small edit-measure-btn" title="Edit" data-measure-id="' + measure.id + '">' +
                            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                                '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2v-7"></path>' +
                                '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' +
                            '</svg>' +
                        '</div>' +
                    '</div>';
                measureList.appendChild(measureItem);
            });
            // Restore scroll position
            measureList.scrollTop = scrollTop;
        }
        // Initialize condensedView from localStorage if available, otherwise default to true
        let condensedView = true;
        try {
            const savedCondensedView = localStorage.getItem('condensedView');
            if (savedCondensedView !== null) {
                condensedView = JSON.parse(savedCondensedView);
            }
        } catch (e) {
            console.log('Could not load condensedView from localStorage:', e);
        }
        
        // Set initial toggle state based on loaded condensedView
        document.addEventListener('DOMContentLoaded', function() {
            const toggle = document.getElementById('condensedToggle');
            if (toggle) {
                if (condensedView) {
                    toggle.classList.add('active');
                } else {
                    toggle.classList.remove('active');
                }
            }
        });
        
        // Show modal
        function showModal(modalId) {
            console.log('Showing modal:', modalId);
            document.getElementById(modalId).style.display = 'flex';
        }
        
        // Hide modal
        function hideModal(modalId) {
            console.log('Hiding modal:', modalId);
            document.getElementById(modalId).style.display = 'none';
        }
        
        // Build beat sound configuration grid
        function buildBeatSoundGrid(numerator, existingBeatSounds) {
            const grid = document.getElementById('beatSoundGrid');
            
            // Set up default pattern if no existing beat sounds: high on beat 1, low on all others
            let beatSounds = existingBeatSounds;
            if (!beatSounds) {
                beatSounds = {
                    high: [0], // Beat 1 (index 0)
                    low: []
                };
                // Add all other beats to low sounds
                for (let i = 1; i < numerator; i++) {
                    beatSounds.low.push(i);
                }
            }
            
            // Set up grid layout: 1 column for labels + flexible columns for beats
            // Calculate available space: 95vw - label width - modal padding - gaps
            const viewportWidth = window.innerWidth;
            const maxModalWidth = viewportWidth * 0.95;
            const labelWidth = 32; // Even smaller label width for text-only labels
            const modalPadding = 48; // Padding, margins, gaps, etc.
            const gridGaps = (numerator - 1) * 8; // 8px gap between cells
            const availableWidth = maxModalWidth - labelWidth - modalPadding - gridGaps;
            const idealCellSize = availableWidth / numerator;
            const cellSize = Math.min(48, Math.max(24, idealCellSize));
            
            grid.style.gridTemplateColumns = \`32px repeat(\${numerator}, \${cellSize}px)\`;
            
            let html = '';
            
            // High sound row
            html += '<div class="beat-sound-row" style="grid-column: 1 / -1; display: grid; gap: 8px; grid-template-columns: subgrid;">';
            html += '<div class="beat-sound-label">Hi</div>';
            for (let beat = 1; beat <= numerator; beat++) {
                const isSelected = beatSounds.high.includes(beat - 1);
                html += \`<div class="beat-sound-cell-container">
                            <div class="beat-number">\${beat}</div>
                            <div class="beat-sound-cell \${isSelected ? 'selected' : ''}" data-sound="high" data-beat="\${beat - 1}"></div>
                         </div>\`;
            }
            html += '</div>';
            
            // Low sound row
            html += '<div class="beat-sound-row" style="grid-column: 1 / -1; display: grid; gap: 8px; grid-template-columns: subgrid;">';
            html += '<div class="beat-sound-label">Lo</div>';
            for (let beat = 1; beat <= numerator; beat++) {
                const isSelected = beatSounds.low.includes(beat - 1);
                html += \`<div class="beat-sound-cell \${isSelected ? 'selected' : ''}" data-sound="low" data-beat="\${beat - 1}"></div>\`;
            }
            html += '</div>';
            
            grid.innerHTML = html;
            
            // Add click handlers for cells
            grid.querySelectorAll('.beat-sound-cell').forEach(cell => {
                cell.addEventListener('click', () => {
                    const beatIndex = cell.getAttribute('data-beat');
                    const soundType = cell.getAttribute('data-sound');
                    
                    // If clicking on an already selected cell, deselect it
                    if (cell.classList.contains('selected')) {
                        cell.classList.remove('selected');
                    } else {
                        // First, deselect any other selected cells in the same column (same beat)
                        grid.querySelectorAll(\`[data-beat="\${beatIndex}"].selected\`).forEach(otherCell => {
                            otherCell.classList.remove('selected');
                        });
                        
                        // Then select this cell
                        cell.classList.add('selected');
                    }
                });
            });
        }
        
        // Collect beat sounds from grid
        function collectBeatSounds() {
            const grid = document.getElementById('beatSoundGrid');
            const beatSounds = {
                high: [],
                low: []
            };
            
            grid.querySelectorAll('.beat-sound-cell.selected').forEach(cell => {
                const sound = cell.getAttribute('data-sound');
                const beat = parseInt(cell.getAttribute('data-beat'), 10);
                beatSounds[sound].push(beat);
            });
            
            // Sort the arrays
            beatSounds.high.sort((a, b) => a - b);
            beatSounds.low.sort((a, b) => a - b);
            
            return beatSounds;
        }
        
        // Snackbar removed
        
        // Event listeners
        document.getElementById('addMeasureBtn').addEventListener('click', () => {
            // Get current show and update letter dropdown
            const show = shows.find(s => s.id === selectedShow);
            if (show) {
                updateLetterDropdown('letterInput', show);
            }
            showModal('addMeasureModal');
        });
        
        // Playback range click handler
        document.getElementById('playbackRangeContainer').addEventListener('click', () => {
            // Send message to React Native to open playback options
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'OPEN_PLAYBACK_OPTIONS'
            }));
        });
        
        document.getElementById('addShowBtn').addEventListener('click', () => {
            // Send message to React Native to add a show
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ADD_SHOW'
            }));
        });
        
        // Edit show button click handler
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-show-btn')) {
                console.log('Edit button clicked!');
                e.preventDefault();
                e.stopPropagation();
                const showId = e.target.closest('.edit-show-btn').getAttribute('data-show-id');
                console.log('Show ID:', showId);
                const show = shows.find(s => s.id === showId);
                console.log('Found show:', show);
                if (show) {
                    // Store the show ID being edited (not necessarily the selected show)
                    window.editingShowId = showId;
                    document.getElementById('showNameInput').value = show.name;
                    console.log('Set input value to:', show.name);
                    showModal('editShowModal');
                }
            }
            // Edit measure button click handler
            if (e.target.closest('.edit-measure-btn')) {
                console.log('Edit measure button clicked!');
                e.preventDefault();
                e.stopPropagation();
                const measureId = e.target.closest('.edit-measure-btn').getAttribute('data-measure-id');
                console.log('Measure ID:', measureId);
                const show = shows.find(s => s.id === selectedShow);
                if (show) {
                    const measure = show.measures.find(m => m.id === measureId);
                    if (measure) {
                        // Store the measure being edited
                        window.editingMeasureId = measureId;
                        // Calculate the correct number of measures
                        let measureCount = 1;
                        if (condensedView) {
                            // In condensed view, count consecutive similar measures
                            const measureIndex = show.measures.findIndex(m => m.id === measureId);
                            let count = 0;
                            for (let i = measureIndex; i < show.measures.length; i++) {
                                const currentMeasure = show.measures[i];
                                if (currentMeasure.timeSignature.numerator === measure.timeSignature.numerator &&
                                    currentMeasure.timeSignature.denominator === measure.timeSignature.denominator &&
                                    currentMeasure.tempo === measure.tempo &&
                                    currentMeasure.letter === measure.letter &&
                                    compareBeatSounds(currentMeasure.beatSounds, measure.beatSounds)) {
                                    count++;
                                } else {
                                    break;
                                }
                            }
                            measureCount = count;
                        }
                        document.getElementById('editNumMeasuresInput').value = measureCount;
                        document.getElementById('editTempoInput').value = measure.tempo;
                        document.getElementById('editNumeratorInput').value = measure.timeSignature.numerator;
                        document.getElementById('editDenominatorInput').value = measure.timeSignature.denominator;
                        document.getElementById('editLetterInput').value = measure.letter || '';
                        
                        // Update letter dropdown with available letters (excluding current letter)
                        updateLetterDropdown('editLetterInput', show, measure.letter || '');
                        
                        showModal('editMeasuresModal');
                    }
                }
            }
            // Move up button click handler
            if (e.target.closest('[title="Move Up"]')) {
                e.preventDefault();
                e.stopPropagation();
                const measureItem = e.target.closest('.measure-item');
                const measureId = measureItem.getAttribute('data-measure-id');
                console.log('Move up clicked for measure:', measureId);
                const show = shows.find(s => s.id === selectedShow);
                if (show) {
                    const measureIndex = show.measures.findIndex(m => m.id === measureId);
                    if (measureIndex > 0) {
                        let updatedMeasures;
                        
                        if (condensedView) {
                            // Find the end of the current measure group
                            let groupEnd = measureIndex;
                            const currentMeasure = show.measures[measureIndex];
                            for (let i = measureIndex + 1; i < show.measures.length; i++) {
                                if (show.measures[i].timeSignature.numerator === currentMeasure.timeSignature.numerator &&
                                    show.measures[i].timeSignature.denominator === currentMeasure.timeSignature.denominator &&
                                    show.measures[i].tempo === currentMeasure.tempo &&
                                    show.measures[i].letter === currentMeasure.letter &&
                                    compareBeatSounds(show.measures[i].beatSounds, currentMeasure.beatSounds)) {
                                    groupEnd = i;
                                } else {
                                    break;
                                }
                            }
                            
                            // Find the end of the previous measure group
                            let prevGroupEnd = measureIndex - 1;
                            const prevMeasure = show.measures[measureIndex - 1];
                            for (let i = measureIndex - 2; i >= 0; i--) {
                                if (show.measures[i].timeSignature.numerator === prevMeasure.timeSignature.numerator &&
                                    show.measures[i].timeSignature.denominator === prevMeasure.timeSignature.denominator &&
                                    show.measures[i].tempo === prevMeasure.tempo &&
                                    show.measures[i].letter === prevMeasure.letter &&
                                    compareBeatSounds(show.measures[i].beatSounds, prevMeasure.beatSounds)) {
                                    prevGroupEnd = i;
                                } else {
                                    break;
                                }
                            }
                            
                            // Move the current group above the previous group
                            const currentGroup = show.measures.slice(measureIndex, groupEnd + 1);
                            const previousGroup = show.measures.slice(prevGroupEnd, measureIndex);
                            updatedMeasures = [
                                ...show.measures.slice(0, prevGroupEnd),
                                ...currentGroup,
                                ...previousGroup,
                                ...show.measures.slice(groupEnd + 1)
                            ];
                        } else {
                            // In uncondensed mode, just swap the current measure with the previous one
                            updatedMeasures = [...show.measures];
                            const temp = updatedMeasures[measureIndex];
                            updatedMeasures[measureIndex] = updatedMeasures[measureIndex - 1];
                            updatedMeasures[measureIndex - 1] = temp;
                        }
                        
                        // Send message to React Native to update show measures
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'UPDATE_SHOW_MEASURES',
                            showId: show.id,
                            measures: updatedMeasures
                        }));
                        
                        // Update measures locally without triggering full re-render
                        const showIndex = shows.findIndex(s => s.id === show.id);
                        if (showIndex !== -1) {
                            shows[showIndex].measures = updatedMeasures;
                            // Re-render only the measures for the current show
                            const selectedShowData = shows.find(s => s.id === selectedShow);
                            if (selectedShowData) {
                                renderMeasures(selectedShowData);
                            }
                        }
                        
                        // Snackbar removed
                    }
                }
            }
            // Move down button click handler
            if (e.target.closest('[title="Move Down"]')) {
                e.preventDefault();
                e.stopPropagation();
                const measureItem = e.target.closest('.measure-item');
                const measureId = measureItem.getAttribute('data-measure-id');
                console.log('Move down clicked for measure:', measureId);
                const show = shows.find(s => s.id === selectedShow);
                if (show) {
                    const measureIndex = show.measures.findIndex(m => m.id === measureId);
                    if (measureIndex < show.measures.length - 1) {
                        let updatedMeasures;
                        
                        if (condensedView) {
                            // Find the end of the current measure group
                            let groupEnd = measureIndex;
                            const currentMeasure = show.measures[measureIndex];
                            for (let i = measureIndex + 1; i < show.measures.length; i++) {
                                if (show.measures[i].timeSignature.numerator === currentMeasure.timeSignature.numerator &&
                                    show.measures[i].timeSignature.denominator === currentMeasure.timeSignature.denominator &&
                                    show.measures[i].tempo === currentMeasure.tempo &&
                                    show.measures[i].letter === currentMeasure.letter &&
                                    compareBeatSounds(show.measures[i].beatSounds, currentMeasure.beatSounds)) {
                                    groupEnd = i;
                                } else {
                                    break;
                                }
                            }
                            
                            // Find the end of the next measure group
                            let nextGroupEnd = groupEnd + 1;
                            if (nextGroupEnd < show.measures.length) {
                                const nextMeasure = show.measures[nextGroupEnd];
                                for (let i = nextGroupEnd + 1; i < show.measures.length; i++) {
                                    if (show.measures[i].timeSignature.numerator === nextMeasure.timeSignature.numerator &&
                                        show.measures[i].timeSignature.denominator === nextMeasure.timeSignature.denominator &&
                                        show.measures[i].tempo === nextMeasure.tempo &&
                                        show.measures[i].letter === nextMeasure.letter &&
                                        compareBeatSounds(show.measures[i].beatSounds, nextMeasure.beatSounds)) {
                                        nextGroupEnd = i;
                                    } else {
                                        break;
                                    }
                                }
                            }
                            
                            // Move the current group below the next group
                            const currentGroup = show.measures.slice(measureIndex, groupEnd + 1);
                            const nextGroup = show.measures.slice(groupEnd + 1, nextGroupEnd + 1);
                            updatedMeasures = [
                                ...show.measures.slice(0, measureIndex),
                                ...nextGroup,
                                ...currentGroup,
                                ...show.measures.slice(nextGroupEnd + 1)
                            ];
                        } else {
                            // In uncondensed mode, just swap the current measure with the next one
                            updatedMeasures = [...show.measures];
                            const temp = updatedMeasures[measureIndex];
                            updatedMeasures[measureIndex] = updatedMeasures[measureIndex + 1];
                            updatedMeasures[measureIndex + 1] = temp;
                        }
                        
                        // Send message to React Native to update show measures
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'UPDATE_SHOW_MEASURES',
                            showId: show.id,
                            measures: updatedMeasures
                        }));
                        
                        // Update measures locally without triggering full re-render
                        const showIndex = shows.findIndex(s => s.id === show.id);
                        if (showIndex !== -1) {
                            shows[showIndex].measures = updatedMeasures;
                            // Re-render only the measures for the current show
                            const selectedShowData = shows.find(s => s.id === selectedShow);
                            if (selectedShowData) {
                                renderMeasures(selectedShowData);
                            }
                        }
                        
                        // Snackbar removed
                    }
                }
            }
        });
        
        // Edit show modal buttons
        document.getElementById('cancelEditShowBtn').addEventListener('click', () => {
            hideModal('editShowModal');
        });
        
        document.getElementById('saveEditShowBtn').addEventListener('click', () => {
            console.log('editShowSaveBtn clicked!');
            const newName = document.getElementById('showNameInput').value.trim();
            console.log('New name from input:', newName);
            console.log('Editing show ID:', window.editingShowId);
            if (newName && window.editingShowId) {
                console.log('Sending RENAME_SHOW message to React Native');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'RENAME_SHOW',
                    showId: window.editingShowId,
                    newName: newName
                }));
            }
            hideModal('editShowModal');
            // Snackbar removed
        });
        
        // Check if import button exists and add event listener
        const importBtn = document.getElementById('importShowBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                // Add visual feedback
                importBtn.style.backgroundColor = 'var(--accent)';
                setTimeout(() => {
                    importBtn.style.backgroundColor = '';
                }, 200);
                // Send message to React Native to trigger file picker
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'IMPORT_SHOW'
                    }));
                }
            });
        }
        

        

        
        // Modal event listeners
        document.getElementById('addMeasureCancelBtn').addEventListener('click', () => {
            hideModal('addMeasureModal');
        });
        
        document.getElementById('addMeasureSaveBtn').addEventListener('click', () => {
            // Get values from modal inputs
            const numMeasures = parseInt(document.getElementById('numMeasuresInput').value, 10);
            const tempo = parseInt(document.getElementById('tempoInput').value, 10);
            const numerator = parseInt(document.getElementById('numeratorInput').value, 10);
            const denominator = parseInt(document.getElementById('denominatorInput').value, 10);
            const letter = document.getElementById('letterInput').value;
            
            // Validate inputs
            if (
                isNaN(numMeasures) || numMeasures < 1 || numMeasures > 500 ||
                isNaN(tempo) || tempo < 40 || tempo > 300 ||
                isNaN(numerator) || numerator < 1 || numerator > 32 ||
                isNaN(denominator) || ![2,4,8,16].includes(denominator)
            ) {
                // Snackbar removed
                return;
            }
            // Find the selected show
            const show = shows.find(s => s.id === selectedShow);
            if (!show) {
                // Snackbar removed
                return;
            }
            // Generate new measure objects (one per measure)
            const newMeasures = [...show.measures];
            for (let i = 0; i < numMeasures; i++) {
                newMeasures.push({
                    id: show.id + '-' + Date.now() + '-' + Math.floor(Math.random()*10000) + '-' + i,
                    timeSignature: { numerator: numerator, denominator: denominator },
                    tempo: tempo,
                    count: 1,
                    letter: letter || undefined
                });
            }
            // Send message to React Native to update show measures
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'UPDATE_SHOW_MEASURES',
                showId: show.id,
                measures: newMeasures
            }));
            hideModal('addMeasureModal');
            // Snackbar removed
        });
        
        document.getElementById('editShowCancelBtn').addEventListener('click', () => {
            hideModal('editShowModal');
        });
        
        document.getElementById('editShowSaveBtn').addEventListener('click', () => {
            console.log('editShowSaveBtn clicked!');
            const newName = document.getElementById('showNameInput').value.trim();
            console.log('New name from input:', newName);
            console.log('Editing show ID:', window.editingShowId);
            if (newName && window.editingShowId) {
                console.log('Sending RENAME_SHOW message to React Native');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'RENAME_SHOW',
                    showId: window.editingShowId,
                    newName: newName
                }));
            }
            hideModal('editShowModal');
            // Snackbar removed
        });
        
        document.getElementById('exportShowBtn').addEventListener('click', () => {
            // Find the show being edited
            const showId = window.editingShowId || selectedShow;
            const show = shows.find(s => s.id === showId);
            if (show) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'EXPORT_SHOW',
                    showId: show.id,
                    showData: show
                }));
            }
        });
        
        document.getElementById('deleteShowBtn').addEventListener('click', () => {
            console.log('Delete show button clicked!');
            if (window.editingShowId) {
                console.log('Sending DELETE_SHOW message to React Native');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'DELETE_SHOW',
                    showId: window.editingShowId
                }));
            }
            hideModal('editShowModal');
            // Snackbar removed
            // Clear the measure manager
            const measureList = document.getElementById('measureList');
            measureList.innerHTML = '<div class="empty-state">No measures in this show</div>';
        });
        
        document.getElementById('importConflictCancelBtn').addEventListener('click', () => {
            hideModal('importConflictModal');
        });
        
        document.getElementById('importAsCopyBtn').addEventListener('click', () => {
            hideModal('importConflictModal');
            // Snackbar removed
        });
        
        document.getElementById('replaceShowBtn').addEventListener('click', () => {
            hideModal('importConflictModal');
            // Snackbar removed
        });
        
        document.getElementById('editMeasuresCancelBtn').addEventListener('click', () => {
            hideModal('editMeasuresModal');
        });
        
        document.getElementById('editMeasuresSaveBtn').addEventListener('click', () => {
            // Get values from modal inputs
            const numMeasures = parseInt(document.getElementById('editNumMeasuresInput').value, 10);
            const tempo = parseInt(document.getElementById('editTempoInput').value, 10);
            const numerator = parseInt(document.getElementById('editNumeratorInput').value, 10);
            const denominator = parseInt(document.getElementById('editDenominatorInput').value, 10);
            const letter = document.getElementById('editLetterInput').value;
            
            // Get beat sounds configuration if it was set
            const beatSounds = window.editingBeatSounds || null;
            
            // Validate inputs
            if (
                isNaN(numMeasures) || numMeasures < 1 || numMeasures > 500 ||
                isNaN(tempo) || tempo < 40 || tempo > 300 ||
                isNaN(numerator) || numerator < 1 || numerator > 32 ||
                isNaN(denominator) || ![2,4,8,16].includes(denominator)
            ) {
                // Snackbar removed
                return;
            }
            
            // Find the selected show and measure
            const show = shows.find(s => s.id === selectedShow);
            if (!show || !window.editingMeasureId) {
                // Snackbar removed
                return;
            }
            
            // Update the measure
            const updatedMeasures = [...show.measures];
            const measureIndex = show.measures.findIndex(m => m.id === window.editingMeasureId);
            const originalMeasure = show.measures[measureIndex];
            
            if (condensedView) {
                // In condensed view, update all consecutive similar measures
                let count = 0;
                for (let i = measureIndex; i < show.measures.length; i++) {
                    const currentMeasure = show.measures[i];
                    if (currentMeasure.timeSignature.numerator === originalMeasure.timeSignature.numerator &&
                        currentMeasure.timeSignature.denominator === originalMeasure.timeSignature.denominator &&
                        currentMeasure.tempo === originalMeasure.tempo &&
                        currentMeasure.letter === originalMeasure.letter &&
                        compareBeatSounds(currentMeasure.beatSounds, originalMeasure.beatSounds)) {
                        updatedMeasures[i] = {
                            ...currentMeasure,
                            timeSignature: { numerator, denominator },
                            tempo,
                            letter: letter || undefined,
                            beatSounds: beatSounds || currentMeasure.beatSounds
                        };
                        count++;
                        if (count >= numMeasures) break;
                    } else {
                        break;
                    }
                }
            } else {
                // In detailed view, update only the single measure
                updatedMeasures[measureIndex] = {
                    ...originalMeasure,
                    timeSignature: { numerator, denominator },
                    tempo,
                    letter: letter || undefined,
                    beatSounds: beatSounds || originalMeasure.beatSounds
                };
            }
            
            // Set a flag to prevent re-rendering when React Native updates the data
            window.skipNextRender = true;
            
            // Send message to React Native to update show measures
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'UPDATE_SHOW_MEASURES',
                showId: show.id,
                measures: updatedMeasures
            }));
            
            // Clean up beat sounds configuration
            window.editingBeatSounds = null;
            
            hideModal('editMeasuresModal');
            // Snackbar removed
        });
        
        document.getElementById('deleteMeasuresBtn').addEventListener('click', () => {
            // Find the selected show
            const show = shows.find(s => s.id === selectedShow);
            if (!show || !window.editingMeasureId) {
                // Snackbar removed
                return;
            }
            
            // Find the measure being edited
            const measureIndex = show.measures.findIndex(m => m.id === window.editingMeasureId);
            if (measureIndex === -1) {
                // Snackbar removed
                return;
            }
            
            const measureToDelete = show.measures[measureIndex];
            
            // Decide deletion strategy based on condensed/uncondensed view
            console.log('Deleting measure in condensedView:', condensedView);
            let startIndex = measureIndex;
            let endIndex = measureIndex;

            if (condensedView) {
                // In condensed view, delete the whole group (existing logic)
                // Look backwards to find the start of the group
                for (let i = measureIndex - 1; i >= 0; i--) {
                    const currentMeasure = show.measures[i];
                    if (currentMeasure.timeSignature.numerator === measureToDelete.timeSignature.numerator &&
                        currentMeasure.timeSignature.denominator === measureToDelete.timeSignature.denominator &&
                        currentMeasure.tempo === measureToDelete.tempo &&
                        currentMeasure.letter === measureToDelete.letter &&
                        compareBeatSounds(currentMeasure.beatSounds, measureToDelete.beatSounds)) {
                        startIndex = i;
                    } else {
                        break;
                    }
                }

                // Look forwards to find the end of the group
                for (let i = measureIndex + 1; i < show.measures.length; i++) {
                    const currentMeasure = show.measures[i];
                    if (currentMeasure.timeSignature.numerator === measureToDelete.timeSignature.numerator &&
                        currentMeasure.timeSignature.denominator === measureToDelete.timeSignature.denominator &&
                        currentMeasure.tempo === measureToDelete.tempo &&
                        currentMeasure.letter === measureToDelete.letter &&
                        compareBeatSounds(currentMeasure.beatSounds, measureToDelete.beatSounds)) {
                        endIndex = i;
                    } else {
                        break;
                    }
                }
            }

            // Build the new measures array (single deletion in uncondensed, group deletion in condensed)
            const updatedMeasures = [
                ...show.measures.slice(0, startIndex),
                ...show.measures.slice(endIndex + 1)
            ];

            // Update the local show object so that the UI can be refreshed immediately
            show.measures = updatedMeasures;
            
            // Re-render measures to reflect deletion without changing condensedView state
            renderMeasures(show);
            
            // Set a flag to prevent re-rendering when React Native updates the data
            window.skipNextRender = true;
            
            // Send message to React Native to update show measures
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'UPDATE_SHOW_MEASURES',
                showId: show.id,
                measures: updatedMeasures
            }));

            hideModal('editMeasuresModal');
            // Snackbar removed
        });
        
        // Beat sound configuration event listeners
        document.getElementById('beatSoundConfigBtn').addEventListener('click', () => {
            const numerator = parseInt(document.getElementById('editNumeratorInput').value, 10);
            if (isNaN(numerator) || numerator < 1 || numerator > 32) {
                // Snackbar removed - invalid time signature
                return;
            }
            
            // Get current measure to load existing beat sounds
            const show = shows.find(s => s.id === selectedShow);
            const measure = show?.measures.find(m => m.id === window.editingMeasureId);
            
            buildBeatSoundGrid(numerator, measure?.beatSounds);
            showModal('beatSoundModal');
        });
        
        document.getElementById('beatSoundCancelBtn').addEventListener('click', () => {
            hideModal('beatSoundModal');
        });
        
        document.getElementById('beatSoundSaveBtn').addEventListener('click', () => {
            // Collect selected beat sounds from the grid
            const beatSounds = collectBeatSounds();
            
            // Store the beat sounds configuration for when the measure is saved
            window.editingBeatSounds = beatSounds;
            
            hideModal('beatSoundModal');
            // Snackbar removed
        });
        
        // Condensed toggle
        document.getElementById('condensedToggle').addEventListener('click', function() {
            this.classList.toggle('active');
            condensedView = this.classList.contains('active');
            
            // Save condensedView state to localStorage
            try {
                localStorage.setItem('condensedView', JSON.stringify(condensedView));
            } catch (e) {
                console.log('Could not save condensedView to localStorage:', e);
            }
            
            console.log('Condensed view toggled to:', condensedView);
            
            // Re-render measures in the new mode
            const show = shows.find(s => s.id === selectedShow);
            if (show) {
                renderMeasures(show);
            }
        });
        
        // Show chip click handlers
        document.querySelectorAll('.show-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                document.querySelectorAll('.show-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                selectedShow = this.getAttribute('data-show-id');
                // Snackbar removed
            });
        });
        

        
        // Audio context for sound playback
        let audioContext;
        let beatsPerMeasure = 4; // Configurable beats per measure
        let currentBeat = 0;
        let currentMeasure = 0;
        
        // Initialize audio context
        function initAudio() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Audio context initialized successfully');
                
                
                return true;
            } catch (e) {
                console.error('AudioContext not supported:', e);
                return false;
            }
        }
        
        
        // Helper function to compare beatSounds configurations
        function compareBeatSounds(beatSounds1, beatSounds2) {
            // If both are null/undefined, they're equal
            if (!beatSounds1 && !beatSounds2) {
                console.log('Both beatSounds are null/undefined - equal');
                return true;
            }
            
            // If only one is null/undefined, they're not equal
            if (!beatSounds1 || !beatSounds2) {
                console.log('One beatSounds is null/undefined - not equal');
                return false;
            }
            
            // Compare high arrays
            const high1 = beatSounds1.high || [];
            const high2 = beatSounds2.high || [];
            if (high1.length !== high2.length) {
                console.log('High arrays different lengths:', high1.length, 'vs', high2.length);
                return false;
            }
            if (!high1.every(beat => high2.includes(beat))) {
                console.log('High arrays different content:', high1, 'vs', high2);
                return false;
            }
            
            // Compare low arrays
            const low1 = beatSounds1.low || [];
            const low2 = beatSounds2.low || [];
            if (low1.length !== low2.length) {
                console.log('Low arrays different lengths:', low1.length, 'vs', low2.length);
                return false;
            }
            if (!low1.every(beat => low2.includes(beat))) {
                console.log('Low arrays different content:', low1, 'vs', low2);
                return false;
            }
            
            console.log('BeatSounds are equal');
            return true;
        }

        // Play a click sound using Web Audio API
        function playClick(isDownbeat = false, beatIndex = 0, measureData = null) {
            if (!audioContext) {
                console.error('No audio context available');
                return;
            }
            
            // Check if this beat should play a custom sound based on beat sounds configuration
            let shouldPlayHighSound = isDownbeat;
            let shouldPlayLowSound = !isDownbeat;
            
            if (measureData && measureData.beatSounds) {
                const beatSounds = measureData.beatSounds;
                shouldPlayHighSound = beatSounds.high && beatSounds.high.includes(beatIndex);
                shouldPlayLowSound = beatSounds.low && beatSounds.low.includes(beatIndex);
                
                // If neither high nor low is configured for this beat, don't play any sound
                if (!shouldPlayHighSound && !shouldPlayLowSound) {
                    return;
                }
            }
            
            const startTime = audioContext.currentTime;
            const duration = 0.08;
            
            // Different sound types
            if (currentSound === 'synth') {
                if (shouldPlayHighSound) {
                    // High sound: higher frequency with more harmonics
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
                } else if (shouldPlayLowSound) {
                    // Low sound: use drbeat sound - programmatically generated
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
                
                // Fundamental pitch - higher for high sound
                const baseFreq = shouldPlayHighSound ? 1200 : 800;
                
                // Primary oscillator - square wave for rich harmonics
                oscillator1.frequency.setValueAtTime(baseFreq, startTime);
                oscillator1.type = 'square';
                
                // Secondary oscillator - slightly detuned for complexity
                oscillator2.frequency.setValueAtTime(baseFreq * 1.01, startTime);
                oscillator2.type = 'square';
                
                // Filter configuration - low-pass with resonance
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(6000, startTime);
                filterNode.Q.setValueAtTime(8, startTime);
                
                // Envelope for filter
                filterEnv.gain.setValueAtTime(0.8, startTime);
                filterEnv.gain.exponentialRampToValueAtTime(0.1, startTime + duration);
                
                // Gain envelope
                gainNode.gain.setValueAtTime(shouldPlayHighSound ? 0.4 : 0.25, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                // Noise envelope
                noiseGain.gain.setValueAtTime(shouldPlayHighSound ? 0.3 : 0.15, startTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                // Connect oscillators
                oscillator1.connect(filterNode);
                oscillator2.connect(filterNode);
                filterNode.connect(gainNode);
                
                // Connect noise
                noiseSource.connect(noiseGain);
                noiseGain.connect(gainNode);
                
                // Connect to output
                gainNode.connect(audioContext.destination);
                
                // Start and stop
                oscillator1.start(startTime);
                oscillator2.start(startTime);
                noiseSource.start(startTime);
                oscillator1.stop(startTime + duration);
                oscillator2.stop(startTime + duration);
                noiseSource.stop(startTime + duration);
            } else if (currentSound === 'cowbell') {
                // Cowbell sound - metallic with harmonics
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
                
                // Fundamental pitch - higher for accent
                const baseFreq = isDownbeat ? 800 : 600;
                
                // Multiple oscillators for metallic sound
                oscillator1.frequency.setValueAtTime(baseFreq, startTime);
                oscillator2.frequency.setValueAtTime(baseFreq * 1.5, startTime);
                oscillator3.frequency.setValueAtTime(baseFreq * 2.0, startTime);
                oscillator4.frequency.setValueAtTime(baseFreq * 2.5, startTime);
                oscillator5.frequency.setValueAtTime(baseFreq * 3.0, startTime);
                
                // Filter configuration
                filterNode.type = 'bandpass';
                filterNode.frequency.setValueAtTime(2000, startTime);
                filterNode.Q.setValueAtTime(4, startTime);
                
                // Envelope for filter
                filterEnv.gain.setValueAtTime(0.6, startTime);
                filterEnv.gain.exponentialRampToValueAtTime(0.1, startTime + duration);
                
                // Gain envelope
                gainNode.gain.setValueAtTime(isDownbeat ? 0.35 : 0.2, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                // Noise envelope
                noiseGain.gain.setValueAtTime(isDownbeat ? 0.25 : 0.1, startTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                // Connect oscillators
                oscillator1.connect(filterNode);
                oscillator2.connect(filterNode);
                oscillator3.connect(filterNode);
                oscillator4.connect(filterNode);
                oscillator5.connect(filterNode);
                filterNode.connect(gainNode);
                
                // Connect noise
                noiseSource.connect(noiseGain);
                noiseGain.connect(gainNode);
                
                // Connect to output
                gainNode.connect(audioContext.destination);
                
                // Start and stop
                oscillator1.start(startTime);
                oscillator2.start(startTime);
                oscillator3.start(startTime);
                oscillator4.start(startTime);
                oscillator5.start(startTime);
                noiseSource.start(startTime);
                oscillator1.stop(startTime + duration);
                oscillator2.stop(startTime + duration);
                oscillator3.stop(startTime + duration);
                oscillator4.stop(startTime + duration);
                oscillator5.stop(startTime + duration);
                noiseSource.stop(startTime + duration);
            } else if (currentSound === 'click') {
                // Click sound - sharp and percussive
                const oscillator1 = audioContext.createOscillator();
                const oscillator2 = audioContext.createOscillator();
                const oscillator3 = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const filterNode = audioContext.createBiquadFilter();
                const filterNode2 = audioContext.createBiquadFilter();
                const filterNode3 = audioContext.createBiquadFilter();
                
                // Fundamental pitch - higher for accent
                const baseFreq = isDownbeat ? 1000 : 700;
                
                // Multiple oscillators for sharp sound
                oscillator1.frequency.setValueAtTime(baseFreq, startTime);
                oscillator2.frequency.setValueAtTime(baseFreq * 1.2, startTime);
                oscillator3.frequency.setValueAtTime(baseFreq * 1.8, startTime);
                
                // Filter chain for sharp sound
                filterNode.type = 'highpass';
                filterNode.frequency.setValueAtTime(800, startTime);
                filterNode.Q.setValueAtTime(2, startTime);
                
                filterNode2.type = 'lowpass';
                filterNode2.frequency.setValueAtTime(4000, startTime);
                filterNode2.Q.setValueAtTime(1, startTime);
                
                filterNode3.type = 'notch';
                filterNode3.frequency.setValueAtTime(2000, startTime);
                filterNode3.Q.setValueAtTime(4, startTime);
                
                // Gain envelope
                gainNode.gain.setValueAtTime(isDownbeat ? 0.4 : 0.25, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                // Connect oscillators
                oscillator1.connect(filterNode);
                oscillator2.connect(filterNode);
                oscillator3.connect(filterNode);
                filterNode.connect(filterNode2);
                filterNode2.connect(filterNode3);
                filterNode3.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Start and stop
                oscillator1.start(startTime);
                oscillator2.start(startTime);
                oscillator3.start(startTime);
                oscillator1.stop(startTime + duration);
                oscillator2.stop(startTime + duration);
                oscillator3.stop(startTime + duration);
            } else if (currentSound === 'beep') {
                // Beep sound - simple and clean
                const oscillator1 = audioContext.createOscillator();
                const oscillator2 = audioContext.createOscillator();
                const oscillator3 = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const filterNode = audioContext.createBiquadFilter();
                
                // Fundamental pitch - higher for high sound
                const baseFreq = shouldPlayHighSound ? 900 : 600;
                
                // Multiple oscillators for clean sound
                oscillator1.frequency.setValueAtTime(baseFreq, startTime);
                oscillator2.frequency.setValueAtTime(baseFreq * 1.5, startTime);
                oscillator3.frequency.setValueAtTime(baseFreq * 2.0, startTime);
                
                // Filter for clean sound
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(3000, startTime);
                filterNode.Q.setValueAtTime(1, startTime);
                
                // Gain envelope
                gainNode.gain.setValueAtTime(shouldPlayHighSound ? 0.35 : 0.2, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                // Connect oscillators
                oscillator1.connect(filterNode);
                oscillator2.connect(filterNode);
                oscillator3.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Start and stop
                oscillator1.start(startTime);
                oscillator2.start(startTime);
                oscillator3.start(startTime);
                oscillator1.stop(startTime + duration);
                oscillator2.stop(startTime + duration);
                oscillator3.stop(startTime + duration);
            } else if (currentSound === 'drbeat') {
                // Drbeat sound - fairly short, extremely loud and percussive like a marching snare shot
                const oscillator1 = audioContext.createOscillator();
                const oscillator2 = audioContext.createOscillator();
                const oscillator3 = audioContext.createOscillator();
                const lowOscillator = audioContext.createOscillator(); // New low-pitched oscillator
                const noiseBuffer = audioContext.createBuffer(1, 4096, audioContext.sampleRate);
                const noiseData = noiseBuffer.getChannelData(0);
                for (let i = 0; i < 4096; i++) {
                    noiseData[i] = Math.random() * 2 - 1;
                }
                const noiseSource = audioContext.createBufferSource();
                noiseSource.buffer = noiseBuffer;
                
                const gainNode = audioContext.createGain();
                const lowGainNode = audioContext.createGain(); // Separate gain for low note
                const noiseGain = audioContext.createGain();
                const filterNode = audioContext.createBiquadFilter();
                const filterNode2 = audioContext.createBiquadFilter();
                
                // Higher-pitched frequencies for sharper attack - increased by ~50%
                const baseFreq = shouldPlayHighSound ? 3600 : 2700; // Increased from 2400/1800
                const lowFreq = shouldPlayHighSound ? 80 : 60; // Low-pitched note
                
                // Multiple oscillators for thick, sharp attack (higher pitched)
                oscillator1.frequency.setValueAtTime(baseFreq, startTime);
                oscillator2.frequency.setValueAtTime(baseFreq * 1.5, startTime);
                oscillator3.frequency.setValueAtTime(baseFreq * 2.2, startTime);
                
                // Low-pitched oscillator for depth
                lowOscillator.frequency.setValueAtTime(lowFreq, startTime);
                
                // Square waves for sharp, cutting character
                oscillator1.type = 'square';
                oscillator2.type = 'square';
                oscillator3.type = 'sawtooth';
                lowOscillator.type = 'sine'; // Smooth low note
                
                // High-pass filter for sharp, cutting tone
                filterNode.type = 'highpass';
                filterNode.frequency.setValueAtTime(800, startTime);
                filterNode.Q.setValueAtTime(3, startTime);
                
                // Band-pass filter for snare-like character
                filterNode2.type = 'bandpass';
                filterNode2.frequency.setValueAtTime(baseFreq, startTime);
                filterNode2.Q.setValueAtTime(8, startTime);
                
                // Extremely loud, sharp envelope - instant attack, fairly short decay
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(shouldPlayHighSound ? 4.5 : 4.0, startTime + 0.0005); // Ultra-fast attack
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.06); // Fairly short decay
                
                // Low note envelope - softer attack, longer sustain
                lowGainNode.gain.setValueAtTime(0, startTime);
                lowGainNode.gain.linearRampToValueAtTime(shouldPlayHighSound ? 0.8 : 0.6, startTime + 0.002); // Slightly slower attack
                lowGainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12); // Longer decay for depth
                
                // Sharp noise burst for snare crack
                noiseGain.gain.setValueAtTime(0, startTime);
                noiseGain.gain.linearRampToValueAtTime(2.0, startTime + 0.0005); // Ultra-fast attack
                noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.008); // Very short noise burst
                
                // Connect high-pitched oscillators through filters
                oscillator1.connect(filterNode);
                oscillator2.connect(filterNode);
                oscillator3.connect(filterNode);
                filterNode.connect(filterNode2);
                
                // Connect low oscillator directly (bypass filters for full low end)
                lowOscillator.connect(lowGainNode);
                lowGainNode.connect(audioContext.destination);
                
                // Connect noise through filters
                noiseSource.connect(noiseGain);
                noiseGain.connect(filterNode2);
                
                // Final output for high frequencies
                filterNode2.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Start everything
                oscillator1.start(startTime);
                oscillator2.start(startTime);
                oscillator3.start(startTime);
                lowOscillator.start(startTime);
                noiseSource.start(startTime);
                
                // Stop everything
                oscillator1.stop(startTime + 0.06);
                oscillator2.stop(startTime + 0.06);
                oscillator3.stop(startTime + 0.06);
                lowOscillator.stop(startTime + 0.12); // Let low note sustain longer
                noiseSource.stop(startTime + 0.008);
            } else if (currentSound === 'sharp') {
                // Snap sound - extremely short, sharp and piercing like a powerful woodblock hit
                const oscillator1 = audioContext.createOscillator();
                const oscillator2 = audioContext.createOscillator();
                const oscillator3 = audioContext.createOscillator();
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
                const compressor = audioContext.createDynamicsCompressor();
                
                // Extremely high frequencies for piercing snap
                const baseFreq = shouldPlayHighSound ? 3200 : 2800;
                
                // Multiple high-frequency oscillators for piercing attack
                oscillator1.frequency.setValueAtTime(baseFreq, startTime);
                oscillator2.frequency.setValueAtTime(baseFreq * 1.8, startTime);
                oscillator3.frequency.setValueAtTime(baseFreq * 2.5, startTime);
                
                // Square waves for maximum sharpness
                oscillator1.type = 'square';
                oscillator2.type = 'square';
                oscillator3.type = 'square';
                
                // High-pass filter for ultra-sharp, piercing tone
                filterNode.type = 'highpass';
                filterNode.frequency.setValueAtTime(1200, startTime);
                filterNode.Q.setValueAtTime(6, startTime);
                
                // Compressor for punch and loudness
                compressor.threshold.setValueAtTime(-10, startTime);
                compressor.knee.setValueAtTime(0, startTime);
                compressor.ratio.setValueAtTime(20, startTime);
                compressor.attack.setValueAtTime(0, startTime);
                compressor.release.setValueAtTime(0.01, startTime);
                
                // Extremely loud, instantaneous envelope - shortest possible
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(shouldPlayHighSound ? 5.0 : 4.5, startTime + 0.0002); // Instantaneous attack
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.025); // Extremely short decay
                
                // Sharp, piercing noise crack
                noiseGain.gain.setValueAtTime(0, startTime);
                noiseGain.gain.linearRampToValueAtTime(2.5, startTime + 0.0002); // Instantaneous attack
                noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.003); // Ultra-short noise burst
                
                // Connect oscillators
                oscillator1.connect(filterNode);
                oscillator2.connect(filterNode);
                oscillator3.connect(filterNode);
                
                // Connect noise
                noiseSource.connect(noiseGain);
                noiseGain.connect(filterNode);
                
                // Through compressor for punch
                filterNode.connect(compressor);
                compressor.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Start everything
                oscillator1.start(startTime);
                oscillator2.start(startTime);
                oscillator3.start(startTime);
                noiseSource.start(startTime);
                
                // Stop everything quickly
                oscillator1.stop(startTime + 0.025);
                oscillator2.stop(startTime + 0.025);
                oscillator3.stop(startTime + 0.025);
                noiseSource.stop(startTime + 0.003);
            }
        }
        
        // Play a high note for count-off
        function playCountOffNote() {
            if (!audioContext) {
                console.error('No audio context available');
                return;
            }
            
            const startTime = audioContext.currentTime;
            const duration = 0.12; // Slightly longer duration for count-off
            
            // High note with harmonics for count-off
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const oscillator3 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Higher frequencies for count-off
            oscillator1.frequency.setValueAtTime(1200, startTime);
            oscillator2.frequency.setValueAtTime(1800, startTime);
            oscillator3.frequency.setValueAtTime(2400, startTime);
            
            gainNode.gain.setValueAtTime(0.4, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            oscillator3.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator1.start(startTime);
            oscillator2.start(startTime);
            oscillator3.start(startTime);
            oscillator1.stop(startTime + duration);
            oscillator2.stop(startTime + duration);
            oscillator3.stop(startTime + duration);
        }
        
        // Function to update beats per measure
        function updateBeatsPerMeasure(newBeatsPerMeasure) {
            beatsPerMeasure = newBeatsPerMeasure;
            console.log('Updated beats per measure to:', beatsPerMeasure);
        }
        
        // Expose the function to React Native
        window.updateBeatsPerMeasure = updateBeatsPerMeasure;
        window.updateSoundType = updateSoundType;
        
        // Function to update tempo bar
        function updateTempoBar(numerator, tempo) {
            const tempoBar = document.getElementById('tempoBar');
            
            // Clear existing segments
            tempoBar.innerHTML = '';
            
            // Create segments based on numerator
            for (let i = 0; i < numerator; i++) {
                const segment = document.createElement('div');
                segment.className = 'tempo-segment';
                segment.setAttribute('data-beat', i);
                tempoBar.appendChild(segment);
            }
        }
        
        // Function to update measure number
        function updateMeasureNumber(measureNumber, totalMeasures = 0) {
            const measureNumberElement = document.getElementById('measureNumber');
            const measureTotalElement = document.getElementById('measureTotal');
            
            if (measureNumber === 'COUNT-OFF') {
                measureNumberElement.textContent = 'COUNT';
                measureTotalElement.textContent = 'OFF';
                measureTotalElement.classList.add('count-off');
            } else {
                measureNumberElement.textContent = measureNumber || '-';
                measureTotalElement.textContent = totalMeasures > 0 ? 'of ' + totalMeasures : '';
                measureTotalElement.classList.remove('count-off');
            }
        }
        
        function updateMeasureDisplay() {
            const show = shows.find(s => s.id === selectedShow);
            if (show && show.measures && show.measures.length > 0) {
                updateMeasureNumber('-', show.measures.length);
            } else {
                updateMeasureNumber('-', 0);
            }
        }
        
        // Function to highlight current beat
        function highlightBeat(beatIndex, measureData = null) {
            // Remove active and silent-beat classes from all segments
            document.querySelectorAll('.tempo-segment').forEach(segment => {
                segment.classList.remove('active', 'silent-beat');
            });
            
            // Add appropriate class to current beat segment
            const currentSegment = document.querySelector('[data-beat="' + beatIndex + '"]');
            if (currentSegment) {
                // Check if this beat should play a sound based on beat sounds configuration
                let shouldPlaySound = true; // Default to true for normal behavior
                
                if (measureData && measureData.beatSounds) {
                    const beatSounds = measureData.beatSounds;
                    const shouldPlayHighSound = beatSounds.high && beatSounds.high.includes(beatIndex);
                    const shouldPlayLowSound = beatSounds.low && beatSounds.low.includes(beatIndex);
                    
                    // If neither high nor low is configured for this beat, it's a silent beat
                    shouldPlaySound = shouldPlayHighSound || shouldPlayLowSound;
                }
                
                if (shouldPlaySound) {
                    currentSegment.classList.add('active');
                } else {
                    currentSegment.classList.add('silent-beat');
                }
            }
        }
        
        // Play button functionality
        let isPlaying = false;
        let metronomeInterval = null;
        
        document.getElementById('playButton').addEventListener('click', () => {
            const iconContainer = document.getElementById('iconContainer');
            
            if (isPlaying) {
                // Stop playing
                isPlaying = false;
                document.getElementById('playButton').classList.remove('playing');
                iconContainer.classList.remove('playing');
                
                // Stop metronome
                stopMetronome();
            } else {
                // Start playing
                isPlaying = true;
                document.getElementById('playButton').classList.add('playing');
                iconContainer.classList.add('playing');
                
                // Start count-off
                startCountOff();
            }
        });
        
        // Count-off functionality
        let countOffInterval = null;
        let countOffBeat = 0;
        let isInCountOff = false;
        
        function startCountOff() {
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
                    startCountOffInternal();
                }).catch(e => {
                    console.error('Failed to resume audio context:', e);
                });
            } else {
                startCountOffInternal();
            }
        }
        
        function startCountOffInternal() {
            console.log('Starting count-off');
            
            // Clear any existing intervals
            if (metronomeInterval) {
                clearInterval(metronomeInterval);
                metronomeInterval = null;
            }
            if (countOffInterval) {
                clearInterval(countOffInterval);
                countOffInterval = null;
            }
            
            // Set count-off flag
            isInCountOff = true;
            
            // Get the selected show
            const show = shows.find(s => s.id === selectedShow);
            if (!show || !show.measures || show.measures.length === 0) {
                console.log('No show or measures found');
                stopMetronome();
                return;
            }
            
            // Calculate start position based on playback options
            const startPosition = calculateStartPosition(show);
            
            // Set up count-off with start measure's tempo but always 4/4 time signature
            const startMeasure = show.measures[startPosition];
            const countOffTempo = startMeasure.tempo;
            const beatDuration = 60000 / countOffTempo;
            const countOffIntervalMs = beatDuration; // Always use quarter note timing for count-off
            
            console.log('Count-off at', countOffTempo, 'BPM, 4/4 time signature for start measure', startPosition + 1);
            
            // Set up orange tempo bar for count-off (always 4/4)
            updateTempoBarForCountOff(4, countOffTempo);
            
            countOffBeat = 0;
            
            // Play first count-off beat immediately
            playCountOffNote();
            // Clear all highlights and highlight first beat
            document.querySelectorAll('.tempo-segment').forEach(segment => {
                segment.classList.remove('active', 'silent-beat');
            });
            const firstSegment = document.querySelector('[data-beat="0"]');
            if (firstSegment) {
                firstSegment.classList.add('active');
                console.log('Highlighting count-off beat: 0');
            }
            countOffBeat++;
            
            // Set up interval for count-off
            countOffInterval = setInterval(() => {
                if (isPlaying && isInCountOff && countOffBeat < 4) {
                    // Play click and highlight beat
                    const isDownbeat = countOffBeat === 0;
                    playCountOffNote();
                    // Clear all highlights first
                    document.querySelectorAll('.tempo-segment').forEach(segment => {
                        segment.classList.remove('active', 'silent-beat');
                    });
                    
                    // Highlight only the current beat
                    const currentSegment = document.querySelector('[data-beat="' + countOffBeat + '"]');
                    if (currentSegment) {
                        currentSegment.classList.add('active');
                        console.log('Highlighting count-off beat:', countOffBeat);
                    }
                    
                    countOffBeat++;
                    
                    // After 4 beats, start the actual show
                    if (countOffBeat >= 4) {
                        clearInterval(countOffInterval);
                        countOffInterval = null;
                        isInCountOff = false;
                        
                        // Wait for the full beat duration before starting the show
                        setTimeout(() => {
                            // Only start the show if we're still playing and not in count-off
                            if (isPlaying && !isInCountOff) {
                                startMetronome();
                            }
                        }, countOffIntervalMs);
                    }
                } else {
                    // Stop if playing state changed
                    stopMetronome();
                }
            }, countOffIntervalMs);
        }
        
        function updateTempoBarForCountOff(numerator, tempo) {
            const tempoBar = document.getElementById('tempoBar');
            
            // Update measure number for count-off
            updateMeasureNumber('COUNT-OFF', 0);
            
            // Clear existing segments
            tempoBar.innerHTML = '';
            
            // Always create 4 segments for count-off (4/4 time signature)
            for (let i = 0; i < 4; i++) {
                const segment = document.createElement('div');
                segment.className = 'tempo-segment count-off-segment';
                segment.setAttribute('data-beat', i);
                tempoBar.appendChild(segment);
            }
        }
        
        function highlightBeatForCountOff(beatIndex) {
            // Remove active class from all segments
            document.querySelectorAll('.tempo-segment').forEach(segment => {
                segment.classList.remove('active', 'silent-beat');
            });
            
            // Add active class to current beat segment
            const currentSegment = document.querySelector('[data-beat="' + beatIndex + '"]');
            if (currentSegment) {
                currentSegment.classList.add('active');
            }
        }
        
        // Start continuous metronome at 120 BPM
        function startMetronome() {
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
            console.log('Starting metronome');
            
            // Clear any existing interval first
            if (metronomeInterval) {
                clearInterval(metronomeInterval);
                metronomeInterval = null;
            }
            
            isPlaying = true;
            currentBeat = 0;
            
            // Get the selected show
            const show = shows.find(s => s.id === selectedShow);
            if (!show || !show.measures || show.measures.length === 0) {
                console.log('No show or measures found');
                stopMetronome();
                return;
            }
            
            // Calculate start and end positions based on playback options
            const startPosition = calculateStartPosition(show);
            const endPosition = calculateEndPosition(show);
            
            console.log('Playback range: measure', startPosition + 1, 'to', endPosition);
            
            // Set initial values from start measure
            currentMeasure = startPosition;
            const startMeasureData = show.measures[startPosition];
            beatsPerMeasure = startMeasureData.timeSignature.numerator;
            let currentTempo = startMeasureData.tempo;
            const firstDenominator = startMeasureData.timeSignature.denominator;
            const beatDuration = 60000 / currentTempo; // Duration of a quarter note
            let interval = beatDuration * (4 / firstDenominator); // Calculate interval based on tempo and time signature
            
            console.log('Starting with', beatsPerMeasure, 'beats per measure at', currentTempo, 'BPM, time signature', startMeasureData.timeSignature.numerator + '/' + firstDenominator);
            
            // Initialize tempo bar and measure number
            updateTempoBar(beatsPerMeasure, currentTempo);
            updateMeasureNumber(currentMeasure + 1, show.measures.length);
            
            // Play first beat immediately (downbeat)
            const firstMeasureData = show.measures[currentMeasure];
            playClick(true, 0, firstMeasureData);
            highlightBeat(0, firstMeasureData); // Highlight first beat
            currentBeat++;
            
            // Function to start metronome with current measure's tempo
            function startMetronomeWithTempo() {
                if (metronomeInterval) {
                    clearInterval(metronomeInterval);
                }
                
                const currentMeasureData = show.measures[currentMeasure];
                currentTempo = currentMeasureData.tempo;
                
                // Calculate interval based on tempo and time signature denominator
                // The denominator tells us what note value gets the beat
                // 4 = quarter note, 8 = eighth note, 2 = half note, etc.
                const denominator = currentMeasureData.timeSignature.denominator;
                const beatDuration = 60000 / currentTempo; // Duration of a quarter note
                
                // Convert to the appropriate note value duration
                // For 4/4: quarter note = 60000/tempo
                // For 6/8: eighth note = (60000/tempo) * (4/8) = 60000/tempo * 0.5
                // For 3/2: half note = (60000/tempo) * (4/2) = 60000/tempo * 2
                interval = beatDuration * (4 / denominator);
                
                console.log('Starting metronome for measure', currentMeasure + 1, 'at', currentTempo, 'BPM, time signature', currentMeasureData.timeSignature.numerator + '/' + denominator, '(interval:', interval, 'ms)');
                
                // Set up interval for continuous playback
                metronomeInterval = setInterval(() => {
                    if (isPlaying) {
                        // Check if this is beat 1 of a new measure (for UI updates only)
                        if (currentBeat === 0) {
                            // Only update tempo bar if there's no pending change (otherwise it will be updated after the change)
                            if (!window.pendingTempoChange || window.pendingTempoChange.measure !== currentMeasure) {
                                updateTempoBar(beatsPerMeasure, currentTempo);
                            }
                            // Update measure number at the start of the measure
                            updateMeasureNumber(currentMeasure + 1, show.measures.length);
                        }

                        // Play click & highlight current beat with current tempo
                        const isDownbeat = currentBeat === 0;
                        const currentMeasureData = show.measures[currentMeasure];
                        playClick(isDownbeat, currentBeat, currentMeasureData);
                        highlightBeat(currentBeat, currentMeasureData); // Highlight current beat
                        
                        // Increment beat counter
                        currentBeat++;
                        
                        // Check if there's a pending tempo/time signature change that should take effect AFTER this beat
                        if (window.pendingTempoChange && window.pendingTempoChange.measure === currentMeasure && currentBeat === 1) {
                            console.log('Applying pending tempo/time signature change AFTER first beat of measure', currentMeasure + 1);
                            console.log('Changing from', beatsPerMeasure, 'beats to', window.pendingTempoChange.beatsPerMeasure, 'beats');
                            
                            // Update to new tempo and time signature
                            currentTempo = window.pendingTempoChange.tempo;
                            beatsPerMeasure = window.pendingTempoChange.beatsPerMeasure;
                            const newTimeSignature = window.pendingTempoChange.timeSignature;
                            
                            // Clear the pending change
                            window.pendingTempoChange = null;
                            
                            // Calculate new interval for the new tempo/time signature
                            const denominator = newTimeSignature.denominator;
                            const beatDuration = 60000 / currentTempo;
                            const newInterval = beatDuration * (4 / denominator);
                            
                            console.log('Dynamically switching to', currentTempo, 'BPM,', beatsPerMeasure, 'beats per measure, interval:', newInterval, 'ms');
                            
                            // Update tempo bar with new beats per measure
                            updateTempoBar(beatsPerMeasure, currentTempo);
                            
                            // Since the first beat was already played but the tempo bar just updated,
                            // we need to manually highlight the first segment to show it's active
                            const firstSegment = document.querySelector('[data-beat="0"]');
                            if (firstSegment) {
                                // Remove active class from all segments first
                                document.querySelectorAll('.tempo-segment').forEach(segment => {
                                    segment.classList.remove('active');
                                });
                                // Add active class to first segment
                                firstSegment.classList.add('active');
                            }
                            
                            // Clear current interval and start new one with updated tempo
                            clearInterval(metronomeInterval);
                            interval = newInterval;
                            
                            // Start the metronome again with the new interval but continue from current position
                            startMetronomeWithTempo();
                            return;
                        }
                        
                        // Check if we've completed a measure (after incrementing)
                        if (currentBeat >= beatsPerMeasure) {
                            currentMeasure++;
                            currentBeat = 0;
                            console.log('Completed measure:', currentMeasure);
                            
                            // Check if we've reached the end position
                            if (currentMeasure >= endPosition) {
                                console.log('Show completed (reached end position)');
                                // Stop immediately but keep the highlight visible for a moment
                                isPlaying = false;
                                setTimeout(() => {
                                    stopMetronome();
                                }, interval);
                                return;
                            }
                            
                            // Prepare for next measure - but don't change tempo/interval yet
                            const nextMeasure = show.measures[currentMeasure];
                            const previousTempo = currentTempo;
                            
                            // Check if tempo or time signature is changing
                            if (nextMeasure.tempo !== previousTempo || nextMeasure.timeSignature.numerator !== beatsPerMeasure) {
                                console.log('Tempo/time signature change detected - will update on next beat');
                                // Mark that we need to restart the metronome with new settings
                                window.pendingTempoChange = {
                                    measure: currentMeasure,
                                    tempo: nextMeasure.tempo,
                                    beatsPerMeasure: nextMeasure.timeSignature.numerator,
                                    timeSignature: nextMeasure.timeSignature
                                };
                                
                                // Send message to React Native about measure completion
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'MEASURE_COMPLETED',
                                    measure: currentMeasure,
                                    beatsPerMeasure: nextMeasure.timeSignature.numerator,
                                    tempo: nextMeasure.tempo
                                }));
                            } else {
                                // No tempo/time signature change - just update the measure counter
                                beatsPerMeasure = nextMeasure.timeSignature.numerator;
                                
                                // Send message to React Native about measure completion
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'MEASURE_COMPLETED',
                                    measure: currentMeasure,
                                    beatsPerMeasure: beatsPerMeasure,
                                    tempo: nextMeasure.tempo
                                }));
                            }
                        }
                    } else {
                        // Stop if playing state changed
                        stopMetronome();
                    }
                }, interval);
            }
            
            // Initialize metronome with first measure's tempo
            startMetronomeWithTempo();
        }
        
        // Stop metronome
        function stopMetronome() {
            if (metronomeInterval) {
                clearInterval(metronomeInterval);
                metronomeInterval = null;
            }
            if (countOffInterval) {
                clearInterval(countOffInterval);
                countOffInterval = null;
            }

            // Reset beat and measure counters
            currentBeat = 0;
            currentMeasure = 0;
            countOffBeat = 0;
            isInCountOff = false;
            
            // Set default 4/4 tempo bar state and reset measure number
            updateTempoBar(4, 120);
            updateMeasureDisplay();
            
            // Reset button state to play
            isPlaying = false;
            document.getElementById('playButton').classList.remove('playing');
            document.getElementById('iconContainer').classList.remove('playing');
        }
        

        
        // Initialize
        renderShows();
        
        // Initialize tempo bar with default 4/4 state and measure number
        updateTempoBar(4, 120);
        updateMeasureDisplay();
        
        // Settings button event listener
        document.getElementById('settingsButton').addEventListener('click', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'OPEN_SETTINGS'
            }));
        });
        
        // Measure button event listener
        document.getElementById('measureButton').addEventListener('click', () => {
            console.log('Measure button clicked!');
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'OPEN_PLAYBACK_OPTIONS'
            }));
        });
        
        // Expose functions to React Native
        window.updateShowsData = updateShowsData;

        
        console.log('WebView Show UI initialized');
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
        onLoad={() => {
          // Send initial data to WebView
          setTimeout(() => {
            webViewRef.current?.injectJavaScript(`
              if (window.updateShowsData) {
                window.updateShowsData(${JSON.stringify(shows)}, '${selectedShow}');
              }
            `);
          }, 100);
        }}
        onError={(error) => console.log('WebView Show error:', error)}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'ADD_SHOW' && onAddShow) {
              onAddShow();
            } else if (message.type === 'SELECT_SHOW' && onSelectShow) {
              onSelectShow(message.showId);
            } else if (message.type === 'RENAME_SHOW' && onRenameShow) {
              onRenameShow(message.showId, message.newName);
            } else if (message.type === 'UPDATE_SHOW_MEASURES' && onUpdateShowMeasures) {
              onUpdateShowMeasures(message.showId, message.measures);
            } else if (message.type === 'DELETE_SHOW' && onDeleteShow) {
              onDeleteShow(message.showId);
            } else if (message.type === 'EXPORT_SHOW' && onMessage) {
              onMessage(event);
            } else if (message.type === 'IMPORT_SHOW' && onMessage) {
              onMessage(event);
            } else if (message.type === 'MEASURE_COMPLETED') {
              console.log('Measure completed:', message.measure, 'with', message.beatsPerMeasure, 'beats per measure at', message.tempo, 'BPM');
              if (onMeasureCompleted) {
                onMeasureCompleted(message.measure, message.beatsPerMeasure, message.tempo);
              }
            } else if (message.type === 'OPEN_SETTINGS' && onOpenSettings) {
              onOpenSettings();
            } else if (message.type === 'OPEN_PLAYBACK_OPTIONS' && onMessage) {
              onMessage(event);
            } else if (message.type === 'LOG') {
              console.log('WebView Log:', message.message);
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

WebViewShow.displayName = 'WebViewShow';

export default WebViewShow; 