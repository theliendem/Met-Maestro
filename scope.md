# Met Maestro App Plan

## 1. Project Setup ✅
- **Initialize Expo Project**: `npx create-expo-app met-maestro` ✅
- **Install Dependencies**: `npx expo install expo-audio`, UI library for dark mode ✅
- **Add Timer Logic**: Integrate timer.js utility ✅
- **Set up Dark Mode Theme and Global Styles**: ✅

---

## 2. App Structure

### Navigation
- Use tab navigation to switch between Met Mode, Show Mode, and Tuner.

### Screens/Components
- **MetModeScreen** - WebView-based metronome
- **ShowModeScreen** - WebView-based show management and playback
- **TunerScreen** - Real-time instrument tuner
- **Shared Components**: TempoBar, Settings, Theme management

---

## 3. Met Mode ✅

### Core Features
- **Time Signature Selector**: Chevron-based navigation for numerator/denominator
- **Tempo Slider**: 40-240 BPM range with numeric display
- **Tempo Bar**: Visual beat highlighting synchronized with audio
- **Play/Stop Button**: Large central control with clear state indication
- **Subdivision Support**: 1-6 clicks per beat with musical notation
- **Tap BPM**: Automatic tempo detection with 5-second timeout

### Implementation
- **WebView Architecture**: Self-contained HTML/CSS/JS with AudioContext
- **Audio**: High/low notes for downbeat/offbeat, subdivision support
- **Theme Integration**: Consistent with app-wide dark mode theme
- **Performance**: Optimized with audio context management and caching

---

## 4. Show Mode ✅

### Core Features
- **Show Management**: Create, load, rename, delete shows
- **Measure Editor**: Add multiple measures with time signature and tempo
- **Playback**: 4-beat count-in, measure-by-measure progression
- **Import/Export**: File-based show sharing
- **Persistence**: AsyncStorage for local show storage

### Implementation
- **WebView Architecture**: Same audio timing and UI consistency as metronome
- **Show Data Structure**: Array of measures with time signature and tempo
- **Playback Logic**: Automatic timer and tempo bar updates between measures
- **State Management**: Comprehensive show editing and playback controls

---

## 5. Tuner Mode ✅

### Core Features
- **Real-time Pitch Detection**: YIN algorithm with 150ms latency target
- **Audio Capture**: 16kHz mono PCM with react-native-live-audio-stream
- **Visual Display**: Large note label with horizontal needle (±50 cents)
- **Settings**: Reference pitch adjustment (415-466 Hz), cents display toggle

### Implementation
- **Audio Processing**: 16-bit PCM streaming with pitch detection worker
- **Performance**: Moving average smoothing, battery optimization
- **Permissions**: Automatic mic permission request with fallback UI

---

## 6. UI/UX Design ✅

### Theme System
- **Global Dark Mode**: Consistent background, surface, and accent colors
- **Theme Context**: Centralized theme management across all components
- **Responsive Design**: Scales well across different device sizes

### Accessibility
- **Touch Targets**: Large buttons (80x80px) with clear visual feedback
- **Visual Contrast**: High-contrast text and controls
- **Haptic Feedback**: Optional vibration for better user experience

---

## 7. Performance & Optimization ✅

### WebView Performance
- **Audio Context Management**: Lazy initialization and automatic cleanup
- **Message Passing**: Optimized with 16ms batching and throttling
- **Memory Management**: Comprehensive leak prevention and resource tracking
- **Caching**: WebView HTML caching to reduce initialization overhead

### Battery & Resource Management
- **Audio Context Suspension**: Automatic after 5 minutes of inactivity
- **Background Detection**: Power-aware optimizations
- **Memory Monitoring**: Real-time usage tracking with leak detection
- **Resource Cleanup**: Automatic garbage collection and emergency cleanup

---

## 8. Testing & Validation ✅

### Test Infrastructure
- **Automated Tests**: 104 tests covering timing accuracy, UI integration, and performance
- **Test Runner**: Comprehensive test suite with performance benchmarks
- **In-app Testing**: TestingPanel component for development and debugging
- **Manual Testing**: Device-specific checklists for iOS/Android validation

### Test Coverage
- **Audio Permissions**: Permission handling and fallback scenarios
- **Timing Accuracy**: Mathematical calculations and WebView implementation
- **Show Mode**: Count-in logic, measure transitions, completion handling
- **UI Integration**: Theme consistency and responsive design
- **Performance**: Memory usage, audio latency, and resource management

---

## 9. Dependencies & Architecture

### Core Dependencies
- **Expo SDK**: Core framework and build tools
- **expo-audio**: Audio permission handling
- **react-native-live-audio-stream**: Real-time audio capture for tuner
- **pitchfinder**: YIN algorithm for pitch detection
- **AsyncStorage**: Local data persistence

### WebView Architecture
- **Audio Timing**: Web Audio API with AudioContext for precise timing
- **Self-contained Logic**: All UI and functionality within WebView
- **Theme Integration**: CSS variables for consistent theming
- **Performance**: Optimized rendering and audio processing

---

# **Phase 1: Core App Development** ✅
- Project foundation and core utilities
- Met Mode core functionality with WebView implementation
- Show Mode core functionality with WebView implementation
- UI theme unification and usability improvements

# **Phase 2: Real-Time Instrument Tuner** ✅
- Research and dependency selection
- Audio capture installation and configuration
- Pitch detection implementation
- Tuner screen UI and functionality

# **Phase 3: UI Theme and Usability** ✅
- Global theme unification across all tabs
- Met Mode UI restructuring and feature additions

# **Phase 4: WebView Migration** ✅
- WebView metronome with expo-audio
- WebView show mode implementation
- Testing and validation
- Performance optimization and monitoring

# **Phase 5: WebView UI Improvements** ✅
- Complete WebView metronome redesign
- Self-contained architecture with subdivision support
- Enhanced tap BPM and modal designs
- Theme integration and performance optimization

---

# **Potential future ideas**
1. ✅ Subdivisions per beat
2. ✅ Accent patterns (e.g. for 7/8: O-o-O-o-O-o-o). Add in presets but also allow the user to create their own.
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

