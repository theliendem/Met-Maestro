import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface WebViewMetronomeProps {
  tempo: number;
  timeSignature: { numerator: number; denominator: number };
  isPlaying: boolean;
  onBeatChange?: (beat: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onMeasureChange?: (measure: number) => void;
}

const WebViewMetronome: React.FC<WebViewMetronomeProps> = ({
  tempo,
  timeSignature,
  isPlaying,
  onBeatChange,
  onPlayStateChange,
  onMeasureChange,
}) => {
  const webViewRef = useRef<WebView>(null);

  // HTML content for the WebView metronome
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metronome</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #1a1a1a;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        
        .container {
            text-align: center;
            width: 100%;
            max-width: 400px;
        }
        
        .tempo-display {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #ffffff;
        }
        
        .time-signature {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
            font-size: 24px;
            font-weight: bold;
        }
        
        .numerator, .denominator {
            padding: 10px 20px;
            background-color: #333;
            border-radius: 8px;
            margin: 0 10px;
            min-width: 60px;
            text-align: center;
        }
        
        .fraction-line {
            width: 40px;
            height: 2px;
            background-color: #666;
            margin: 0 10px;
        }
        
        .tempo-bar {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 30px;
        }
        
        .beat-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #333;
            border: 2px solid #555;
            transition: all 0.1s ease;
        }
        
        .beat-circle.active {
            background-color: #007AFF;
            border-color: #007AFF;
            transform: scale(1.1);
        }
        
        .beat-circle.downbeat {
            background-color: #FF3B30;
            border-color: #FF3B30;
        }
        
        .beat-circle.downbeat.active {
            background-color: #FF6B6B;
            border-color: #FF6B6B;
            transform: scale(1.1);
        }
        
        .play-button {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #007AFF;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .play-button:hover {
            background-color: #0056CC;
            transform: scale(1.05);
        }
        
        .play-button.playing {
            background-color: #FF3B30;
        }
        
        .play-button.playing:hover {
            background-color: #CC2E25;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="tempo-display" id="tempoDisplay">120 BPM</div>
        
        <div class="time-signature">
            <div class="numerator" id="numerator">4</div>
            <div class="fraction-line"></div>
            <div class="denominator" id="denominator">4</div>
        </div>
        
        <div class="tempo-bar" id="tempoBar">
            <!-- Beat circles will be generated here -->
        </div>
        
        <button class="play-button" id="playButton">▶</button>
    </div>

    <script>
        let audioContext;
        let oscillator;
        let gainNode;
        let isPlaying = false;
        let currentBeat = 0;
        let currentMeasure = 0;
        let tempo = 120;
        let timeSignature = { numerator: 4, denominator: 4 };
        let intervalId = null;
        
        // Initialize audio context
        function initAudio() {
            try {
                // Create audio context with proper fallbacks
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                console.log('Audio context initialized successfully');
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
            
            console.log('Playing click:', isDownbeat ? 'downbeat' : 'offbeat');
            const startTime = audioContext.currentTime;
            const duration = 0.08;
            
            if (isDownbeat) {
                // Downbeat: higher frequency with more harmonics
                const oscillator1 = audioContext.createOscillator();
                const oscillator2 = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator1.connect(gainNode);
                oscillator2.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Primary frequency
                oscillator1.frequency.setValueAtTime(800, startTime);
                oscillator1.type = 'sine';
                
                // Harmonic frequency for richer sound
                oscillator2.frequency.setValueAtTime(1200, startTime);
                oscillator2.type = 'sine';
                
                // Gain envelope for downbeat
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.005);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                oscillator1.start(startTime);
                oscillator2.start(startTime);
                oscillator1.stop(startTime + duration);
                oscillator2.stop(startTime + duration);
            } else {
                // Offbeat: simpler, lower frequency
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(600, startTime);
                oscillator.type = 'sine';
                
                // Gain envelope for offbeat
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.005);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            }
        }
        
        // Calculate interval based on tempo and time signature
        function calculateInterval() {
            const beatDuration = 60000 / (tempo * (4 / timeSignature.denominator));
            return beatDuration;
        }
        
        // Update tempo bar
        function updateTempoBar() {
            const tempoBar = document.getElementById('tempoBar');
            tempoBar.innerHTML = '';
            
            for (let i = 0; i < timeSignature.numerator; i++) {
                const circle = document.createElement('div');
                circle.className = 'beat-circle';
                if (i === 0) circle.classList.add('downbeat');
                if (i === currentBeat) circle.classList.add('active');
                tempoBar.appendChild(circle);
            }
        }
        
        // Start metronome
        function startMetronome() {
            if (isPlaying) return;
            
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
            isPlaying = true;
            currentBeat = 0;
            currentMeasure = 0;
            
            const interval = calculateInterval();
            
            // Send initial state to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'playStateChange',
                isPlaying: true
            }));
            
            // Play first beat immediately
            playClick(true);
            updateTempoBar();
            
            intervalId = setInterval(() => {
                currentBeat++;
                if (currentBeat >= timeSignature.numerator) {
                    currentBeat = 0;
                    currentMeasure++;
                    
                    // Send measure change to React Native
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'measureChange',
                        measure: currentMeasure
                    }));
                }
                
                const isDownbeat = currentBeat === 0;
                playClick(isDownbeat);
                
                // Send beat change to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'beatChange',
                    beat: currentBeat,
                    measure: currentMeasure
                }));
                
                updateTempoBar();
            }, interval);
            
            document.getElementById('playButton').textContent = '⏸';
            document.getElementById('playButton').classList.add('playing');
        }
        
        // Stop metronome
        function stopMetronome() {
            if (!isPlaying) return;
            
            isPlaying = false;
            
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            
            // Send state change to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'playStateChange',
                isPlaying: false
            }));
            
            currentBeat = 0;
            currentMeasure = 0;
            updateTempoBar();
            document.getElementById('playButton').textContent = '▶';
            document.getElementById('playButton').classList.remove('playing');
        }
        
        // Update tempo and time signature
        function updateSettings(newTempo, newTimeSignature) {
            tempo = newTempo;
            timeSignature = newTimeSignature;
            
            document.getElementById('tempoDisplay').textContent = tempo + ' BPM';
            document.getElementById('numerator').textContent = timeSignature.numerator;
            document.getElementById('denominator').textContent = timeSignature.denominator;
            
            updateTempoBar();
            
            // Restart if currently playing
            if (isPlaying) {
                stopMetronome();
                startMetronome();
            }
        }
        
        // Handle play button click
        document.getElementById('playButton').addEventListener('click', () => {
            if (isPlaying) {
                stopMetronome();
            } else {
                startMetronome();
            }
        });
        
        // Initialize
        updateTempoBar();
        
        // Test audio context on page load
        setTimeout(() => {
            if (!audioContext) {
                initAudio();
            }
            if (audioContext) {
                console.log('Audio context state:', audioContext.state);
                // Test sound
                playClick(true);
            }
        }, 1000);
        
        // Listen for messages from React Native
        window.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'updateSettings') {
                    updateSettings(data.tempo, data.timeSignature);
                } else if (data.type === 'setPlayState') {
                    if (data.isPlaying && !isPlaying) {
                        startMetronome();
                    } else if (!data.isPlaying && isPlaying) {
                        stopMetronome();
                    }
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        });
    </script>
</body>
</html>
  `;

  // Send settings to WebView
  const sendSettings = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'updateSettings',
        tempo,
        timeSignature
      }));
    }
  }, [tempo, timeSignature]);

  // Send play state to WebView
  const sendPlayState = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setPlayState',
        isPlaying
      }));
    }
  }, [isPlaying]);

  // Handle messages from WebView
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'beatChange':
          onBeatChange?.(data.beat);
          break;
        case 'measureChange':
          onMeasureChange?.(data.measure);
          break;
        case 'playStateChange':
          onPlayStateChange?.(data.isPlaying);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [onBeatChange, onMeasureChange, onPlayStateChange]);

  // Update WebView when props change
  useEffect(() => {
    sendSettings();
  }, [sendSettings]);

  useEffect(() => {
    sendPlayState();
  }, [sendPlayState]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  webview: {
    flex: 1,
  },
});

export default WebViewMetronome; 