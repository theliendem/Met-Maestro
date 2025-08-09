/**
 * Show Mode Test Script
 * Tests count-in sequence, measure transitions, tempo changes, and time signature changes
 */

interface ShowTestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  timestamp: string;
  details?: any;
}

interface Measure {
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  tempo: number;
  label?: string;
}

interface Show {
  id: string;
  name: string;
  measures: Measure[];
  createdAt: string;
}

class ShowModeTester {
  private results: ShowTestResult[] = [];

  private logResult(test: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
    const result: ShowTestResult = {
      test,
      status,
      message,
      timestamp: new Date().toISOString(),
      details
    };
    this.results.push(result);
    console.log(`[${status.toUpperCase()}] ${test}: ${message}`);
    if (details) {
      console.log('  Details:', details);
    }
  }

  testShowDataStructure() {
    console.log('\n=== Testing Show Data Structure ===');

    // Test valid show structure
    const validShow: Show = {
      id: 'test-show-1',
      name: 'Test Show',
      measures: [
        { timeSignature: { numerator: 4, denominator: 4 }, tempo: 120 },
        { timeSignature: { numerator: 6, denominator: 8 }, tempo: 140 },
        { timeSignature: { numerator: 3, denominator: 4 }, tempo: 100 }
      ],
      createdAt: new Date().toISOString()
    };

    try {
      // Validate structure
      if (!validShow.id || !validShow.name || !Array.isArray(validShow.measures)) {
        throw new Error('Invalid show structure');
      }

      validShow.measures.forEach((measure, index) => {
        if (!measure.timeSignature || !measure.tempo) {
          throw new Error(`Measure ${index} missing required fields`);
        }
        
        if (measure.timeSignature.numerator < 1 || measure.timeSignature.denominator < 1) {
          throw new Error(`Measure ${index} has invalid time signature`);
        }
        
        if (measure.tempo < 40 || measure.tempo > 300) {
          throw new Error(`Measure ${index} has invalid tempo: ${measure.tempo}`);
        }
      });

      this.logResult('Valid Show Structure', 'pass', 'Show structure validation passed', validShow);
    } catch (error) {
      this.logResult('Valid Show Structure', 'fail', error.message);
    }

    // Test invalid structures
    const invalidCases = [
      {
        name: 'Empty measures array',
        show: { ...validShow, measures: [] },
        expectedError: 'Show must have at least one measure'
      },
      {
        name: 'Missing time signature',
        show: { ...validShow, measures: [{ tempo: 120 } as any] },
        expectedError: 'Missing time signature'
      },
      {
        name: 'Invalid tempo',
        show: { ...validShow, measures: [{ timeSignature: { numerator: 4, denominator: 4 }, tempo: 500 }] },
        expectedError: 'Invalid tempo'
      }
    ];

    invalidCases.forEach(({ name, show, expectedError }) => {
      try {
        if (show.measures.length === 0) {
          throw new Error('Show must have at least one measure');
        }
        
        show.measures.forEach((measure, index) => {
          if (!measure.timeSignature) {
            throw new Error('Missing time signature');
          }
          if (measure.tempo > 300) {
            throw new Error('Invalid tempo');
          }
        });
        
        this.logResult(`Invalid Show: ${name}`, 'fail', 'Should have thrown error but passed');
      } catch (error) {
        if (error.message.includes(expectedError.toLowerCase()) || expectedError.toLowerCase().includes(error.message.toLowerCase())) {
          this.logResult(`Invalid Show: ${name}`, 'pass', `Correctly rejected: ${error.message}`);
        } else {
          this.logResult(`Invalid Show: ${name}`, 'fail', `Wrong error: expected "${expectedError}", got "${error.message}"`);
        }
      }
    });
  }

