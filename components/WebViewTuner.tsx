import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface WebViewTunerProps {
  themeColors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    icon: string;
    accent: string;
    orange: string;
  };
  tunerData: {
    note: string | null;
    freq: number | null;
    cents: number | null;
    error: string | null;
    permission: 'unknown' | 'granted' | 'denied';
  };
  onRequestPermission?: () => void;
  onRefreshPermission?: () => void;
  onOpenSettings?: () => void;
}

const WebViewTuner: React.FC<WebViewTunerProps> = ({ 
  themeColors, 
  tunerData,
  onRequestPermission,
  onRefreshPermission,
  onOpenSettings
}) => {
  const webViewRef = useRef<WebView>(null);
  
  // Update WebView when tuner data changes
  React.useEffect(() => {
    if (webViewRef.current) {
      // Use a timeout to ensure the WebView is ready
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          if (window.updateTunerData) {
            window.updateTunerData(${JSON.stringify(tunerData)});
          }
        `);
      }, 100);
    }
  }, [tunerData.note, tunerData.freq, tunerData.cents, tunerData.error, tunerData.permission]);

  // HTML content for the complete tuner UI
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Tuner Mode</title>
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
            --input-bg: #181A20;
            --red: #e53935;
            --accent-10: rgba(187,134,252,0.1);
            --accent-30: rgba(187,134,252,0.3);
            --accent-40: rgba(187,134,252,0.4);
            --accent-70: rgba(187,134,252,0.7);
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
            display: flex;
            flex-direction: column;
            height: 100%;
            align-items: center;
            justify-content: center;
            gap: 8vh;
        }
        
        /* Permission Screen */
        .permission-screen {
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 24px;
            height: 100%;
        }
        
        .permission-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 16px;
            color: var(--text);
        }
        
        .permission-description {
            font-size: 16px;
            margin-bottom: 24px;
            color: var(--text);
            opacity: 0.8;
            line-height: 1.5;
        }
        
        .permission-error {
            font-size: 14px;
            margin-bottom: 16px;
            color: var(--red);
            text-align: center;
        }
        
        .permission-button {
            background-color: var(--accent);
            color: var(--white);
            border: none;
            border-radius: 12px;
            padding: 16px 32px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            transition: all 0.2s ease;
        }
        
        .permission-button:hover {
            background-color: var(--accent-70);
        }
        
        /* Tuner UI */
        .tuner-ui {
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 8vh;
        }
        
        /* Needle Bar */
        .needle-container {
            position: relative;
            width: 80vw;
            height: 18vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 7vh;
        }
        
        .needle-bar {
            width: 12px;
            height: 14.4vh;
            background-color: var(--accent);
            border-radius: 2px;
            position: absolute;
            bottom: 0;
            transform-origin: bottom center;
            transition: transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .needle-bar.inactive {
            background-color: #888;
            opacity: 0.5;
        }
        
        .needle-bar.sharp {
            background-color: var(--orange);
        }
        
        .needle-bar.flat {
            background-color: var(--orange);
        }
        
        .needle-bar.in-tune {
            background-color: var(--accent);
        }
        
        /* Reference Labels */
        .ref-zero {
            position: absolute;
            top: 0;
            font-size: 2.5vh;
            color: #9BA1A6;
            text-align: center;
        }
        
        .ref-minus {
            position: absolute;
            bottom: 0;
            left: 2vw;
            font-size: 2vh;
            color: #9BA1A6;
        }
        
        .ref-plus {
            position: absolute;
            bottom: 0;
            right: 2vw;
            font-size: 2vh;
            color: #9BA1A6;
        }
        
        /* Note Display */
        .note-container {
            margin-bottom: 3vh;
        }
        
        .note-label {
            font-size: 8vh;
            font-weight: bold;
            letter-spacing: 1.5px;
            text-align: center;
            color: var(--text);
            transition: color 0.2s ease;
        }
        
        .note-label.inactive {
            color: var(--text);
        }
        
        .note-label.in-tune {
            color: var(--accent);
        }
        
        /* Info Display */
        .info-container {
            display: flex;
            flex-direction: row;
            justify-content: space-around;
            width: 100%;
            margin-bottom: 2vh;
        }
        
        .freq-label {
            font-size: 2.5vh;
            color: #888;
            text-align: center;
            font-variant-numeric: tabular-nums;
            margin-bottom: 2vh;
        }
        
        .cents-label {
            font-size: 3vh;
            font-weight: 600;
            text-align: center;
            margin-bottom: 2.5vh;
            letter-spacing: 1px;
            color: var(--accent);
        }
        
        /* Loading Screen */
        .loading-screen {
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--medium-gray);
            border-top: 4px solid var(--accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            font-size: 16px;
            color: var(--text);
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
        <!-- Loading Screen -->
        <div class="loading-screen" id="loadingScreen">
            <div class="loading-spinner"></div>
            <div class="loading-text">Checking microphone permission…</div>
        </div>
        
        <!-- Permission Screen -->
        <div class="permission-screen" id="permissionScreen">
            <div class="permission-title">Microphone Access Needed</div>
            <div class="permission-description">
                To use the tuner, Met Maestro needs access to your device's microphone to listen and detect pitch in real time.
            </div>
            <div class="permission-error" id="permissionError" style="display: none;"></div>
            <div class="permission-error" id="permissionStatus" style="display: none;"></div>
            <button class="permission-button" id="requestPermissionBtn">Grant Microphone Access</button>
            <button class="permission-button" id="refreshPermissionBtn" style="margin-top: 8px;">Refresh Permission Status</button>
        </div>
        
        <!-- Tuner UI -->
        <div class="tuner-ui" id="tunerUI">
            <!-- Needle Bar -->
            <div class="needle-container">
                <div class="ref-zero">0¢</div>
                <div class="ref-minus">-30¢</div>
                <div class="ref-plus">+30¢</div>
                <div class="needle-bar" id="needleBar"></div>
            </div>
            
            <!-- Note Display -->
            <div class="note-container">
                <div class="note-label" id="noteLabel">—</div>
            </div>
            
            <!-- Info Display -->
            <div class="info-container">
                <div class="freq-label" id="freqLabel">—</div>
                <div class="cents-label" id="centsLabel">—</div>
            </div>
        </div>
        
        <!-- Settings Button -->
        <div class="settings-button" id="settingsButton">
            <svg class="settings-icon" viewBox="0 0 24 24">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
            </svg>
        </div>
    </div>

    <script>
        // Tuner data from React Native
        let tunerData = ${JSON.stringify(tunerData)};
        let lastDetectedNote = null;
        let lastDetectedCents = null;
        let lastDetectedFreq = null;
        let showDash = true;
        let timeoutRef = null;
        
        // Function to update tuner data from React Native
        function updateTunerData(newTunerData) {
            // Only log if there's an actual change in permission state
            if (tunerData.permission !== newTunerData.permission) {
                console.log('Permission state changed from', tunerData.permission, 'to', newTunerData.permission);
            }
            tunerData = newTunerData;
            updateUI();
        }
        
        // Function to update the UI based on current state
        function updateUI() {
            const loadingScreen = document.getElementById('loadingScreen');
            const permissionScreen = document.getElementById('permissionScreen');
            const tunerUI = document.getElementById('tunerUI');
            const permissionError = document.getElementById('permissionError');
            const permissionStatus = document.getElementById('permissionStatus');
            const requestPermissionBtn = document.getElementById('requestPermissionBtn');
            
            // Show appropriate screen based on permission state
            if (tunerData.permission === 'unknown') {
                loadingScreen.style.display = 'flex';
                permissionScreen.style.display = 'none';
                tunerUI.style.display = 'none';
                return;
            } else if (tunerData.permission !== 'granted') {
                loadingScreen.style.display = 'none';
                permissionScreen.style.display = 'flex';
                tunerUI.style.display = 'none';
                
                // Show error if present
                if (tunerData.error) {
                    permissionError.textContent = tunerData.error;
                    permissionError.style.display = 'block';
                } else {
                    permissionError.style.display = 'none';
                }
                
                // Show appropriate status message
                if (tunerData.permission === 'denied') {
                    permissionStatus.textContent = 'Permission denied. Please enable microphone access in your device settings.';
                    permissionStatus.style.display = 'block';
                    requestPermissionBtn.style.display = 'none';
                } else {
                    permissionStatus.textContent = 'Microphone access is currently denied or not granted.';
                    permissionStatus.style.display = 'block';
                    requestPermissionBtn.style.display = 'block';
                }
                return;
            } else {
                loadingScreen.style.display = 'none';
                permissionScreen.style.display = 'none';
                tunerUI.style.display = 'flex';
            }
            
            // Update tuner UI
            updateTunerDisplay();
        }
        
        // Function to update tuner display
        function updateTunerDisplay() {
            const needleBar = document.getElementById('needleBar');
            const noteLabel = document.getElementById('noteLabel');
            const freqLabel = document.getElementById('freqLabel');
            const centsLabel = document.getElementById('centsLabel');
            
            const detected = tunerData.note !== null && tunerData.freq !== null && tunerData.cents !== null && !tunerData.error;
            
            // Handle note label display logic
            if (detected && tunerData.note) {
                lastDetectedNote = tunerData.note;
                lastDetectedCents = tunerData.cents !== null ? (tunerData.cents > 0 ? \`+\${tunerData.cents}\` : \`\${tunerData.cents}\`) : null;
                lastDetectedFreq = tunerData.freq !== null ? \`\${tunerData.freq.toFixed(1)} Hz\` : null;
                showDash = false;
                if (timeoutRef) {
                    clearTimeout(timeoutRef);
                    timeoutRef = null;
                }
            } else if (lastDetectedNote) {
                // If we previously detected a note but now don't, start a 5s timer
                if (!timeoutRef) {
                    timeoutRef = setTimeout(() => {
                        showDash = true;
                        timeoutRef = null;
                        updateTunerDisplay();
                    }, 5000);
                }
            } else {
                showDash = true;
            }
            
            // Derive display string with enharmonic (e.g. A♯ / B♭)
            let noteDisplay = '—';
            const enhMap = {
                'C#': 'D♭',
                'D#': 'E♭',
                'F#': 'G♭',
                'G#': 'A♭',
                'A#': 'B♭',
            };
            let noteToShow = null;
            if (!showDash && lastDetectedNote) {
                noteToShow = lastDetectedNote;
            } else if (detected && tunerData.note) {
                noteToShow = tunerData.note;
            }
            if (noteToShow) {
                const base = noteToShow.slice(0, -1).replace('♯', '#');
                const sharpDisplay = base.replace('#', '♯');
                const enh = enhMap[base];
                noteDisplay = enh ? \`\${sharpDisplay} / \${enh}\` : sharpDisplay;
            }
            
            // Update note label
            noteLabel.textContent = noteDisplay;
            
            // Update needle bar
            let needleRotation = 0;
            let needleClass = 'inactive';
            
            if (!showDash) {
                // Use last detected or current detected value
                if (tunerData.cents !== null && tunerData.cents !== undefined) {
                    needleRotation = Math.max(-30, Math.min(30, tunerData.cents));
                } else if (lastDetectedCents) {
                    // Parse the string value (e.g. '+5' or '-12')
                    const parsed = parseInt(lastDetectedCents, 10);
                    if (!isNaN(parsed)) needleRotation = Math.max(-30, Math.min(30, parsed));
                }
                
                const isInTune = detected && Math.abs(tunerData.cents ?? 999) <= 5;
                if (isInTune) {
                    needleClass = 'in-tune';
                    noteLabel.className = 'note-label in-tune';
                } else {
                    needleClass = needleRotation > 0 ? 'sharp' : 'flat';
                    noteLabel.className = 'note-label';
                }
            } else {
                needleClass = 'inactive';
                noteLabel.className = 'note-label inactive';
            }
            
            // Apply needle rotation and class
            needleBar.style.transform = \`rotate(\${needleRotation}deg)\`;
            needleBar.className = \`needle-bar \${needleClass}\`;
            
            // Update frequency and cents display
            const freq = (!showDash && lastDetectedFreq) ? lastDetectedFreq : (detected && tunerData.freq !== null ? \`\${tunerData.freq.toFixed(1)} Hz\` : '—');
            const cents = (!showDash && lastDetectedCents) ? lastDetectedCents : (detected && tunerData.cents !== null ? (tunerData.cents > 0 ? \`+\${tunerData.cents}\` : \`\${tunerData.cents}\`) : '—');
            const centsWithSymbol = cents !== '—' ? \`\${cents}¢\` : '—';
            
            freqLabel.textContent = freq;
            centsLabel.textContent = centsWithSymbol;
        }
        
        // Event listeners
        document.getElementById('requestPermissionBtn').addEventListener('click', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'REQUEST_PERMISSION'
            }));
        });
        
        document.getElementById('refreshPermissionBtn').addEventListener('click', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'REFRESH_PERMISSION'
            }));
        });
        
        document.getElementById('settingsButton').addEventListener('click', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'OPEN_SETTINGS'
            }));
        });
        
        // Initialize
        updateUI();
        
        // Expose functions to React Native
        window.updateTunerData = updateTunerData;
        
        // WebView Tuner UI initialized
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
              if (window.updateTunerData) {
                window.updateTunerData(${JSON.stringify(tunerData)});
              }
            `);
          }, 100);
        }}
        onError={(error) => console.log('WebView Tuner error:', error)}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'REQUEST_PERMISSION' && onRequestPermission) {
              onRequestPermission();
            } else if (message.type === 'REFRESH_PERMISSION' && onRefreshPermission) {
              onRefreshPermission();
            } else if (message.type === 'OPEN_SETTINGS' && onOpenSettings) {
              onOpenSettings();
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewTuner; 