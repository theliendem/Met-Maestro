# Met Maestro Step 16: Testing and Validation

This directory contains comprehensive test suites for validating the WebView metronome implementation as described in Step 16 of the scope.md file.

## 📋 Overview

The testing suite validates four critical areas:

1. **Audio Permissions** - Microphone permissions and audio playback functionality
2. **Timing Accuracy** - Mathematical correctness and WebView timing precision
3. **Show Mode** - Count-in sequences, measure transitions, and show completion
4. **UI Integration** - WebView integration, responsive design, and accessibility

## 🧪 Test Files

### Core Test Suites

| File | Purpose | Coverage |
|------|---------|----------|
| `audioPermissions.test.ts` | Audio permission handling and device state testing | iOS/Android permissions, silent mode, background audio |
| `timingAccuracy.test.ts` | Mathematical timing calculations and WebView precision | Beat intervals, subdivisions, tempo changes |
| `showMode.test.ts` | Show mode functionality and state management | Count-in, transitions, completion, persistence |
| `uiIntegration.test.ts` | WebView integration and responsive design | Theme integration, touch targets, accessibility |

### Test Infrastructure

| File | Purpose |
|------|---------|
| `testRunner.ts` | Coordinates all test suites and generates reports |
| `README.md` | Documentation (this file) |

### React Native Integration

| File | Purpose |
|------|---------|
| `../components/TestingPanel.tsx` | In-app testing UI for development builds |

## 🚀 Running Tests

### Method 1: Using the Test Runner (Recommended)

```typescript
import { runStep16Tests, generateStep16Report } from './tests/testRunner';

// Run all tests
const report = await runStep16Tests();
console.log(`Success rate: ${report.summary.overallSuccessRate}%`);

// Generate detailed markdown report
const markdownReport = await generateStep16Report();
console.log(markdownReport);
```

### Method 2: Individual Test Suites

```typescript
import { runAudioPermissionTests } from './tests/audioPermissions.test';
import { runTimingAccuracyTests } from './tests/timingAccuracy.test';
import { runShowModeTests } from './tests/showMode.test';
import { runUIIntegrationTests } from './tests/uiIntegration.test';

// Run specific test suite
const audioResults = await runAudioPermissionTests();
const timingResults = await runTimingAccuracyTests();
const showResults = await runShowModeTests();
const uiResults = await runUIIntegrationTests();
```

### Method 3: In-App Testing Panel (Development Only)

Add the TestingPanel component to your development builds:

```tsx
import { TestingPanel } from './components/TestingPanel';

// In your development screen or debug menu
function DevelopmentScreen() {
  return (
    <View>
      {__DEV__ && <TestingPanel />}
      {/* Other development tools */}
    </View>
  );
}
```

## 📊 Test Results

### Automated Tests

The test suite provides:
- ✅ **Pass/Fail Status** for each test
- ⚠️ **Warnings** for tests requiring manual verification
- 📊 **Detailed Metrics** and calculations
- 📄 **Consolidated Reports** in markdown format

### Success Criteria

- **95%+ Success Rate** for automated tests
- **All critical tests pass** (no failed tests)
- **Manual tests completed** on physical devices

## 🔬 Test Categories

### 1. Audio Permissions Tests

**File:** `audioPermissions.test.ts`

**Automated Tests:**
- Initial permission state checking
- Permission request flow validation
- Audio mode configuration
- Error handling scenarios

**Manual Tests Required:**
- Physical device permission dialogs
- Silent mode behavior (iOS)
- Do Not Disturb mode (Android)
- Background audio playback
- Audio interruption handling

**Key Validation:**
```typescript
// Permission flow
const { status } = await Audio.requestPermissionsAsync();
if (status === 'granted') {
  // Test audio context creation
  // Test playback in various device states
}
```

### 2. Timing Accuracy Tests

**File:** `timingAccuracy.test.ts`

**Automated Tests:**
- Mathematical timing calculations
- Beat interval formulas
- Subdivision timing
- Edge case scenarios

**Manual Tests Required:**
- WebView timing precision measurement
- Audio analysis with external tools
- Cross-platform timing consistency

**Key Validation:**
```typescript
// Beat interval formula: 60000 / (BPM * (4/denominator))
const interval = 60000 / (120 * (4 / 4)); // Should be 500ms for 120 BPM in 4/4
```

### 3. Show Mode Tests

**File:** `showMode.test.ts`

**Automated Tests:**
- Show data structure validation
- Measure transition calculations
- Tempo and time signature changes
- Show persistence and completion

**Manual Tests Required:**
- Count-in sequence verification
- Smooth measure transitions
- State restoration after completion
- Complex show playback