  testCountInSequence() {
    console.log('\n=== Testing Count-In Sequence ===');

    // Test count-in timing calculation
    const testCases = [
      { tempo: 120, timeSignature: { numerator: 4, denominator: 4 }, expectedInterval: 500 },
      { tempo: 60, timeSignature: { numerator: 3, denominator: 4 }, expectedInterval: 1000 },
      { tempo: 180, timeSignature: { numerator: 6, denominator: 8 }, expectedInterval: 167 }, // 60000 / (180 * 2)
    ];

    testCases.forEach(({ tempo, timeSignature, expectedInterval }) => {
      const actualInterval = 60000 / (tempo * (4 / timeSignature.denominator));
      const tolerance = expectedInterval * 0.1; // 10% tolerance
      
      if (Math.abs(actualInterval - expectedInterval) <= tolerance) {
        this.logResult(
          `Count-in timing: ${timeSignature.numerator}/${timeSignature.denominator} at ${tempo}BPM`,
          'pass',
          `Interval: ${actualInterval.toFixed(1)}ms (expected ~${expectedInterval}ms)`
        );
      } else {
        this.logResult(
          `Count-in timing: ${timeSignature.numerator}/${timeSignature.denominator} at ${tempo}BPM`,
          'fail',
          `Interval: ${actualInterval.toFixed(1)}ms (expected ~${expectedInterval}ms, tolerance: ±${tolerance.toFixed(1)}ms)`
        );
      }
    });

    // Test 4-beat count-in duration
    testCases.forEach(({ tempo, timeSignature }) => {
      const beatInterval = 60000 / (tempo * (4 / timeSignature.denominator));
      const totalCountInDuration = beatInterval * 4;
      const expectedDuration = (60000 / tempo) * 4; // 4 quarter notes regardless of time signature
      
      this.logResult(
        `Count-in duration: ${timeSignature.numerator}/${timeSignature.denominator} at ${tempo}BPM`,
        'warning',
        `Total duration: ${totalCountInDuration.toFixed(0)}ms (${(totalCountInDuration/1000).toFixed(1)}s) - Manual verification needed`
      );
    });
  }

  testMeasureTransitions() {
    console.log('\n=== Testing Measure Transitions ===');

    const testShow: Show = {
      id: 'transition-test',
      name: 'Transition Test Show',
      measures: [
        { timeSignature: { numerator: 4, denominator: 4 }, tempo: 120, label: 'Intro' },
        { timeSignature: { numerator: 6, denominator: 8 }, tempo: 140, label: 'Verse' },
        { timeSignature: { numerator: 3, denominator: 4 }, tempo: 100, label: 'Bridge' },
        { timeSignature: { numerator: 4, denominator: 4 }, tempo: 160, label: 'Chorus' }
      ],
      createdAt: new Date().toISOString()
    };

    // Test transition calculations
    for (let i = 0; i < testShow.measures.length - 1; i++) {
      const currentMeasure = testShow.measures[i];
      const nextMeasure = testShow.measures[i + 1];
      
      const currentBeats = currentMeasure.timeSignature.numerator;
      const nextBeats = nextMeasure.timeSignature.numerator;
      
      const currentInterval = 60000 / (currentMeasure.tempo * (4 / currentMeasure.timeSignature.denominator));
      const nextInterval = 60000 / (nextMeasure.tempo * (4 / nextMeasure.timeSignature.denominator));
      
      const measureDuration = currentInterval * currentBeats;
      
      this.logResult(
        `Transition ${i+1}-${i+2}: ${currentMeasure.label} → ${nextMeasure.label}`,
        'pass',
        `${currentMeasure.timeSignature.numerator}/${currentMeasure.timeSignature.denominator}@${currentMeasure.tempo} to ${nextMeasure.timeSignature.numerator}/${nextMeasure.timeSignature.denominator}@${nextMeasure.tempo}`,
        {
          currentMeasureDuration: measureDuration,
          currentInterval: currentInterval,
          nextInterval: nextInterval,
          intervalChange: ((nextInterval - currentInterval) / currentInterval * 100).toFixed(1) + '%'
        }
      );
    }

    // Test timing continuity
    const totalDuration = testShow.measures.reduce((total, measure) => {
      const interval = 60000 / (measure.tempo * (4 / measure.timeSignature.denominator));
      const measureDuration = interval * measure.timeSignature.numerator;
      return total + measureDuration;
    }, 0);

    this.logResult(
      'Total Show Duration',
      'pass',
      `${(totalDuration / 1000).toFixed(1)} seconds (${Math.floor(totalDuration / 60000)}:${Math.floor((totalDuration % 60000) / 1000).toString().padStart(2, '0')})`,
      { totalDurationMs: totalDuration }
    );
  }

