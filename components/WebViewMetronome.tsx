import React, { useRef } from 'react';
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
}

const WebViewMetronome: React.FC<WebViewMetronomeProps> = ({ themeColors }) => {
  const webViewRef = useRef<WebView>(null);

  // HTML content for the complete metronome UI
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
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
            background: var(--primary);
        }
        
        .tempo-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .play-button {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: var(--accent);
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
            background: var(--primary);
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
            background: rgba(187,134,252,0.2);
        }
        
        .tap-bpm-btn.active {
            border-color: var(--accent);
            background: rgba(187,134,252,0.2);
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
            background: rgba(187,134,252,0.2);
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
            background: rgba(187,134,252,0.1);
        }
        
        .subdivision-option.selected {
            border-color: var(--accent);
            background: rgba(187,134,252,0.2);
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
        
        // Play a click sound using Web Audio API
        function playClick(isDownbeat = false) {
            if (!audioContext) {
                console.error('No audio context available');
                return;
            }
            
            const startTime = audioContext.currentTime;
            const duration = 0.08;
            
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
            document.getElementById('playButton').style.background = 'var(--orange)';
        }
        
        // Stop metronome
        function stopMetronome() {
            console.log('Stopping metronome');
            
            // Clear interval first
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            
            // Update state
            isPlaying = false;
            
            // Update UI
            document.getElementById('playButton').innerHTML = '<div class="play-icon"></div>';
            document.getElementById('playButton').classList.remove('playing');
            document.getElementById('playButton').style.background = 'var(--accent)';
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
        
        document.getElementById('subdivisionBtn').addEventListener('click', showSubdivisionModal);
        
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
        updateTempoDisplay();
        

    </script>
</body>
</html>
  `;



  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onLoad={() => console.log('WebView loaded')}
        onError={(error) => console.log('WebView error:', error)}
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