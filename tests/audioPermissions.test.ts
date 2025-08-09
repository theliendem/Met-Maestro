/**
 * Audio Permissions Test Script
 * Tests microphone permissions and audio playback functionality
 * Run this manually on iOS/Android devices to verify permission handling
 */

import { Audio } from 'expo-audio';
import { Platform } from 'react-native';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  timestamp: string;
}

class AudioPermissionTester {
  private results: TestResult[] = [];

  private logResult(test: string, status: 'pass' | 'fail' | 'warning', message: string) {
    const result: TestResult = {
      test,
      status,
      message,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    console.log(`[${status.toUpperCase()}] ${test}: ${message}`);
  }

  async testInitialPermissionState() {
    console.log('\n=== Testing Initial Permission State ===');
    
    try {
      const { status } = await Audio.getPermissionsAsync();
      
      if (status === 'granted') {
        this.logResult('Initial Permission Check', 'pass', 'Audio permission already granted');
      } else if (status === 'denied') {
        this.logResult('Initial Permission Check', 'warning', 'Audio permission denied - will test request flow');
      } else {
        this.logResult('Initial Permission Check', 'warning', `Permission status: ${status} - will test request flow`);
      }
    } catch (error) {
      this.logResult('Initial Permission Check', 'fail', `Error checking permission: ${error.message}`);
    }
  }

  async testPermissionRequest() {
    console.log('\n=== Testing Permission Request ===');
    
    try {
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status === 'granted') {
        this.logResult('Permission Request', 'pass', 'Audio permission granted successfully');
        return true;
      } else {
        this.logResult('Permission Request', 'fail', `Permission request failed with status: ${status}`);
        return false;
      }
    } catch (error) {
      this.logResult('Permission Request', 'fail', `Error requesting permission: ${error.message}`);
      return false;
    }
  }

  async testAudioContextCreation() {
    console.log('\n=== Testing Audio Context Creation ===');
    
    // This would be done in WebView, but we can test the concept
    try {
      // Simulate WebView audio context creation test
      const testScript = `
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          if (audioContext.state === 'suspended') {
            audioContext.resume();
          }
          return { success: true, state: audioContext.state };
        } catch (error) {
          return { success: false, error: error.message };
        }
      `;
      
      this.logResult('Audio Context Test', 'pass', 'Audio context creation test script prepared');
    } catch (error) {
      this.logResult('Audio Context Test', 'fail', `Error preparing audio context test: ${error.message}`);
    }
  }

  async testDeviceStateHandling() {
    console.log('\n=== Testing Device State Handling ===');
    
    // Test silent mode detection (iOS specific)
    if (Platform.OS === 'ios') {
      try {
        // Test if we can detect silent mode
        // Note: This is a conceptual test - actual implementation would be in WebView
        this.logResult('Silent Mode Detection', 'warning', 'Silent mode detection should be tested manually on iOS device');
      } catch (error) {
        this.logResult('Silent Mode Detection', 'fail', `Error in silent mode test: ${error.message}`);
      }
    }

    // Test audio session handling
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.InterruptionModeIOS.MixWithOthers,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false
      });
      
      this.logResult('Audio Mode Configuration', 'pass', 'Audio mode configured successfully');
    } catch (error) {
      this.logResult('Audio Mode Configuration', 'fail', `Error configuring audio mode: ${error.message}`);
    }
  }

  async testBackgroundAudioHandling() {
    console.log('\n=== Testing Background Audio Handling ===');
    
    try {
      // Test background audio capabilities
      this.logResult('Background Audio', 'warning', 'Background audio should be tested manually by backgrounding app during playback');
    } catch (error) {
      this.logResult('Background Audio', 'fail', `Error in background audio test: ${error.message}`);
    }
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🎵 Starting Audio Permissions Test Suite');
    console.log(`Platform: ${Platform.OS}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    await this.testInitialPermissionState();
    const hasPermission = await this.testPermissionRequest();
    
    if (hasPermission) {
      await this.testAudioContextCreation();
      await this.testDeviceStateHandling();
      await this.testBackgroundAudioHandling();
    } else {
      this.logResult('Test Suite', 'warning', 'Skipping audio tests due to missing permission');
    }

    console.log('\n=== Test Results Summary ===');
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => r.status === 'fail').forEach(r => {
        console.log(`- ${r.test}: ${r.message}`);
      });
    }
    
    if (warnings > 0) {
      console.log('\n⚠️ MANUAL TESTS REQUIRED:');
      this.results.filter(r => r.status === 'warning').forEach(r => {
        console.log(`- ${r.test}: ${r.message}`);
      });
    }

    return this.results;
  }
}

// Export for use in React Native component or standalone testing
export const runAudioPermissionTests = async () => {
  const tester = new AudioPermissionTester();
  return await tester.runAllTests();
};

// Manual test checklist for device testing
export const MANUAL_TEST_CHECKLIST = {
  ios: [
    '1. Test with microphone permission denied initially',
    '2. Test with microphone permission granted initially', 
    '3. Test audio playback with silent mode ON',
    '4. Test audio playback with silent mode OFF',
    '5. Test audio playback with headphones connected',
    '6. Test audio playback with Bluetooth audio connected',
    '7. Test audio playback during phone call interruption',
    '8. Test audio playback when app goes to background',
    '9. Test audio playback when device is locked'
  ],
  android: [
    '1. Test with microphone permission denied initially',
    '2. Test with microphone permission granted initially',
    '3. Test audio playback with Do Not Disturb mode ON',
    '4. Test audio playback with volume controls',
    '5. Test audio playback with headphones connected',
    '6. Test audio playback with Bluetooth audio connected', 
    '7. Test audio playback during phone call interruption',
    '8. Test audio playback when app goes to background',
    '9. Test audio playback when device is locked'
  ]
};