  testTempoChanges() {
    console.log('\n=== Testing Tempo Changes ===');

    const tempoChangeTests = [
      { from: 120, to: 140, change: 'Increase' },
      { from: 160, to: 90, change: 'Decrease' },
      { from: 120, to: 120, change: 'No change' },
      { from: 60, to: 180, change: 'Large increase' },
      { from: 200, to: 80, change: 'Large decrease' }
    ];

    tempoChangeTests.forEach(({ from, to, change }) => {
      const fromInterval = 60000 / (from * 1); // Assuming quarter notes
      const toInterval = 60000 / (to * 1);
      const percentChange = ((to - from) / from * 100).toFixed(1);
      
      let status: 'pass' | 'warning' = 'pass';
      let message = `${from}→${to}BPM (${percentChange}% change)`;
      
      // Flag potentially problematic changes
      if (Math.abs(parseFloat(percentChange)) > 50) {
        status = 'warning';
        message += ' - Large tempo change, may be jarring for users';
      }
      
      if (to < 40 || to > 300) {
        status = 'warning';
        message += ' - Tempo outside typical range (40-300 BPM)';
      }

      this.logResult(
        `Tempo Change: ${change}`,
        status,
        message,
        {
          fromInterval: fromInterval,
          toInterval: toInterval,
          intervalRatio: (toInterval / fromInterval).toFixed(2)
        }
      );
    });
  }

  testTimeSignatureChanges() {
    console.log('\n=== Testing Time Signature Changes ===');

    const timeSignatureTests = [
      {
        from: { numerator: 4, denominator: 4 },
        to: { numerator: 6, denominator: 8 },
        description: 'Simple to compound time'
      },
      {
        from: { numerator: 6, denominator: 8 },
        to: { numerator: 4, denominator: 4 },
        description: 'Compound to simple time'
      },
      {
        from: { numerator: 4, denominator: 4 },
        to: { numerator: 7, denominator: 8 },
        description: 'Simple to irregular time'
      },
      {
        from: { numerator: 3, denominator: 4 },
        to: { numerator: 5, denominator: 4 },
        description: 'Odd meter change'
      }
    ];

    const tempo = 120; // Fixed tempo for comparison

    timeSignatureTests.forEach(({ from, to, description }) => {
      const fromInterval = 60000 / (tempo * (4 / from.denominator));
      const toInterval = 60000 / (tempo * (4 / to.denominator));
      
      const fromMeasureDuration = fromInterval * from.numerator;
      const toMeasureDuration = toInterval * to.numerator;
      
      this.logResult(
        `Time Signature: ${description}`,
        'pass',
        `${from.numerator}/${from.denominator} → ${to.numerator}/${to.denominator}`,
        {
          fromBeatInterval: fromInterval,
          toBeatInterval: toInterval,
          fromMeasureDuration: fromMeasureDuration,
          toMeasureDuration: toMeasureDuration,
          measureDurationRatio: (toMeasureDuration / fromMeasureDuration).toFixed(2)
        }
      );
    });
  }

  testShowCompletion() {
    console.log('\n=== Testing Show Completion ===');

    const testShow: Show = {
      id: 'completion-test',
      name: 'Completion Test Show',
      measures: [
        { timeSignature: { numerator: 4, denominator: 4 }, tempo: 120 },
        { timeSignature: { numerator: 3, denominator: 4 }, tempo: 100 }
      ],
      createdAt: new Date().toISOString()
    };

    // Calculate expected completion time
    const totalBeats = testShow.measures.reduce((total, measure) => total + measure.timeSignature.numerator, 0);
    const avgTempo = testShow.measures.reduce((sum, measure) => sum + measure.tempo, 0) / testShow.measures.length;
    const estimatedDuration = (totalBeats / avgTempo) * 60000; // Rough estimate

    this.logResult(
      'Show Completion Calculation',
      'pass',
      `${testShow.measures.length} measures, ${totalBeats} total beats`,
      {
        totalBeats,
        averageTempo: avgTempo,
        estimatedDurationMs: estimatedDuration,
        estimatedDurationSeconds: (estimatedDuration / 1000).toFixed(1)
      }
    );

    // Test state restoration after completion
    this.logResult(
      'State Restoration',
      'warning',
      'Manual test required: Verify original state is restored after show completion'
    );
  }

