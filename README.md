# Met Maestro

A professional metronome and show management app built with React Native and Expo, featuring precise timing, real-time instrument tuning, and comprehensive show creation tools for musicians.

## Features

### 🎵 Metronome Mode
- **Precise Timing**: WebView-based metronome using Web Audio API for accurate beat timing
- **Time Signatures**: Support for any time signature with visual chevron controls
- **Subdivisions**: Six subdivision options (none, eighth, triplet, sixteenth, quintuplet, sixtuplet)
- **Tap BPM**: Set tempo by tapping with automatic 5-second timeout
- **Sound Options**: Multiple metronome sounds with high/low pitch for downbeats
- **Visual Tempo Bar**: Real-time beat visualization with highlighted segments

### 🎼 Show Mode
- **Show Creation**: Create complex musical arrangements with multiple measures
- **Tempo Changes**: Seamless tempo transitions between measures
- **Time Signature Changes**: Support for different time signatures within shows
- **Count-in**: 4-beat count-in before show playback
- **Import/Export**: Save and share shows as files
- **Show Management**: Load, rename, and delete saved shows

### 🎯 Instrument Tuner
- **Real-time Pitch Detection**: YIN algorithm for accurate frequency detection
- **Visual Tuner**: Arc-style needle with color-coded in-tune indication
- **Reference Pitch**: Adjustable A4 reference (415-466 Hz)
- **Note Display**: Shows detected note, octave, and cents deviation
- **Low Latency**: <150ms response time using react-native-live-audio-stream

### 🎨 Modern UI
- **Dark Mode Theme**: Professional dark interface with customizable colors
- **Responsive Design**: Optimized for various screen sizes
- **Accessibility**: Large touch targets and clear visual feedback
- **Theme Consistency**: Unified color scheme across all components

## Technical Architecture

### Core Technologies
- **React Native + Expo**: Cross-platform mobile development
- **WebView Integration**: Self-contained metronome and show components
- **Web Audio API**: Precise audio timing and synthesis
- **AsyncStorage**: Local show persistence
- **TypeScript**: Type-safe development

### Audio Systems
- **Metronome Audio**: WebView-based Web Audio API for precise timing
- **Tuner Audio**: react-native-live-audio-stream for real-time pitch detection
- **Performance**: Optimized for battery life and memory usage

### WebView Architecture
The app uses a hybrid architecture where timing-critical components (metronome and show mode) run in WebView containers:

- **Self-contained Logic**: All UI and timing logic contained within WebView HTML/CSS/JS
- **Theme Integration**: React Native theme colors passed to WebView via CSS variables
- **No Communication Overhead**: Eliminates React Native ↔ WebView sync issues
- **Cross-platform Consistency**: Same behavior on iOS and Android

## Project Structure

```
met-maestro/
├── app/
│   ├── (tabs)/
│   │   ├── metronome.tsx     # Metronome mode screen
│   │   ├── show.tsx          # Show mode screen
│   │   └── tuner.tsx         # Instrument tuner screen
│   └── _layout.tsx           # App navigation layout
├── components/
│   ├── WebViewMetronome.tsx  # WebView-based metronome component
│   ├── WebViewShow.tsx       # WebView-based show component
│   └── ui/                   # Reusable UI components
├── utils/
│   ├── pitchDetector.ts      # YIN algorithm implementation
│   ├── audioSession.ts       # Audio session management
│   └── performance/          # Performance optimization utilities
├── constants/
│   └── AppTheme.tsx          # Global theme configuration
└── hooks/                    # Custom React hooks
```

## Debugging & Development

### Performance Monitoring
The app includes built-in performance monitoring accessible through development builds:

- **Real-time Metrics**: Memory usage, audio latency, and timing accuracy tracking
- **Resource Monitoring**: Automatic detection of memory leaks and resource cleanup
- **Audio Performance**: WebView audio context initialization and latency measurement
- **Battery Optimization**: Background/foreground detection with automatic suspension

### Debug Features
- **WebView Console**: Access browser developer tools for metronome and show components
- **Audio Context Debugging**: Real-time audio node monitoring and cleanup verification
- **Timing Validation**: Built-in test suite with 104 automated tests for timing accuracy
- **Performance Reports**: Automatic generation of optimization recommendations

### Testing Infrastructure
- **Automated Tests**: Mathematical validation of beat intervals and audio timing
- **Manual Testing Checklists**: Device-specific validation for iOS and Android
- **Performance Benchmarks**: Timing accuracy validation across different tempos and time signatures

## Performance Optimizations

The app includes comprehensive performance monitoring and optimization:

### Memory Management
- **Resource Tracking**: Automatic cleanup of timers, intervals, and audio nodes
- **Leak Prevention**: Memory usage monitoring with automatic garbage collection
- **Battery Optimization**: Inactivity-based suspension and background/foreground detection

### Audio Performance
- **Lazy Initialization**: Audio contexts created only when needed
- **Automatic Suspension**: Audio contexts suspended after 5 minutes of inactivity
- **Message Batching**: Optimized WebView communication at ~60fps

### Monitoring
- **Real-time Metrics**: Memory usage, audio latency, and performance tracking
- **Automated Testing**: 104 automated tests covering timing accuracy and UI integration
- **Performance Reports**: Automatic generation of optimization recommendations


## Development History

The app has evolved through several major phases:

1. **Phase 1**: Core metronome and show functionality with React Native components
2. **Phase 2**: Real-time instrument tuner with YIN algorithm
3. **Phase 3**: UI theme unification and usability improvements
4. **Phase 4**: Migration to WebView architecture for precise audio timing
5. **Phase 5**: Complete WebView UI redesign with subdivision support

## Technical Specifications

### Audio Performance
- **Metronome Precision**: <10ms timing accuracy using Web Audio API
- **Tuner Latency**: <150ms response time for pitch detection
- **Sample Rate**: 16 kHz mono PCM for tuner input
- **Buffer Size**: ~2048 samples (~128ms) for optimal latency/accuracy balance

### Cross-Platform Support
- **iOS**: 13.0+ with native audio session management
- **Android**: API 21+ with optimized audio processing
- **WebView**: Consistent audio behavior across platforms

## Acknowledgments

- Timer logic inspired by [musicandcode/Metronome](https://github.com/musicandcode/Metronome)
- YIN pitch detection algorithm from the `pitchfinder` library
- Built with Expo and React Native ecosystem

---

**Version**: 3.0.0  
**Platform**: iOS, Android  
**Requirements**: iOS 13.0+, Android API 21+  
**Audio Latency**: <150ms tuner response, <10ms metronome precision