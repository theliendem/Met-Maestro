# Met Maestro App Plan

## 1. Project Setup
- **Initialize Expo Project**:  
  - `npx create-expo-app met-maestro` ✅ *(Complete)*
- **Install Dependencies**:  
  - `npx expo install expo-audio` ✅ *(Complete)*
  - UI library for dark mode (e.g., `react-native-paper`) ✅ *(Complete)*
- **Add Timer Logic**:  
  - Integrate [timer.js](https://raw.githubusercontent.com/musicandcode/Metronome/refs/heads/main/timer.js) as a utility. ✅ *(Complete & tested for accuracy)*
- **Set up Dark Mode Theme and Global Styles**: ✅ *(Complete)*

---

## 2. App Structure

### Navigation
- Use a tab or segmented control to switch between Met Mode and Show Mode.

### Screens/Components
- **MetModeScreen**
- **ShowModeScreen**
- **TempoBar** (shared)
- **ShowEditor** (for creating/editing shows)
- **ShowList** (for loading/saving shows)
- **Timer Utility** (from timer.js)

---

## 3. Met Mode

### UI Elements
- **Time Signature Selector**:  
  - **Visual Layout**:  
    - Numerator:  
      - Left chevron | Numerator value | Right chevron  
    - Horizontal bar (visual separator, like a fraction line)  
    - Denominator:  
      - Left chevron | Denominator value | Right chevron  
  - **Interaction**:  
    - Tapping chevrons increments/decrements numerator or denominator.
    - Only valid musical values allowed (e.g., denominators: 2, 4, 8, 16).
- **Tempo Slider**:  
  - Range (e.g., 40–240 BPM), with numeric display.
- **Tempo Bar**:  
  - Visually split into as many segments as the numerator.
  - Highlights the current beat.
- **Play/Stop Button**:  
  - Large, central, with clear state indication.

### Logic
- **Timer**:  
  - Use Timer utility for drift-corrected intervals.
  - Calculate interval as `60000 / (BPM * (denominator/4))`.
- **Audio**:  
  - Use `expo-audio` to play a click on each beat.
  - Optionally, a different sound for the downbeat.
- **Tempo Bar Update**:  
  - On each beat, update the highlighted segment.

---

## 4. Show Mode

### UI Elements
- **Show List**:  
  - List of saved shows (load, rename, delete).
- **Show Editor**:  
  - **Add Measure Popup**:  
    - Fields:
      - Number of measures to add (e.g., 1–32)
      - Time signature (using the same chevron-based selector as Met Mode)
      - Tempo (BPM)
    - User can quickly add, for example, 4 measures of 6/8 at 140 BPM.
  - List of measures in the show (with time signature and tempo for each).
  - Reorder measures (drag-and-drop).
  - Remove individual measures.
- **Tempo Bar**:  
  - Updates according to the current measure.
- **Play/Stop Button**:  
  - Starts playback of the show.
- **Count-in Indicator**:  
  - Visual and audio indication of the 4-beat count-in before playback.

### Logic
- **Show Data Structure**:  
  - Array of measures, each with:
    - `timeSignature` (e.g., { numerator: 6, denominator: 8 })
    - `tempo` (BPM)
    - (Optional: label, notes)
- **Adding Measures**:  
  - When adding, create N consecutive measures with the same settings.
- **Playback**:
  - 4-beat count-in (using first measure's settings).
  - For each measure:
    - Set timer interval and tempo bar.
    - Play correct number of beats (numerator).
    - On measure change, update timer and tempo bar.
    - **Important**:  
      - 6/4 = 6 quarter notes per measure  
      - 6/8 = 6 eighth notes per measure (interval is half as fast as 6/4 at same BPM)
- **Audio**:
  - Use `expo-audio` for all clicks.
  - Optionally, custom sounds for downbeats or accents.
- **Persistence**:
  - Use local storage (e.g., `AsyncStorage`) to save/load shows.

---

## 5. Timing Logic

- **Timer Utility**:  
  - Use timer.js for all beat intervals.
  - On each tick, trigger audio and UI updates.
  - On measure change, stop and restart timer with new interval.

- **Interval Calculation**:
  - For a time signature of X/Y at N BPM:
    - **Beat duration** = `60000 / (BPM * (4/Y))` ms

---

## 6. UI/UX Design

- **Dark Mode**:  
  - Dark background, high-contrast text, minimalist controls.
  - Accent colors for active beats, downbeats, and tempo bar highlights.
- **Responsiveness**:  
  - UI scales well on different device sizes.
- **Accessibility**:  
  - Large touch targets, clear labels, optional haptic feedback.

---

## 7. Advanced Features (Optional/Future)

- Subdivision support (e.g., 16th notes, triplets)
- Accent patterns (customize which beats are accented)
- Export/Import shows
- Cloud sync
- Vibration/haptic feedback
- Visual themes

---

## 8. Testing

- Unit tests for timer logic and show data handling.
- Manual testing for timing accuracy and UI responsiveness.

---

## 9. References

- [expo-audio documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Accurate Timer Logic (timer.js)](https://raw.githubusercontent.com/musicandcode/Metronome/refs/heads/main/timer.js)

---

# **Phase 1**

## **Step 1: Project Foundation & Core Utilities**
1. ✅ Initialize Expo project and set up version control.
2. ✅ Install dependencies (`expo-audio`, UI library, etc.).
3. ✅ Integrate and test the timer utility from timer.js.
4. ✅ Set up a basic dark mode theme and global styles.

## **Step 2: Met Mode Core Functionality**
1. ✅ Build the MetModeScreen layout and implement state management for time signature, tempo, and play state:
   - ✅ Implement the time signature selector with chevrons and visual bar.
   - ✅ Add the tempo slider and numeric display (with draggable thumb).
   - ✅ Add the play/stop button.
   - ✅ Add the tempo bar component.
   - ✅ Use React state to manage time signature, tempo, and play state.
2. ✅ Connect the timer utility to drive beat timing.
3. ✅ Integrate expo-audio to play click sounds on each beat (with downbeat accent).
4. ✅ Animate the tempo bar in sync with the beats.
5. ⚠️ Potentially change from expo-audio to react-native-audio-playback so sounds can overlap and not get cut off. (Watch [this youtube video](https://www.youtube.com/watch?v=3PM9wjtqnzQ))

## **Step 3: Show Mode Core Functionality**
1. ✅ Build the ShowModeScreen UI, implement local state logic for adding/deleting measures, creating/renaming/deleting shows, switching between shows, and persistence using AsyncStorage, and implement logic to add multiple measures at once.
2. ✅ Add the ability to be able to edit measures (in compact mode) and import/export shows as files.
3. ✅ Implement playback logic:
   - ✅ 4-beat count-in (audio and visual). Make sure there's a banner that says "Count-in" when it starts.
   - ✅ Play through all measures, updating timer and tempo bar as needed.
   - ✅ Handle time signature and tempo changes between measures.
4. ✅ Capture the value of all variables when the app is started and store it in a json/array, then when a show is done playing, reset to those values using that json/array to see if that fixes the second-time playback issue.

## **Step 4: Polish & UX Enhancements**
1. ✅ Refine dark mode UI for modern, minimalist look. (And consistent UI e.g. same colored buttons, background, section backgrounds etc.)
2. ✅ Refine UI (make the play button larger, move the play button/tempo bar to the bottom on show mode)
3. Add accessibility features (large touch targets, haptics, etc.).
4. Add error handling and edge case management (e.g., invalid time signatures, empty shows).
5. Optimize for performance and battery usage.

# **Phase 2: Real-Time Instrument Tuner (iOS / Android)**

Latency target ≤ 150 ms; no `expo-av` dependency.

## **Step 5:  Research & Select Dependencies**
1. ✅ **Chosen:** `react-native-live-audio-stream` for real-time PCM audio (lowest latency, built for streaming, ideal for tuner use case).
   - Not using `react-native-audio-record` (slightly higher latency, more for file recording).
   - Not using `expo-av` (deprecated) or `react-native-webrtc` (overkill for audio-only, larger bundle).
2. ✅ **Chosen:** YIN algorithm from `pitchfinder` for pitch detection (most accurate, robust to noise, standard for instrument tuners).
   - Not using AMDF, Autocorrelation, or FFT (lower accuracy, more octave errors, less robust).
3. ✅ Document the choice & reasoning in README.

## **Step 6:  Install & Configure Audio Capture**
1. ✅ `npm install react-native-live-audio-stream pitchfinder`
2. ✅ Request mic permission on first tuner use (iOS & Android) – show fallback UI on denial.
3. ✅ Configure recorder: 16 kHz, mono, 16-bit PCM, buffer ≈ 2048 samples (~128 ms).
4. ✅ Stream PCM chunks to JS *(Complete)*

## **Step 7:  Implement Pitch-Detection Worker**
1. ✅ Create `utils/pitchDetector.ts` that wraps YIN *(Complete)*
2. ✅ Smooth output with moving average; convert frequency → `{note, octave, cents}` *(Complete)*
3. ✅ Provide React hook `usePitch()` for components.

## **Step 8:  Build Tuner Screen UI**
1. ✅ New file `app/(tabs)/tuner.tsx`: *(Complete)*
   - Large central note label (e.g., "A♯4").
   - Horizontal/arc needle ±50 cents; color-coded (in-tune = blue, sharp/flat = orange).
2. ✅ Animate needle with Reanimated/Animated *(Complete)*
3. ✅ Start/stop recording on screen focus to save battery *(Complete)*
4. ✅ Settings gear:
   - Reference pitch slider (415–466 Hz, default 440).
   - Toggle "Show cents" indicator.

# **Phase 3: Fix UI theme and improve UI usability**

## **Step 9:  Unify UI theme across all tabs**
1. ✅ Make every file use the same external `AppTheme.tsx` file for scalability/global changes.
2. ✅ Make a global darkmode theme (background color and accent color)

## **Step 10:  Fix UI for Met Mode**
1. ✅ Restructure met mode to find a general layout that I like.
2. ✅ Add in three buttons on the corners (tap bpm, subdivision, sound)
3. ✅ Implement tap bpm functionality (see potential ideas #3)

# **Phase 4: Migrate Metronome Audio to `react-native-sound`**

**Goal:** Replace `expo-audio` with `react-native-sound` in `app/(tabs)/metronome.tsx` and `app/(tabs)/show.tsx` to ensure reliable overlapping clicks.

## **Step 11: Setup and Basic Replacement (`app/(tabs)/metronome.tsx` First)**
1.  ✅ **Ensure `react-native-sound` is Fully Linked (Prerequisite Check):**
    *   Run `cd ios && pod install && cd ..` in the terminal to ensure native dependencies are installed.
2.  ✅ **Modify `app/(tabs)/metronome.tsx`:**
    *   Remove `expo-audio` import: `import { useAudioPlayer } from 'expo-audio';`
    *   Add `react-native-sound` import: `import Sound from 'react-native-sound';`
    *   Inside `MetronomeScreen` component, declare `useRef` for Sound Pools and Indexes:
        ```typescript
        const hiSounds = useRef<Sound[]>([]);
        const loSounds = useRef<Sound[]>([]);
        const currentHiSoundIdx = useRef(0);
        const currentLoSoundIdx = useRef(0);
        const SOUND_POOL_SIZE = 3; // Number of overlapping sound instances (can be adjusted)
        ```
    *   Implement Sound Loading and Release with `useEffect` (runs once on mount):
        ```typescript
        useEffect(() => {
          Sound.setCategory('Playback');
          const loadSoundPool = (
            soundPath: any, 
            soundArrayRef: React.MutableRefObject<Sound[]>
          ) => {
            for (let i = 0; i < SOUND_POOL_SIZE; i++) {
              const sound = new Sound(soundPath, (error) => {
                if (error) {
                  console.error(`Failed to load sound ${soundPath}:`, error);
                  return;
                }
                soundArrayRef.current.push(sound);
              });
            }
          };
          loadSoundPool(require('@/assets/sounds/click_hi.wav'), hiSounds);
          loadSoundPool(require('@/assets/sounds/click_lo.wav'), loSounds);
          return () => {
            hiSounds.current.forEach(s => { if (s.isLoaded()) s.release(); });
            loSounds.current.forEach(s => { if (s.isLoaded()) s.release(); });
            hiSounds.current = [];
            loSounds.current = [];
          };
        }, []);
        ```
    *   Create a `playSoundFromPool` Helper Function (using `useCallback`):
        ```typescript
        const playSoundFromPool = useCallback((
          soundArrayRef: React.MutableRefObject<Sound[]>, 
          currentIndexRef: React.MutableRefObject<number>
        ) => {
          if (soundArrayRef.current.length > 0) {
            const sound = soundArrayRef.current[currentIndexRef.current];
            if (sound.isLoaded()) {
              sound.stop(() => {
                sound.play((success) => {
                  if (!success) { console.error('Sound playback failed.'); }
                });
              });
              currentIndexRef.current = (currentIndexRef.current + 1) % SOUND_POOL_SIZE;
            } else { console.warn('Attempted to play unloaded sound. Ensure sounds are fully loaded.'); }
          } else { console.warn('Sound pool is empty. Sounds may not have loaded yet.'); }
        }, []);
        ```
    *   Update the Metronome's Main `useEffect` for Playback:
        *   Remove `hiPlayer` and `loPlayer` from dependencies.
        *   Replace `hiPlayer.seekTo(0); setTimeout(() => hiPlayer.play(), 1);` with `playSoundFromPool(hiSounds, currentHiSoundIdx);`
        *   Replace `loPlayer.seekTo(0); setTimeout(() => loPlayer.play(), 1);` with `playSoundFromPool(loSounds, currentLoSoundIdx);`

## **Step 12: Apply to `app/(tabs)/show.tsx` and Refinements**
1.  ✅ **Modify `app/(tabs)/show.tsx`:**
    *   Repeat modifications from Step 11 for `app/(tabs)/show.tsx` (remove `expo-audio` import, add `react-native-sound` import, declare refs, add sound loading/release `useEffect`, create `playSoundFromPool`, update playback logic to use `playSoundFromPool`).
2.  ✅ **Create a Reusable Sound Hook (`hooks/useMetronomeSounds.ts`) (Recommended):**
    *   Create `hooks/useMetronomeSounds.ts`.
    *   Move the `Sound` import, all sound-related `useRef` declarations, the sound loading/release `useEffect`, and the `playSoundFromPool` function into this new hook.
    *   The hook should return functions like `playHiClick` and `playLoClick`.
    *   Replace duplicated sound logic in `metronome.tsx` and `show.tsx` with calls to this single hook.

---

# **Phase 5: Migrate Metronome to WebView with expo-audio**

**Goal:** Replace React Native metronome components with WebView-based implementation using `expo-audio` with `new AudioContext()` for precise audio timing.

## **Step 13: Install and Configure Dependencies**
1. ✅ **Install expo-audio:**
   - Run `npx expo install expo-audio`
   - Add `expo-audio` to plugins in `app.json`
2. ✅ **Update app.json configuration:**
   - Ensure expo-audio permissions are configured

## **Step 14: Create WebView Metronome Component**
1. ✅ **Create `components/WebViewMetronome.tsx`:**
   - Build WebView container with HTML/CSS/JS metronome
   - Implement `new AudioContext()` for precise audio timing
   - Add beat generation with different frequencies for downbeat/offbeat
   - Include tempo bar visualization with beat highlighting
   - Add time signature controls with chevron navigation
   - Implement play/stop button with state management
   - Add message passing between WebView and React Native
2. ✅ **Create `hooks/useAudioPermission.ts`:**
   - Implement audio permission request using `expo-audio`
   - Add permission status management
   - Include error handling for permission denial

## **Step 15: Update Metronome Screen**
1. ✅ **Modify `app/(tabs)/metronome.tsx`:**
   - Replace existing metronome logic with WebView component
   - Integrate `useAudioPermission` hook
   - Maintain existing UI elements (tap BPM, time signature selector, tempo slider)
   - Add WebView container styling
   - Implement message handling for beat changes and play state
   - Preserve existing modal components and tap BPM functionality

## **Step 16: Create WebView Show Component**
1. **Create `components/WebViewShow.tsx`:**
   - Build WebView container for show mode functionality
   - Implement count-in sequence (4 beats before show starts)
   - Add measure-by-measure playback with tempo/time signature changes
   - Include beat visualization and measure progress tracking
   - Add show completion detection and callback
   - Implement message passing for beat/measure/state changes

## **Step 17: Update Show Mode Screen**
1. **Modify `app/(tabs)/show.tsx`:**
   - Replace existing show playback logic with WebView component
   - Integrate `useAudioPermission` hook
   - Maintain existing show management UI (add/edit/delete measures)
   - Add WebView container styling
   - Implement message handling for beat/measure changes and completion
   - Preserve existing show persistence and import/export functionality

## **Step 18: Testing and Validation**
1. **Test Audio Permissions:**
   - Verify microphone permissions work correctly on iOS/Android
   - Test audio playback in different device states (silent mode, etc.)
2. **Test Timing Accuracy:**
   - Compare WebView timing with existing timer.js implementation
   - Verify beat intervals are mathematically correct
   - Test tempo changes and time signature changes
3. **Test Show Mode:**
   - Verify count-in sequence works correctly
   - Test measure transitions with different tempos/time signatures
   - Ensure show completion and state restoration works
4. **Test UI Integration:**
   - Verify WebView components integrate seamlessly with existing UI
   - Test responsive design across different screen sizes
   - Ensure accessibility features are maintained

## **Step 19: Performance Optimization**
1. **Optimize WebView Performance:**
   - Minimize HTML/CSS/JS bundle size
   - Optimize audio context initialization
   - Implement efficient message passing
2. **Battery Life Considerations:**
   - Stop audio context when not in use
   - Implement proper cleanup on component unmount
   - Monitor memory usage and prevent leaks

## **Step 20: Documentation and Cleanup**
1. **Update Documentation:**
   - Document WebView architecture in README
   - Add comments explaining audio context usage
   - Document message passing protocol
2. **Remove Legacy Code:**
   - Remove old timer.js usage from metronome components
   - Clean up unused audio session utilities
   - Remove react-native-sound dependencies if no longer needed

---

**Expected Benefits:**
- More precise audio timing using Web Audio API
- Better audio overlap handling with AudioContext
- Consistent cross-platform audio behavior
- Reduced native dependency complexity
- Improved audio latency and reliability

**Potential Challenges:**
- WebView initialization overhead
- Audio context permission handling
- Message passing complexity
- Memory management for long-running shows
- Cross-platform WebView differences

---

# **Potential future ideas**
1. ✅ Subdivisions per beat
2. Accent patterns (e.g. for 7/8: O-o-O-o-O-o-o). Add in presets but also allow the user to create their own.
3. ✅ Tap tempo: Add a button which lets the user set the tempo by tapping on the button consistently.
4. Practice modes: the tempo gradually increases/decreases over time.
5. ✅ Customizable sounds: offer a variety of different presets for sounds like woodblock, cowbell, electronic clicks etc.
6. Recording/playback? For practice, allow the user to record themself playing with the met then be able to listen back and check their timing.
7. Timer/practice session log
8. Polyrhythm support? maybe with visuals too
9. ✅ Different themes for customizability
- Make it so you can choose in settings if you want the UI to match your device's theme, or be in dark or light mode all the time.
10. Add a stats page where you can see how much you've played each show, how long you've had the app open, etc.
11. Live waveform or spectrum visualiser for tuner screen
12. ✅ Make it so if you tap on the slider bar in the met mode, it'll go there (so you don't have necessarily have to slide)
13. Add a swipe gesture where you can swipe left or right to the next/previous tab, with an animation.
14. Music scanning feature: Allow users to scan their sheet music using the device camera, and the app automatically translates the time signatures, tempo markings, and measure structure into a show. This would use OCR (Optical Character Recognition) to detect musical notation and convert it into the app's show format.
15. Add a "piano" section to tuner to allow for tuning to a note.

---

# **NOTES TO SELF**
## For submitting new versions to App Store:
First increment version number and ios.buildNumber in app.json. THEN go into ios/MetMaestro/Info.plist and change the version and Bundle Version (VERY IMPORTANT!!! It will not work if you don't do both). Then do `eas build -p ios --profile production` then `eas submit -p ios --latest`
## For building to a local simulator:
Before you make a build, go into eas.json and make sure that build.development.simulator is has `"simulator": true`. then make a local build using `eas build -p ios --profile development --local` (--local is important). Then extract the build-XXXXXX.tar.gz file. Then, run `xcrun simctl install booted MetMaestro.app` if a simulator is open, or run `xcrun simctl list devices` to view the UUID of all installed sims then `xcrun simctl install [UUID] build-simulator/MetMaestro.app`. It should then be installed on the specified sim. Finally, run `npx expo start` to start the dev server.

---

**Ready to proceed with any phase or component—just let me know!**

## **FIXED: Archive Missing Bundle Identifier Error (2025-01-13)**

**Problem:** Production builds were failing with "Archive Missing Bundle Identifier" error due to version mismatches between configuration files.

**Root Cause:** 
- `app.json` specified version `3.0.0` and build number `7`
- Xcode project was still using `MARKETING_VERSION = 1.0` and `CURRENT_PROJECT_VERSION = 1`
- Android `versionCode` was `1` while iOS build number was `7`
- EAS production build configuration was missing explicit iOS settings

**Fixes Applied:**

1. **Updated iOS Xcode Project (`ios/MetMaestro.xcodeproj/project.pbxproj`):**
   - Changed `MARKETING_VERSION` from `1.0` to `3.0.0` for both Debug and Release configurations
   - Changed `CURRENT_PROJECT_VERSION` from `1` to `7` for Release configuration

2. **Updated Android Build Configuration (`android/app/build.gradle`):**
   - Changed `versionCode` from `1` to `7` to match iOS build number

3. **Enhanced EAS Build Configuration (`eas.json`):**
   - Added explicit iOS build configuration for production:
   ```json
   "production": {
     "autoIncrement": true,
     "ios": {
       "buildConfiguration": "Release"
     }
   }
   ```

4. **Cleaned and Rebuilt Dependencies:**
   - Removed old build artifacts, Pods, and Podfile.lock
   - Ran `npx expo install --fix` to ensure dependency compatibility
   - Reinstalled pods with `pod install`

**Result:** Bundle identifier is now properly recognized during production builds, resolving the archive error. 

---

# **Phase 6: WebView Metronome UI Improvements (2025-01-13)**

**Goal:** Transform the metronome into a fully self-contained WebView with modern UI, subdivision support, and enhanced user experience.

## **Step 21: Complete WebView Metronome Redesign**

### **21.1 Core Architecture Changes**
1. **Self-contained WebView**: 
   - Moved all UI and logic into WebView HTML/CSS/JS
   - Eliminated React Native ↔ WebView communication issues
   - Single source of truth for all metronome state

2. **Theme Integration**:
   - Added `themeColors` prop to pass AppTheme colors to WebView
   - Created CSS variables for all theme colors (`--background`, `--surface`, `--primary`, `--text`, `--icon`, `--accent`, `--orange`)
   - Replaced all hardcoded colors with theme variables

### **21.2 UI/UX Improvements**

#### **Touch and Interaction**
- **Disabled zooming**: Added `maximum-scale=1.0, user-scalable=no` to viewport meta tag
- **Prevented scrolling**: Added `overflow: hidden` and `position: fixed` to body
- **Removed touch highlights**: Added `-webkit-tap-highlight-color: transparent`
- **Prevented text selection**: Added `user-select: none` and related properties
- **Removed keyboard accessory view**: Changed from `type="number"` to `type="text"` with `inputmode="numeric"` and `pattern="[0-9]*"`

#### **Button Design**
- **Larger buttons**: Increased from 60x60px to 80x80px
- **External labels**: Moved labels outside circular buttons with proper positioning
- **SVG icons**: Replaced emoji icons with proper SVG icons for tap BPM (checkmark) and subdivision (music note)
- **Better typography**: Increased label font size to 12px and used darker color (`var(--icon)`)

#### **Slider Improvements**
- **Dark gray track**: Changed slider background to `#2a2a2a` for better contrast
- **Padding**: Added `padding: 0 10px` to prevent thumb from touching edges
- **Theme colors**: Slider thumb uses `var(--accent)` color

#### **Play Button**
- **CSS icons**: Replaced emoji with CSS-based play triangle and stop square
- **Theme colors**: Play button uses `var(--accent)`, stop uses `var(--orange)`
- **Explicit color management**: Added JavaScript to explicitly set colors on state changes

### **21.3 Subdivision Feature**

#### **Modal Design**
- **Musical notation icons**: Used proper musical symbols (♪, ♫, ♫♪, ♫♫, etc.)
- **Horizontal layout**: Icons on left, text on right with flexbox
- **Theme integration**: All colors use theme variables
- **Clean labels**: Removed "x clicks per beat" descriptions

#### **Subdivision Options**
1. **None** (♪) - Single click per beat
2. **Eighth** (♫) - Two clicks per beat
3. **Triplet** (♫♪) - Three clicks per beat
4. **Sixteenth** (♫♫) - Four clicks per beat
5. **Quintuplet** (♫♫♪) - Five clicks per beat
6. **Sixtuplet** (♫♫♫) - Six clicks per beat

#### **Audio Implementation**
- **Beat counter**: Added `beatCount` to track subdivisions within each beat
- **High/low notes**: First subdivision of each beat gets high note, others get low notes
- **Interval calculation**: `calculateInterval()` now divides by subdivision count
- **Auto-restart**: Metronome restarts when subdivision changes

### **21.4 Tap BPM Enhancements**

#### **Auto-disengagement**
- **5-second timeout**: Automatically disengages after 5 seconds of inactivity
- **Reset on tap**: Each tap resets the 5-second timer
- **Manual stop**: Right-click to manually stop anytime
- **Visual feedback**: Button color changes and resets properly

#### **Technical Implementation**
```javascript
let tapBpmTimeout = null;

function startTapBpm() {
    // Set 5-second timeout
    tapBpmTimeout = setTimeout(() => {
        stopTapBpm();
    }, 5000);
}

function tap() {
    // Reset timeout on each tap
    if (tapBpmTimeout) {
        clearTimeout(tapBpmTimeout);
    }
    tapBpmTimeout = setTimeout(() => {
        stopTapBpm();
    }, 5000);
}
```

### **21.5 Code Structure**

#### **React Native Component**
```typescript
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
```

#### **WebView HTML Structure**
- **Complete UI**: All buttons, sliders, modals contained in HTML
- **CSS variables**: Theme colors passed via CSS custom properties
- **JavaScript logic**: All metronome functionality self-contained
- **No external dependencies**: Pure HTML/CSS/JS implementation

## **Step 22: Show Mode WebView Blueprint**

### **22.1 Apply Same Architecture to Show Mode**

#### **Core Changes**
1. **Create `components/WebViewShow.tsx`**:
   - Self-contained WebView with all show logic
   - Theme integration with `themeColors` prop
   - Complete UI for show management and playback

2. **Update `app/(tabs)/show.tsx`**:
   - Replace existing show logic with WebView component
   - Pass theme colors as props
   - Maintain show persistence and import/export functionality

#### **Show Mode Specific Features**

##### **Show Management UI**
- **Show list**: Display saved shows with load/delete options
- **Show editor**: Add/edit/delete measures with time signature and tempo
- **Measure display**: Visual representation of show structure
- **Import/export**: File handling for show data

##### **Playback Features**
- **Count-in**: 4-beat count-in before show starts
- **Measure transitions**: Handle tempo and time signature changes
- **Progress tracking**: Visual indication of current measure
- **Completion detection**: Callback when show finishes

##### **Audio Implementation**
- **Subdivision support**: Apply same subdivision logic as metronome
- **High/low notes**: First beat of each measure gets high note
- **Tempo changes**: Smooth transitions between different tempos
- **Time signature changes**: Handle different beat patterns

#### **UI Components to Port**

##### **Buttons and Controls**
- **Play/stop button**: Same design as metronome with theme colors
- **Tap BPM**: Apply same tap BPM functionality
- **Subdivision**: Apply same subdivision modal and logic
- **Show management buttons**: Load, save, delete, import, export

##### **Modals and Dialogs**
- **Measure editor modal**: Add/edit measure properties
- **Show management modal**: Load/save/delete shows
- **Import/export modal**: File selection and handling
- **Settings modal**: Show-specific settings

##### **Visual Elements**
- **Show progress bar**: Visual indication of playback progress
- **Measure indicators**: Highlight current measure
- **Time signature display**: Show current time signature
- **Tempo display**: Show current tempo with BPM

#### **Technical Implementation**

##### **WebView HTML Structure**
```html
<!-- Show Management -->
<div class="show-list">
  <!-- Saved shows -->
</div>

<!-- Show Editor -->
<div class="show-editor">
  <!-- Measure list -->
  <!-- Add measure button -->
</div>

<!-- Playback Controls -->
<div class="playback-controls">
  <!-- Play button -->
  <!-- Progress bar -->
  <!-- Current measure display -->
</div>

<!-- Modals -->
<div class="modal" id="measureEditorModal">
  <!-- Measure editing form -->
</div>
```

##### **JavaScript Logic**
```javascript
// Show data structure
let currentShow = {
  measures: [
    { timeSignature: { numerator: 4, denominator: 4 }, tempo: 120 },
    // ... more measures
  ]
};

// Playback logic
function startShow() {
  // Count-in sequence
  // Play through measures
  // Handle transitions
}

// Subdivision support
let subdivision = 1;
let beatCount = 0;
```

##### **Theme Integration**
```css
:root {
  --background: ${themeColors.background};
  --surface: ${themeColors.surface};
  --primary: ${themeColors.primary};
  --text: ${themeColors.text};
  --icon: ${themeColors.icon};
  --accent: ${themeColors.accent};
  --orange: ${themeColors.orange};
}
```

### **22.2 Migration Steps**

#### **Phase 1: Core WebView Setup**
1. Create `components/WebViewShow.tsx` with basic structure
2. Add theme integration and CSS variables
3. Implement basic show data structure
4. Add play/stop functionality

#### **Phase 2: Show Management**
1. Add show list display
2. Implement show loading/saving
3. Add measure editor modal
4. Add import/export functionality

#### **Phase 3: Playback Features**
1. Implement count-in sequence
2. Add measure-by-measure playback
3. Handle tempo and time signature changes
4. Add progress tracking

#### **Phase 4: UI Polish**
1. Apply same button designs as metronome
2. Add subdivision support
3. Implement tap BPM functionality
4. Add all modals and dialogs

#### **Phase 5: Integration**
1. Update `app/(tabs)/show.tsx` to use WebView
2. Maintain existing show persistence
3. Test all functionality
4. Ensure theme consistency

### **22.3 Benefits of WebView Approach**

#### **Technical Benefits**
- **Consistent audio timing**: Web Audio API for precise timing
- **No communication issues**: Self-contained logic eliminates sync problems
- **Cross-platform consistency**: Same behavior on iOS and Android
- **Better performance**: Reduced React Native ↔ WebView overhead

#### **User Experience Benefits**
- **Modern UI**: Professional, responsive design
- **Theme integration**: Consistent with app theme
- **Enhanced features**: Subdivision, tap BPM, better modals
- **Improved accessibility**: Better touch targets and feedback

#### **Development Benefits**
- **Easier maintenance**: Single codebase for UI logic
- **Better debugging**: WebView console for development
- **Faster iteration**: HTML/CSS/JS changes without rebuilds
- **Reduced complexity**: No message passing or state synchronization

---

**Expected Timeline:** 2-3 weeks for complete show mode migration
**Priority:** High - will significantly improve user experience and code maintainability 

