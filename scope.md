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
2. Refine UI (make the play button larger, move the play button/tempo bar to the bottom on show mode)
2. Add accessibility features (large touch targets, haptics, etc.).
3. Add error handling and edge case management (e.g., invalid time signatures, empty shows).
4. Optimize for performance and battery usage.

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
3. Provide React hook `usePitch()` for components.

## **Step 8:  Build Tuner Screen UI**
1. ✅ New file `app/(tabs)/tuner.tsx`: *(Complete)*
   - Large central note label (e.g., "A♯4").
   - Horizontal/arc needle ±50 cents; color-coded (in-tune = blue, sharp/flat = orange).
2. ✅ Animate needle with Reanimated/Animated *(Complete)*
3. ✅ Start/stop recording on screen focus to save battery *(Complete)*
4. Settings gear:
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
1.  **Ensure `react-native-sound` is Fully Linked (Prerequisite Check):**
    *   Run `cd ios && pod install && cd ..` in the terminal to ensure native dependencies are installed.
2.  **Modify `app/(tabs)/metronome.tsx`:**
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
1.  **Modify `app/(tabs)/show.tsx`:**
    *   Repeat modifications from Step 11 for `app/(tabs)/show.tsx` (remove `expo-audio` import, add `react-native-sound` import, declare refs, add sound loading/release `useEffect`, create `playSoundFromPool`, update playback logic to use `playSoundFromPool`).
2.  **Create a Reusable Sound Hook (`hooks/useMetronomeSounds.ts`) (Recommended):**
    *   Create `hooks/useMetronomeSounds.ts`.
    *   Move the `Sound` import, all sound-related `useRef` declarations, the sound loading/release `useEffect`, and the `playSoundFromPool` function into this new hook.
    *   The hook should return functions like `playHiClick` and `playLoClick`.
    *   Replace duplicated sound logic in `metronome.tsx` and `show.tsx` with calls to this single hook.

---

# **Potential future ideas**
1. Subdivisions per beat
2. Accent patterns (e.g. for 7/8: O-o-O-o-O-o-o). Add in presets but also allow the user to create their own.
3. ✅ Tap tempo: Add a button which lets the user set the tempo by tapping on the button consistently.
4. Practice modes: the tempo gradually increases/decreases over time.
5. Customizable sounds: offer a variety of different presets for sounds like woodblock, cowbell, electronic clicks etc.
6. Recording/playback? For practice, allow the user to record themself playing with the met then be able to listen back and check their timing.
7. Timer/practice session log
8. Polyrhythm support? maybe with visuals too
9. Different themes for customizability
- Make it so you can choose in settings if you want the UI to match your device's theme, or be in dark or light mode all the time.
10. Add a stats page where you can see how much you've played each show, how long you've had the app open, etc.
11. Reference tone playback (play A440 or selected reference pitch for ear-training)
12. Transposition / notation filter (display notes as Bb/Eb instrument view)
13. Live waveform or spectrum visualiser for tuner screen
14. ✅ Make it so if you tap on the slider bar in the met mode, it'll go there (so you don't have necessarily have to slide)
15. Expanding modal animation for popups: Implement a reusable modal component (using Reanimated 2) that animates by expanding from the tapped element's position and size to its final modal size/position, with the overlay and modal content fading in together. The animation should be smooth and visually connected to the origin element. This should apply to all modal popups in the app, including: BPM input modal, numerator/denominator input modals, "coming soon" modals for subdivision and sound buttons, and any future modal-based UI. The modal should animate back to the origin element when dismissed. Capture the origin element's layout (position/size) to drive the animation. Overlay should fade in/out in sync with the modal expansion/contraction.
16. Add a swipe gesture where you can swipe left or right to the next/previous tab, with an animation.
17. Music scanning feature: Allow users to scan their sheet music using the device camera, and the app automatically translates the time signatures, tempo markings, and measure structure into a show. This would use OCR (Optical Character Recognition) to detect musical notation and convert it into the app's show format.

---

**NOTES TO SELF (ignore this section if you are an AI model reading this to build this project)**
## For submitting new versions to App Store:
First increment version number and ios.buildNumber in app.json. THEN go into ios/MetMaestro/Info.plist and change the version and Bundle Version (VERY IMPORTANT!!! It will not work if you don't do both). THEN go into eas.json and make sure that build.development.simulator is false or does not exist. Then do `eas build -p ios --profile production` then `eas submit -p ios --latest`
## For building to a local simulator:
Before you make a build, go into eas.json and make sure that build.development.simulator is has `"simulator": true`. then make a local build using `eas build -p ios --profile development --local` (--local is important). Then extract the build-XXXXXX.tar.gz file. Then, run `xcrun simctl install booted MetMaestro.app` if a simulator is open, or run `xcrun simctl list devices` to view the UUID of all installed sims then `xcrun simctl install [UUID] build-simulator/MetMaestro.app`. It should then be installed on the specified sim. Finally, run `npx expo start` to start the dev server.

---

**Ready to proceed with any phase or component—just let me know!** 