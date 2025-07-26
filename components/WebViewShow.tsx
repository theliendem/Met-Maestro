import { AppTheme } from '@/theme/AppTheme';
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
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
  };
  shows?: {
    id: string;
    name: string;
    measures: {
      id: string;
      timeSignature: { numerator: number; denominator: number };
      tempo: number;
      count: number;
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
}

const WebViewShow: React.FC<WebViewShowProps> = ({ 
  themeColors, 
  shows = [], 
  selectedShow, 
  onAddShow, 
  onSelectShow, 
  onRenameShow, 
  onUpdateShowMeasures, 
  onDeleteShow,
  onMessage
}) => {
  const webViewRef = useRef<WebView>(null);
  
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
            --white: #ffffff;
            --dark-gray: #202127;
            --medium-gray: #23242A;
            --light-gray: #333;
            --input-bg: #181A20;
            --red: #e53935;
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
            gap: 8px;
            padding-top: 25vh;
        }
        

        

        
        /* Tempo Bar */
        .tempo-bar {
            width: 100%;
            height: 40px;
            background-color: var(--dark-gray);
            border-radius: 8px;
            margin-bottom: 12px;
            position: relative;
            display: flex;
            overflow: hidden;
        }
        
        .tempo-segment {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.1s ease;
            overflow: hidden;
        }
        
        .tempo-segment.active::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--accent);
            transform: skew(30deg);
            transform-origin: center;
            z-index: 1;
        }
        
        .tempo-segment:not(:last-child)::after {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(330deg, transparent 0%, var(--accent) 50%, transparent 100%);
            transform: rotate(330deg);
        }
        
        /* Show Manager Row */
        .show-manager-row {
            display: flex;
            margin-bottom: 8px;
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
            padding: 12px;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 100px;
            max-height: 60vh;
        }
        
        .measure-header {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
        }
        
        .add-measure-btn {
            background-color: transparent;
            border: 1px solid var(--accent);
            border-radius: 8px;
            padding: 8px 16px;
            color: var(--text);
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
        
        .add-measure-btn:hover {
            background-color: rgba(187,134,252,0.1);
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
            max-height: 45vh;
        }
        
        .measure-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--medium-gray);
            border-radius: 12px;
            padding: 8px;
            margin-bottom: 2px;
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
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10;
        }
        
        .play-button {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: var(--accent);
            border: none;
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
            box-shadow: 0 4px 12px rgba(187,134,252,0.3);
        }
        
        .play-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(187,134,252,0.4);
        }
        
        .play-button.playing {
            background: var(--orange);
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
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 16px;
        }
        
        .input-group {
            margin-bottom: 16px;
        }
        
        .input-label {
            color: var(--text);
            margin-bottom: 4px;
            font-size: 14px;
        }
        
        .input {
            background: var(--input-bg);
            color: var(--text);
            border-radius: 8px;
            padding: 12px;
            border: 1px solid var(--light-gray);
            width: 100%;
            font-size: 16px;
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
            font-size: 14px;
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
            font-size: 14px;
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
        
        /* Snackbar removed */
    </style>
</head>
<body>
    <div class="container">

        

        
        <!-- Tempo Bar -->
        <div class="tempo-bar" id="tempoBar">
            <div class="tempo-segment"></div>
            <div class="tempo-segment"></div>
            <div class="tempo-segment"></div>
            <div class="tempo-segment"></div>
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
                    <span style="color: var(--white); margin-right: 6px;">Condensed</span>
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
                    <span style="color: var(--text); font-weight: 600;">/</span>
                    <input type="text" class="input" id="denominatorInput" value="4" inputmode="numeric" pattern="[0-9]*">
                </div>
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
            <div style="color: var(--text); margin-bottom: 16px;">
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
                    <span style="color: var(--text); font-weight: 600;">/</span>
                    <input type="text" class="input" id="editDenominatorInput" value="4" inputmode="numeric" pattern="[0-9]*">
                </div>
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel" id="editMeasuresCancelBtn">Cancel</button>
                <button class="modal-btn delete" id="deleteMeasuresBtn">Delete</button>
                <button class="modal-btn save" id="editMeasuresSaveBtn">Save</button>
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
    
    <!-- Snackbar removed -->

    <script>
        // Show data from React Native
        let shows = ${JSON.stringify(shows)};
        let selectedShow = '${selectedShow || '1'}';
        
        // Function to update shows data from React Native
        function updateShowsData(newShows, newSelectedShow) {
            console.log('Updating shows data:', newShows, newSelectedShow);
            shows = newShows;
            selectedShow = newSelectedShow;
            renderShows();
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
                });
                
                showScroll.appendChild(showChip);
            });
            
            // Render measures for the initially selected show
            if (selectedShow) {
                const selectedShowData = shows.find(s => s.id === selectedShow);
                if (selectedShowData) {
                    renderMeasures(selectedShowData);
                }
            }
        }
        
        // Function to render measures for a show
        function renderMeasures(show) {
            const measureList = document.getElementById('measureList');
            measureList.innerHTML = '';
            
            if (!show.measures || show.measures.length === 0) {
                measureList.innerHTML = '<div class="empty-state">No measures in this show</div>';
                return;
            }
            let toRender;
            if (condensedView) {
                // Group consecutive measures with the same time signature and tempo
                const clumped = [];
                for (let i = 0; i < show.measures.length; i++) {
                    const m = show.measures[i];
                    if (
                        clumped.length > 0 &&
                        clumped[clumped.length - 1].timeSignature.numerator === m.timeSignature.numerator &&
                        clumped[clumped.length - 1].timeSignature.denominator === m.timeSignature.denominator &&
                        clumped[clumped.length - 1].tempo === m.tempo
                    ) {
                        clumped[clumped.length - 1].count += 1;
                    } else {
                        clumped.push({ ...m, count: 1 });
                    }
                }
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
        }
        let condensedView = true;
        
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
        
        // Snackbar removed
        
        // Event listeners
        document.getElementById('addMeasureBtn').addEventListener('click', () => {
            showModal('addMeasureModal');
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
                                    currentMeasure.tempo === measure.tempo) {
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
                        // Find the end of the current measure group
                        let groupEnd = measureIndex;
                        const currentMeasure = show.measures[measureIndex];
                        for (let i = measureIndex + 1; i < show.measures.length; i++) {
                            if (show.measures[i].timeSignature.numerator === currentMeasure.timeSignature.numerator &&
                                show.measures[i].timeSignature.denominator === currentMeasure.timeSignature.denominator &&
                                show.measures[i].tempo === currentMeasure.tempo) {
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
                                show.measures[i].tempo === prevMeasure.tempo) {
                                prevGroupEnd = i;
                            } else {
                                break;
                            }
                        }
                        
                        // Move the current group above the previous group
                        const currentGroup = show.measures.slice(measureIndex, groupEnd + 1);
                        const previousGroup = show.measures.slice(prevGroupEnd, measureIndex);
                        const updatedMeasures = [
                            ...show.measures.slice(0, prevGroupEnd),
                            ...currentGroup,
                            ...previousGroup,
                            ...show.measures.slice(groupEnd + 1)
                        ];
                        
                        // Send message to React Native to update show measures
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'UPDATE_SHOW_MEASURES',
                            showId: show.id,
                            measures: updatedMeasures
                        }));
                        
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
                        // Find the end of the current measure group
                        let groupEnd = measureIndex;
                        const currentMeasure = show.measures[measureIndex];
                        for (let i = measureIndex + 1; i < show.measures.length; i++) {
                            if (show.measures[i].timeSignature.numerator === currentMeasure.timeSignature.numerator &&
                                show.measures[i].timeSignature.denominator === currentMeasure.timeSignature.denominator &&
                                show.measures[i].tempo === currentMeasure.tempo) {
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
                                    show.measures[i].tempo === nextMeasure.tempo) {
                                    nextGroupEnd = i;
                                } else {
                                    break;
                                }
                            }
                        }
                        
                        // Move the current group below the next group
                        const currentGroup = show.measures.slice(measureIndex, groupEnd + 1);
                        const nextGroup = show.measures.slice(groupEnd + 1, nextGroupEnd + 1);
                        const updatedMeasures = [
                            ...show.measures.slice(0, measureIndex),
                            ...nextGroup,
                            ...currentGroup,
                            ...show.measures.slice(nextGroupEnd + 1)
                        ];
                        
                        // Send message to React Native to update show measures
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'UPDATE_SHOW_MEASURES',
                            showId: show.id,
                            measures: updatedMeasures
                        }));
                        
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
                    count: 1
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
                        currentMeasure.tempo === originalMeasure.tempo) {
                        updatedMeasures[i] = {
                            ...currentMeasure,
                            timeSignature: { numerator, denominator },
                            tempo
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
                    tempo
                };
            }
            
            // Send message to React Native to update show measures
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'UPDATE_SHOW_MEASURES',
                showId: show.id,
                measures: updatedMeasures
            }));
            
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
            
            // Remove the measure
            const updatedMeasures = show.measures.filter(m => m.id !== window.editingMeasureId);
            
            // Send message to React Native to update show measures
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'UPDATE_SHOW_MEASURES',
                showId: show.id,
                measures: updatedMeasures
            }));
            
            hideModal('editMeasuresModal');
            // Snackbar removed
        });
        
        // Condensed toggle
        document.getElementById('condensedToggle').addEventListener('click', function() {
            this.classList.toggle('active');
            condensedView = this.classList.contains('active');
            // Snackbar removed
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
        
        // Audio context for sound generation
        let audioContext = null;
        
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
        
        // Play a click sound using Web Audio API (same as metronome)
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
                        startMetronome();
                    }).catch(e => {
                        console.error('Failed to resume audio context:', e);
                    });
                } else {
                    startMetronome();
                }
            }
        });
        
        // Start continuous metronome at 120 BPM
        function startMetronome() {
            // Get the selected show
            const show = shows.find(s => s.id === selectedShow);
            if (!show || !show.measures || show.measures.length === 0) {
                console.log('No show or measures found');
                return;
            }
            
            let currentMeasureIndex = 0;
            let currentBeat = 0;
            let metronomeInterval = null;
            
            // Function to calculate interval based on tempo
            function getIntervalForTempo(tempo) {
                return 60000 / tempo; // Convert BPM to milliseconds per beat
            }
            
            // Function to update tempo bar for current measure
            function updateTempoBarForMeasure(measureIndex) {
                if (measureIndex >= show.measures.length) {
                    // End of show
                    stopMetronome();
                    return;
                }
                
                const measure = show.measures[measureIndex];
                const numerator = measure.timeSignature.numerator;
                
                // Update tempo bar to match the measure's numerator
                updateTempoBarSegments(numerator);
                console.log('Updated tempo bar for measure', measureIndex + 1, 'with', numerator, 'beats');
            }
            
            // Function to start metronome with current measure's tempo
            function startMetronomeWithTempo() {
                if (metronomeInterval) {
                    clearInterval(metronomeInterval);
                }
                
                const currentMeasure = show.measures[currentMeasureIndex];
                const tempo = currentMeasure.tempo;
                const interval = getIntervalForTempo(tempo);
                
                console.log('Starting metronome for measure', currentMeasureIndex + 1, 'at', tempo, 'BPM (interval:', interval, 'ms)');
                
                // Play first beat immediately
                playClick(true);
                updateTempoBar(0, currentMeasureIndex, currentMeasure.timeSignature.numerator);
                
                // Set up interval for continuous playback
                metronomeInterval = setInterval(() => {
                    if (isPlaying) {
                        // Check if this is beat 1 of the measure
                        const isDownbeat = (currentBeat === 0);
                        playClick(isDownbeat);
                        
                        const currentMeasure = show.measures[currentMeasureIndex];
                        const numerator = currentMeasure.timeSignature.numerator;
                        
                        // Check if this is the very last beat of the show
                        const isLastBeatOfShow = (currentMeasureIndex >= show.measures.length - 1 && currentBeat === numerator - 1);
                        
                        currentBeat++;
                        
                        if (currentBeat >= numerator) {
                            // Move to next measure
                            currentMeasureIndex++;
                            currentBeat = 0;
                            
                            if (currentMeasureIndex >= show.measures.length) {
                                // End of show - wait for the last beat to complete
                                setTimeout(() => {
                                    stopMetronome();
                                }, interval);
                                return;
                            }
                            
                            // Start new metronome with new measure's tempo
                            startMetronomeWithTempo();
                            return;
                        }
                        
                        // Update tempo bar for new measure on the first beat of the new measure
                        if (currentBeat === 1 && currentMeasureIndex > 0) {
                            updateTempoBarForMeasure(currentMeasureIndex);
                        }
                        
                        // Update tempo bar to show the beat that just played
                        // Handle the case where we're moving to the next measure
                        if (currentBeat === 0) {
                            // We just moved to a new measure, show the last beat of the previous measure
                            const previousMeasure = show.measures[currentMeasureIndex - 1];
                            const previousNumerator = previousMeasure.timeSignature.numerator;
                            updateTempoBar(previousNumerator - 1, currentMeasureIndex - 1, previousNumerator);
                        } else if (isLastBeatOfShow) {
                            // This is the very last beat of the show
                            const lastMeasure = show.measures[currentMeasureIndex];
                            const lastNumerator = lastMeasure.timeSignature.numerator;
                            updateTempoBar(lastNumerator - 1, currentMeasureIndex, lastNumerator);
                        } else {
                            updateTempoBar(currentBeat - 1, currentMeasureIndex, currentMeasure.timeSignature.numerator);
                        }
                    } else {
                        // Stop if playing state changed
                        stopMetronome();
                    }
                }, interval);
            }
            
            // Initialize metronome with first measure's tempo
            currentBeat = 1; // Start at beat 2 (index 1)
            updateTempoBarForMeasure(currentMeasureIndex);
            startMetronomeWithTempo();
        }
        
        // Stop metronome
        function stopMetronome() {
            if (metronomeInterval) {
                clearInterval(metronomeInterval);
                metronomeInterval = null;
            }
            clearTempoBar();
            
            // Reset button state to play
            isPlaying = false;
            document.getElementById('playButton').classList.remove('playing');
            document.getElementById('iconContainer').classList.remove('playing');
            
            // Reset position for next play
            currentMeasureIndex = 0;
            currentBeat = 1;
        }
        
        // Update tempo bar to highlight current beat
        function updateTempoBar(beatIndex, measureIndex, numerator) {
            const segments = document.querySelectorAll('.tempo-segment');
            segments.forEach((segment, index) => {
                if (index === beatIndex) {
                    segment.classList.add('active');
                } else {
                    segment.classList.remove('active');
                }
            });
            
            // Log tempo bar update to React Native
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'TEMPO_BAR_LOG',
                    beatIndex: beatIndex,
                    totalSegments: segments.length,
                    measureIndex: measureIndex,
                    numerator: numerator,
                    message: 'Measure ' + (measureIndex + 1) + ', Beat ' + (beatIndex + 1) + ' of ' + numerator + ', Segment ' + (beatIndex + 1) + ' of ' + segments.length
                }));
            }
        }
        
        // Update tempo bar to have the correct number of segments
        function updateTempoBarSegments(numerator) {
            const tempoBar = document.getElementById('tempoBar');
            tempoBar.innerHTML = '';
            
            // Create segments based on the numerator
            for (let i = 0; i < numerator; i++) {
                const segment = document.createElement('div');
                segment.className = 'tempo-segment';
                tempoBar.appendChild(segment);
            }
        }
        
        // Clear tempo bar highlighting
        function clearTempoBar() {
            const segments = document.querySelectorAll('.tempo-segment');
            segments.forEach(segment => {
                segment.classList.remove('active');
            });
        }
        
        // Initialize
        renderShows();
        
        // Expose functions to React Native
        window.updateShowsData = updateShowsData;
        

        
        console.log('WebView Show UI initialized');
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
            } else if (message.type === 'LOG') {
              console.log('WebView Log:', message.message);
            } else if (message.type === 'TEMPO_BAR_LOG') {
              console.log(`[Tempo Bar] ${message.message}`);
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
    backgroundColor: AppTheme.colors.background,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewShow; 