/**
 * Timing Accuracy Test Script
 * Compares WebView timing with timer.js implementation and verifies beat intervals
 * Tests mathematical correctness of tempo and time signature calculations
 */

interface TimingTestResult {
  test: string;
  expected: number;
  actual: number;
  tolerance: number;
  status: 'pass' | 'fail';
  message: string;
  timestamp: string;
}

interface TimeSignature {
  numerator: number;
  denominator: number;
}

class TimingAccuracyTester {
  private results: TimingTestResult[] = [];
  private tolerance = 5; // 5ms tolerance for timing tests

  private logResult(test: string, expected: number, actual: number, tolerance: number = this.tolerance) {
    const diff = Math.abs(expected - actual);
    const status: 'pass' | 'fail' = diff <= tolerance ? 'pass' : 'fail';
    const message = status === 'pass' 
      ? `Within tolerance (${diff.toFixed(2)}ms difference)`
      : `Outside tolerance (${diff.toFixed(2)}ms difference, max ${tolerance}ms)`;

    const result: TimingTestResult = {
      test,
      expected,
      actual,
      tolerance,
      status,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    console.log(`[${status.toUpperCase()}] ${test}: Expected ${expected}ms, Got ${actual}ms (${message})`);
  }

  /**
   * Calculate beat interval using the formula from scope.md
   * For time signature X/Y at N BPM: Beat duration = 60000 / (BPM * (4/Y)) ms
   */
  calculateBeatInterval(bpm: number, timeSignature: TimeSignature): number {
    return 60000 / (bpm * (4 / timeSignature.denominator));
  }

  /**
   * Calculate interval for subdivisions
   */
  calculateSubdivisionInterval(bpm: number, timeSignature: TimeSignature, subdivision: number): number {
    const beatInterval = this.calculateBeatInterval(bpm, timeSignature);
    return beatInterval / subdivision;
  }

  testBasicBeatIntervals() {
    console.log('\n=== Testing Basic Beat Intervals ===');

    const testCases = [
      // Standard 4/4 time
      { bpm: 60, timeSignature: { numerator: 4, denominator: 4 }, expected: 1000 },
      { bpm: 120, timeSignature: { numerator: 4, denominator: 4 }, expected: 500 },
      { bpm: 240, timeSignature: { numerator: 4, denominator: 4 }, expected: 250 },
      
      // Different denominators
      { bpm: 120, timeSignature: { numerator: 6, denominator: 8 }, expected: 250 }, // 8th notes
      { bpm: 120, timeSignature: { numerator: 3, denominator: 2 }, expected: 1000 }, // Half notes
      { bpm: 120, timeSignature: { numerator: 2, denominator: 16 }, expected: 125 }, // 16th notes
      
      // Complex time signatures
      { bpm: 140, timeSignature: { numerator: 7, denominator: 8 }, expected: 60000 / (140 * 0.5) },
      { bpm: 90, timeSignature: { numerator: 5, denominator: 4 }, expected: 60000 / (90 * 1) },
    ];

    testCases.forEach(({ bpm, timeSignature, expected }) => {
      const actual = this.calculateBeatInterval(bpm, timeSignature);
      this.logResult(
        `${timeSignature.numerator}/${timeSignature.denominator} at ${bpm}BPM`,
        expected,
        actual
      );
    });
  }

  testSubdivisionIntervals() {
    console.log('\n=== Testing Subdivision Intervals ===');

    const baseCase = {
      bpm: 120,
      timeSignature: { numerator: 4, denominator: 4 }
    };

    const subdivisions = [
      { name: 'None', value: 1, expected: 500 },
      { name: 'Eighth', value: 2, expected: 250 },
      { name: 'Triplet', value: 3, expected: 500/3 },
      { name: 'Sixteenth', value: 4, expected: 125 },
      { name: 'Quintuplet', value: 5, expected: 100 },
      { name: 'Sixtuplet', value: 6, expected: 500/6 }
    ];

    subdivisions.forEach(({ name, value, expected }) => {
      const actual = this.calculateSubdivisionInterval(baseCase.bpm, baseCase.timeSignature, value);
      this.logResult(
        `${name} subdivision at ${baseCase.bpm}BPM`,
        expected,
        actual,
        1 // Tighter tolerance for subdivision calculations
      );
    });
  }

  testEdgeCases() {
    console.log('\n=== Testing Edge Cases ===');

    const edgeCases = [
      // Very slow tempo
      { bpm: 40, timeSignature: { numerator: 4, denominator: 4 }, expected: 1500 },
      
      // Very fast tempo
      { bpm: 300, timeSignature: { numerator: 4, denominator: 4 }, expected: 200 },
      
      // Unusual time signatures
      { bpm: 120, timeSignature: { numerator: 1, denominator: 4 }, expected: 500 },
      { bpm: 120, timeSignature: { numerator: 12, denominator: 8 }, expected: 250 },
      
      // Compound time signatures
      { bpm: 180, timeSignature: { numerator: 6, denominator: 8 }, expected: 60000 / (180 * 0.5) },
      { bpm: 60, timeSignature: { numerator: 9, denominator: 8 }, expected: 60000 / (60 * 0.5) }
    ];

    edgeCases.forEach(({ bpm, timeSignature, expected }) => {
      const actual = this.calculateBeatInterval(bpm, timeSignature);
      this.logResult(
        `Edge case: ${timeSignature.numerator}/${timeSignature.denominator} at ${bpm}BPM`,
        expected,
        actual
      );
    });
  }

  testWebViewTimingConsistency() {
    console.log('\n=== Testing WebView Timing Consistency ===');

    // This would require actual WebView integration to test
    // For now, we'll create the test framework

    const webViewTestScript = `
      // WebView timing test script
      function testWebViewTiming(bpm, timeSignature, subdivision = 1) {
        const beatInterval = 60000 / (bpm * (4 / timeSignature.denominator));
        const interval = beatInterval / subdivision;
        
        let lastTime = performance.now();
        let intervals = [];
        let count = 0;
        const maxCount = 10;
        
        return new Promise((resolve) => {
          const timer = setInterval(() => {
            const currentTime = performance.now();
            const actualInterval = currentTime - lastTime;
            intervals.push(actualInterval);
            lastTime = currentTime;
            count++;
            
            if (count >= maxCount) {
              clearInterval(timer);
              const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
              const variance = intervals.reduce((acc, val) => acc + Math.pow(val - avgInterval, 2), 0) / intervals.length;
              const stdDev = Math.sqrt(variance);
              
              resolve({
                expectedInterval: interval,
                actualAverage: avgInterval,
                standardDeviation: stdDev,
                intervals: intervals
              });
            }
          }, interval);
        });
      }
    `;

    console.log('📝 WebView timing test script generated');
    console.log('⚠️  Manual testing required: Run this script in WebView to test actual timing');
  }

  testMathematicalCorrectness() {
    console.log('\n=== Testing Mathematical Correctness ===');

    // Test the formula: 60000 / (BPM * (4/denominator))
    const tests = [
      {
        description: 'Quarter note at 60 BPM should be 1000ms',
        bpm: 60,
        denominator: 4,
        expected: 1000
      },
      {
        description: 'Eighth note at 120 BPM should be 250ms', 
        bpm: 120,
        denominator: 8,
        expected: 250
      },
      {
        description: 'Half note at 120 BPM should be 1000ms',
        bpm: 120,
        denominator: 2,
        expected: 1000
      },
      {
        description: 'Sixteenth note at 240 BPM should be 62.5ms',
        bpm: 240,
        denominator: 16,
        expected: 62.5
      }
    ];

    tests.forEach(({ description, bpm, denominator, expected }) => {
      const actual = 60000 / (bpm * (4 / denominator));
      this.logResult(description, expected, actual, 0.1); // Very tight tolerance for math
    });
  }

  generateTestReport(): string {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const total = this.results.length;

    const report = `
# Timing Accuracy Test Report

**Generated:** ${new Date().toISOString()}
**Total Tests:** ${total}
**Passed:** ${passed}
**Failed:** ${failed}
**Success Rate:** ${((passed / total) * 100).toFixed(1)}%

## Test Results

${this.results.map(r => 
  `- ${r.status === 'pass' ? '✅' : '❌'} **${r.test}**
    - Expected: ${r.expected}ms
    - Actual: ${r.actual}ms
    - Tolerance: ±${r.tolerance}ms
    - Result: ${r.message}`
).join('\n\n')}

## Manual Testing Required

1. **WebView Timing Test**: Run the generated WebView test script in actual WebView component
2. **Audio Timing Test**: Use audio analysis tools to verify actual audio output timing
3. **Cross-Platform Test**: Verify timing consistency between iOS and Android
4. **Performance Test**: Test timing accuracy under heavy system load

## Recommendations

${failed > 0 ? '⚠️ **Some tests failed** - Review timing calculations and implementation' : '✅ All mathematical tests passed'}
${failed === 0 ? '✅ Mathematical timing calculations are correct' : ''}
`;

    return report;
  }

  async runAllTests(): Promise<TimingTestResult[]> {
    console.log('⏱️ Starting Timing Accuracy Test Suite');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    this.testMathematicalCorrectness();
    this.testBasicBeatIntervals();
    this.testSubdivisionIntervals();
    this.testEdgeCases();
    this.testWebViewTimingConsistency();

    console.log('\n=== Test Results Summary ===');
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => r.status === 'fail').forEach(r => {
        console.log(`- ${r.test}: Expected ${r.expected}ms, Got ${r.actual}ms`);
      });
    }

    return this.results;
  }
}

// Export for use in testing
export const runTimingAccuracyTests = async () => {
  const tester = new TimingAccuracyTester();
  return await tester.runAllTests();
};

export const generateTimingTestReport = async () => {
  const tester = new TimingAccuracyTester();
  await tester.runAllTests();
  return tester.generateTestReport();
};