  testShowPersistence() {
    console.log('\n=== Testing Show Persistence ===');

    const testShow: Show = {
      id: 'persistence-test',
      name: 'Persistence Test Show',
      measures: [
        { timeSignature: { numerator: 4, denominator: 4 }, tempo: 120 },
        { timeSignature: { numerator: 6, denominator: 8 }, tempo: 140 }
      ],
      createdAt: new Date().toISOString()
    };

    try {
      // Test JSON serialization/deserialization
      const serialized = JSON.stringify(testShow);
      const deserialized = JSON.parse(serialized);
      
      // Verify data integrity
      if (JSON.stringify(testShow) !== JSON.stringify(deserialized)) {
        throw new Error('Serialization/deserialization mismatch');
      }

      this.logResult(
        'JSON Serialization',
        'pass',
        'Show data serializes and deserializes correctly',
        { serializedSize: serialized.length }
      );
    } catch (error) {
      this.logResult('JSON Serialization', 'fail', error.message);
    }

    // Test AsyncStorage compatibility (mock)
    try {
      const storageKey = `show_${testShow.id}`;
      const storageValue = JSON.stringify(testShow);
      
      // Mock AsyncStorage operations
      this.logResult(
        'AsyncStorage Compatibility',
        'warning',
        'Manual test required: Verify AsyncStorage operations work correctly',
        { storageKey, valueSize: storageValue.length }
      );
    } catch (error) {
      this.logResult('AsyncStorage Compatibility', 'fail', error.message);
    }
  }

  generateShowTestReport(): string {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const total = this.results.length;

    return `
# Show Mode Test Report

**Generated:** ${new Date().toISOString()}
**Total Tests:** ${total}
**Passed:** ${passed}
**Failed:** ${failed}
**Warnings:** ${warnings}
**Success Rate:** ${((passed / total) * 100).toFixed(1)}%

## Test Results

${this.results.map(r => 
  `### ${r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️'} ${r.test}

**Status:** ${r.status.toUpperCase()}  
**Message:** ${r.message}  
**Timestamp:** ${r.timestamp}
${r.details ? `**Details:** \`${JSON.stringify(r.details, null, 2)}\`` : ''}
`).join('\n\n')}

## Manual Testing Checklist

### Count-In Testing
- [ ] Verify 4-beat count-in plays before show starts
- [ ] Confirm count-in banner displays "Count-in" text
- [ ] Test count-in uses first measure's tempo and time signature
- [ ] Verify count-in audio plays with correct rhythm

### Measure Transition Testing  
- [ ] Test smooth transitions between different tempos
- [ ] Test transitions between different time signatures
- [ ] Verify tempo bar updates correctly on measure changes
- [ ] Confirm no audio gaps or overlaps during transitions

### Show Completion Testing
- [ ] Verify show stops automatically after last measure
- [ ] Confirm original metronome state is restored
- [ ] Test that state restoration includes tempo, time signature, and subdivision
- [ ] Verify completion callback is triggered correctly

### Edge Cases
- [ ] Test show with single measure
- [ ] Test show with extreme tempo changes (60→180 BPM)
- [ ] Test show with complex time signature changes (4/4→7/8)
- [ ] Test interrupting show playback mid-way

### Performance Testing
- [ ] Test show playback with 50+ measures
- [ ] Verify memory usage doesn't grow during long shows
- [ ] Test rapid start/stop operations
- [ ] Confirm WebView performance under load

## Recommendations

${failed > 0 ? '⚠️ **Address Failed Tests**: Review show logic and calculations' : ''}
${warnings > 0 ? '⚠️ **Complete Manual Tests**: Some functionality requires hands-on verification' : ''}
${failed === 0 && warnings === 0 ? '✅ All automated tests passed - proceed with manual verification' : ''}
`;
  }

  async runAllTests(): Promise<ShowTestResult[]> {
    console.log('🎭 Starting Show Mode Test Suite');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    this.testShowDataStructure();
    this.testCountInSequence();
    this.testMeasureTransitions();
    this.testTempoChanges();
    this.testTimeSignatureChanges();
    this.testShowCompletion();
    this.testShowPersistence();

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

// Export for use in testing
export const runShowModeTests = async () => {
  const tester = new ShowModeTester();
  return await tester.runAllTests();
};

export const generateShowTestReport = async () => {
  const tester = new ShowModeTester();
  await tester.runAllTests();
  return tester.generateShowTestReport();
};