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

# Step-by-Step Build Plan

## **Phase 1: Project Foundation & Core Utilities**
1. ✅ Initialize Expo project and set up version control.
2. ✅ Install dependencies (`expo-audio`, UI library, etc.).
3. ✅ Integrate and test the timer utility from timer.js.
4. ✅ Set up a basic dark mode theme and global styles.

## **Phase 2: Met Mode Core Functionality**
1. ✅ Build the MetModeScreen layout and implement state management for time signature, tempo, and play state:
   - Implement the time signature selector with chevrons and visual bar.
   - Add the tempo slider and numeric display (with draggable thumb).
   - Add the play/stop button.
   - Add the tempo bar component.
   - Use React state to manage time signature, tempo, and play state.
2. Connect the timer utility to drive beat timing.
3. Integrate expo-audio to play click sounds on each beat (with downbeat accent).
4. Animate the tempo bar in sync with the beats.
5. Test for timing accuracy and UI responsiveness.

## **Phase 3: Show Mode Core Functionality**
1. Build the ShowModeScreen layout:
   - Add show list (load, rename, delete shows).
   - Add show editor with measure list and drag-and-drop reordering.
   - Add the "Add Measure" popup with fields for number of measures, time signature (chevrons), and tempo.
   - Add remove measure functionality.
2. Implement show data structure and local persistence (AsyncStorage).
3. Implement logic to add multiple measures at once with the same settings.
4. Implement playback logic:
   - 4-beat count-in (audio and visual).
   - Play through all measures, updating timer and tempo bar as needed.
   - Handle time signature and tempo changes between measures.
5. Integrate expo-audio for all playback.
6. Test for timing accuracy, measure transitions, and UI responsiveness.

## **Phase 4: Polish & UX Enhancements**
1. Refine dark mode UI for modern, minimalist look.
2. Add accessibility features (large touch targets, haptics, etc.).
3. Add error handling and edge case management (e.g., invalid time signatures, empty shows).
4. Optimize for performance and battery usage.

## **Phase 5: Testing & Optional Features**
1. Write unit tests for timer and show logic.
2. Conduct manual testing on multiple devices.
3. (Optional) Implement advanced features (subdivisions, accent patterns, export/import, etc.).

---

**Ready to proceed with any phase or component—just let me know!** 