**Key Validation:**
```typescript
// Show structure
interface Show {
  id: string;
  name: string;
  measures: Array<{
    timeSignature: { numerator: number; denominator: number };
    tempo: number;
  }>;
}
```

### 4. UI Integration Tests

**File:** `uiIntegration.test.ts`

**Automated Tests:**
- Theme color integration
- WebView props validation
- Message passing structure
- Responsive design calculations

**Manual Tests Required:**
- Physical device testing
- Touch target verification
- Accessibility compliance
- Performance monitoring

**Key Validation:**
```typescript
// Theme integration
const themeColors = {
  background: '#000000',
  surface: '#1a1a1a',
  accent: '#007AFF',
  // ... other colors
};
```

## 🎯 Manual Testing Checklists

### iOS Device Testing
- [ ] Test with microphone permission denied initially
- [ ] Test audio playback with silent mode ON/OFF
- [ ] Test audio interruption during phone calls
- [ ] Test background audio behavior
- [ ] Verify App Store compliance

### Android Device Testing
- [ ] Test with microphone permission denied initially
- [ ] Test audio playback with Do Not Disturb mode
- [ ] Test audio focus handling
- [ ] Test battery optimization impact
- [ ] Verify Google Play compliance

### Cross-Platform Testing
- [ ] Compare timing accuracy between platforms
- [ ] Test WebView behavior differences
- [ ] Verify consistent audio latency
- [ ] Test responsive design on different screen sizes

## 📈 Performance Benchmarks

### Timing Requirements
- **Audio Latency:** < 50ms
- **Beat Timing Accuracy:** ±5ms tolerance
- **WebView Initialization:** < 500ms
- **Memory Usage:** Stable during extended use

### Success Metrics
- **Mathematical Accuracy:** 100% for timing calculations
- **Permission Handling:** 100% success rate
- **UI Integration:** No layout issues across screen sizes
- **Cross-Platform:** Consistent behavior iOS/Android

## 🚨 Critical Test Failures

If any tests fail, address them in this priority order:

1. **🔴 Timing Accuracy Failures** - Critical for metronome functionality
2. **🔴 Audio Permission Failures** - Blocks core functionality
3. **🔴 Show Mode Logic Failures** - Affects complex features
4. **🟡 UI Integration Warnings** - May impact user experience

## 🔧 Troubleshooting

### Common Issues

**Test Suite Won't Run:**
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Verify imports
# Ensure all test files are properly imported in testRunner.ts
```

**Audio Permission Tests Fail:**
```typescript
// Check expo-audio installation
npx expo install expo-audio

// Verify app.json configuration
"plugins": ["expo-audio"]
```

**Timing Tests Report Large Differences:**
```typescript
// Review timing calculation formula
// Check for integer division issues
// Verify mathematical constants
```

**WebView Integration Issues:**
```typescript
// Check React Native WebView version
// Verify WebView props interface
// Test on physical device vs simulator
```

## 📱 Device-Specific Considerations

### iOS
- **Silent Mode:** Must test audio playback with silent mode ON/OFF
- **Interruptions:** Test phone calls, Siri, other audio apps
- **Background:** Test app backgrounding during audio playback
- **Permissions:** Test microphone permission flow

### Android
- **Audio Focus:** Test with other apps playing audio
- **Do Not Disturb:** Test audio playback with DND mode
- **Battery Optimization:** Test with aggressive battery settings
- **Permissions:** Test across different Android versions

## 📋 Step 16 Completion Checklist

Step 16 is complete when:

- [ ] All automated tests pass (95%+ success rate)
- [ ] Critical manual tests completed on iOS and Android
- [ ] Performance benchmarks met
- [ ] Cross-platform consistency verified
- [ ] No blocking bugs or failures identified
- [ ] Test report generated and reviewed

## 🎵 Met Maestro Specific Validations

### WebView Metronome
- [ ] Timing matches timer.js implementation
- [ ] Subdivision functionality works correctly
- [ ] Tap BPM accuracy within 5ms
- [ ] Theme colors apply correctly

### WebView Show Mode
- [ ] Count-in sequence plays correctly
- [ ] Measure transitions are seamless
- [ ] Show completion restores state
- [ ] Complex shows (10+ measures) work properly

### Integration
- [ ] WebView components load without errors
- [ ] Message passing works reliably
- [ ] Performance is acceptable on target devices
- [ ] No memory leaks during extended use

---

**Generated by:** Met Maestro Test Suite v1.0  
**Last Updated:** Step 16 Implementation  
**Next Steps:** Manual device testing and performance validation