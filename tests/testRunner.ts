/**
 * Comprehensive Test Runner for Step 16: Testing and Validation
 * Coordinates all test suites and generates consolidated reports
 */

import { runAudioPermissionTests, MANUAL_TEST_CHECKLIST } from './audioPermissions.test';
import { runTimingAccuracyTests, generateTimingTestReport } from './timingAccuracy.test';
import { runShowModeTests, generateShowTestReport } from './showMode.test';
import { runUIIntegrationTests, generateUITestReport } from './uiIntegration.test';

interface TestSuiteResult {
  suite: string;
  passed: number;
  failed: number;
  warnings: number;
  total: number;
  startTime: string;
  endTime: string;
  duration: number;
  results: any[];
}

interface ConsolidatedReport {
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalWarnings: number;
    overallSuccessRate: number;
    testDuration: number;
  };
  suiteResults: TestSuiteResult[];
  manualTestingRequired: string[];
  recommendations: string[];
  timestamp: string;
}

class TestRunner {
  private suiteResults: TestSuiteResult[] = [];

  async runTestSuite(suiteName: string, testFunction: () => Promise<any[]>): Promise<TestSuiteResult> {
    console.log(`\n🧪 Running ${suiteName} Test Suite`);
    console.log('=' .repeat(50));
    
    const startTime = new Date();
    let results: any[] = [];
    
    try {
      results = await testFunction();
    } catch (error) {
      console.error(`❌ Error running ${suiteName}:`, error);
      results = [];
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const total = results.length;
    
    const suiteResult: TestSuiteResult = {
      suite: suiteName,
      passed,
      failed,
      warnings,
      total,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      results
    };
    
    this.suiteResults.push(suiteResult);
    
    console.log(`\n📊 ${suiteName} Results:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    
    return suiteResult;
  }

  generateConsolidatedReport(): ConsolidatedReport {
    const totalTests = this.suiteResults.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = this.suiteResults.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.suiteResults.reduce((sum, suite) => sum + suite.failed, 0);
    const totalWarnings = this.suiteResults.reduce((sum, suite) => sum + suite.warnings, 0);
    const testDuration = this.suiteResults.reduce((sum, suite) => sum + suite.duration, 0);
    const overallSuccessRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    // Collect manual testing requirements
    const manualTestingRequired = [
      'Audio Permissions: Test on physical iOS/Android devices with different permission states',
      'Timing Accuracy: Use audio analysis tools to verify actual timing precision',
      'Show Mode: Test complete show playback flows with various configurations',
      'UI Integration: Test WebView components on different screen sizes and orientations',
      'Performance: Monitor memory usage and battery consumption during extended use',
      'Cross-Platform: Compare behavior between iOS and Android platforms',
      'Accessibility: Test with screen readers and accessibility features enabled'
    ];

    // Generate recommendations
    const recommendations = [];
    
    if (totalFailed > 0) {
      recommendations.push(`🔴 Critical: Address ${totalFailed} failed test${totalFailed > 1 ? 's' : ''} before proceeding`);
    }
    
    if (totalWarnings > 0) {
      recommendations.push(`🟡 Important: Complete ${totalWarnings} manual test${totalWarnings > 1 ? 's' : ''} for full validation`);
    }
    
    if (overallSuccessRate < 80) {
      recommendations.push('🔴 Critical: Success rate below 80% - comprehensive review required');
    } else if (overallSuccessRate < 95) {
      recommendations.push('🟡 Review: Success rate could be improved - investigate failed/warning tests');
    } else {
      recommendations.push('🟢 Excellent: High success rate - ready for manual testing phase');
    }

    // Performance recommendations
    if (testDuration > 10000) { // 10 seconds
      recommendations.push('⏱️ Performance: Test suite took over 10 seconds - consider optimization');
    }

    // Suite-specific recommendations
    this.suiteResults.forEach(suite => {
      if (suite.failed > 0) {
        recommendations.push(`🔴 ${suite.suite}: ${suite.failed} failed test${suite.failed > 1 ? 's' : ''} require attention`);
      }
    });

    return {
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        totalWarnings,
        overallSuccessRate: parseFloat(overallSuccessRate.toFixed(1)),
        testDuration
      },
      suiteResults: this.suiteResults,
      manualTestingRequired,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }

  generateMarkdownReport(report: ConsolidatedReport): string {
    return `
# Met Maestro Step 16: Testing and Validation Report

**Generated:** ${report.timestamp}  
**Test Duration:** ${(report.summary.testDuration / 1000).toFixed(1)} seconds

## 📊 Overall Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${report.summary.totalTests} |
| Passed | ${report.summary.totalPassed} ✅ |
| Failed | ${report.summary.totalFailed} ❌ |
| Warnings | ${report.summary.totalWarnings} ⚠️ |
| **Success Rate** | **${report.summary.overallSuccessRate}%** |

## 🧪 Test Suite Results

${report.suiteResults.map(suite => `
### ${suite.suite}

| Metric | Value |
|--------|-------|
| Tests Run | ${suite.total} |
| Passed | ${suite.passed} ✅ |
| Failed | ${suite.failed} ❌ |
| Warnings | ${suite.warnings} ⚠️ |
| Success Rate | ${((suite.passed / suite.total) * 100).toFixed(1)}% |
| Duration | ${suite.duration}ms |

${suite.failed > 0 ? `
**❌ Failed Tests:**
${suite.results.filter(r => r.status === 'fail').map(r => `- ${r.test}: ${r.message}`).join('\n')}
` : ''}

${suite.warnings > 0 ? `
**⚠️ Warnings/Manual Tests:**
${suite.results.filter(r => r.status === 'warning').map(r => `- ${r.test}: ${r.message}`).join('\n')}
` : ''}
`).join('\n')}

## 🔬 Manual Testing Required

The following areas require hands-on testing on actual devices:

${report.manualTestingRequired.map(test => `- ${test}`).join('\n')}

### Device Testing Checklist

#### iOS Testing
${MANUAL_TEST_CHECKLIST.ios.map(test => `- [ ] ${test}`).join('\n')}

#### Android Testing
${MANUAL_TEST_CHECKLIST.android.map(test => `- [ ] ${test}`).join('\n')}

## 📱 Platform-Specific Testing

### iOS Specific Tests
- [ ] Test with silent mode ON/OFF
- [ ] Test audio interruption handling (phone calls, other apps)
- [ ] Verify microphone permission flow
- [ ] Test background audio behavior
- [ ] Verify App Store compliance

### Android Specific Tests  
- [ ] Test with Do Not Disturb mode
- [ ] Test audio focus handling
- [ ] Verify permission handling across Android versions
- [ ] Test battery optimization settings impact
- [ ] Verify Google Play compliance

## 🎯 Performance Testing

### WebView Performance
- [ ] WebView initialization time < 500ms
- [ ] Smooth audio timing with no drift
- [ ] Memory usage stable during extended use
- [ ] No memory leaks after multiple play/stop cycles
- [ ] Battery usage within acceptable limits

### Audio Performance
- [ ] Audio latency < 50ms
- [ ] No audio dropouts or glitches
- [ ] Consistent timing across different tempos
- [ ] Smooth tempo transitions in show mode
- [ ] Subdivision timing accuracy

## 🚀 Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 📋 Next Steps

### Immediate Actions (Priority 1)
${report.summary.totalFailed > 0 ? `
1. **🔴 Address Failed Tests**: Review and fix the ${report.summary.totalFailed} failed test${report.summary.totalFailed > 1 ? 's' : ''}
   ${report.suiteResults.filter(s => s.failed > 0).map(s => `   - ${s.suite}: ${s.failed} failed`).join('\n')}
` : '1. ✅ **All Automated Tests Passed** - Proceed to manual testing'}

2. **📱 Device Testing**: Set up testing on physical iOS and Android devices
3. **🧪 Manual Test Execution**: Work through the manual testing checklists above

### Phase 2 Actions
1. **📊 Performance Benchmarking**: Use profiling tools to measure performance
2. **🔄 Cross-Platform Verification**: Compare behavior between platforms
3. **♿ Accessibility Testing**: Test with assistive technologies
4. **🔒 Security Review**: Verify no sensitive data exposure

### Phase 3 Actions
1. **📈 Load Testing**: Test with complex shows (50+ measures)
2. **⚡ Battery Testing**: Measure power consumption during extended use
3. **🌐 Edge Case Testing**: Test unusual time signatures and extreme tempos
4. **👥 User Testing**: Gather feedback from musicians

## 🎵 Met Maestro Specific Validations

### Metronome Mode
- [ ] WebView metronome matches timer.js accuracy
- [ ] Subdivision functionality works correctly
- [ ] Tap BPM feature works accurately
- [ ] Theme colors apply correctly in WebView

### Show Mode  
- [ ] Count-in sequence works correctly
- [ ] Measure transitions are seamless
- [ ] Show completion restores original state
- [ ] Show persistence works across app restarts

### Tuner Mode
- [ ] Pitch detection accuracy within ±2 cents
- [ ] Real-time audio processing < 150ms latency
- [ ] Permission handling works correctly
- [ ] UI remains responsive during audio processing

## ✅ Definition of Done

Step 16 is complete when:

- [ ] All automated tests pass (${report.summary.totalPassed}/${report.summary.totalTests - report.summary.totalWarnings} non-manual tests)
- [ ] All critical manual tests completed on iOS and Android
- [ ] Performance metrics meet requirements
- [ ] No critical bugs or failures
- [ ] Cross-platform consistency verified
- [ ] Accessibility requirements met

---

**Status:** ${report.summary.totalFailed === 0 && report.summary.overallSuccessRate >= 95 ? '🟢 Ready for Production' : report.summary.totalFailed > 0 ? '🔴 Issues Need Resolution' : '🟡 Manual Testing Required'}

Generated by Met Maestro Test Suite v1.0
`;
  }

  async runAllTests(): Promise<ConsolidatedReport> {
    console.log('🎵 Met Maestro Step 16: Testing and Validation');
    console.log('🚀 Starting Comprehensive Test Suite');
    console.log('=' .repeat(80));
    
    const startTime = new Date();
    
    // Run all test suites
    await this.runTestSuite('Audio Permissions', runAudioPermissionTests);
    await this.runTestSuite('Timing Accuracy', runTimingAccuracyTests);
    await this.runTestSuite('Show Mode', runShowModeTests);
    await this.runTestSuite('UI Integration', runUIIntegrationTests);
    
    const endTime = new Date();
    const totalDuration = endTime.getTime() - startTime.getTime();
    
    console.log('\n' + '=' .repeat(80));
    console.log('🏁 All Test Suites Complete');
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)} seconds`);
    
    const report = this.generateConsolidatedReport();
    
    console.log('\n📊 FINAL SUMMARY');
    console.log('=' .repeat(40));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.totalPassed} ✅`);
    console.log(`Failed: ${report.summary.totalFailed} ❌`);
    console.log(`Warnings: ${report.summary.totalWarnings} ⚠️`);
    console.log(`Success Rate: ${report.summary.overallSuccessRate}%`);
    
    if (report.summary.totalFailed === 0) {
      console.log('\n🎉 All automated tests passed!');
      console.log('📱 Ready for manual device testing');
    } else {
      console.log('\n⚠️  Some tests failed - review required');
    }
    
    return report;
  }
}

// Export functions for use
export const runStep16Tests = async (): Promise<ConsolidatedReport> => {
  const runner = new TestRunner();
  return await runner.runAllTests();
};

export const generateStep16Report = async (): Promise<string> => {
  const runner = new TestRunner();
  const report = await runner.runAllTests();
  return runner.generateMarkdownReport(report);
};

// Individual test suite exports for selective testing
export {
  runAudioPermissionTests,
  runTimingAccuracyTests, 
  runShowModeTests,
  runUIIntegrationTests,
  generateTimingTestReport,
  generateShowTestReport,
  generateUITestReport
};

// Main execution if run directly
if (require.main === module) {
  runStep16Tests().then(report => {
    console.log('\n📄 Generating detailed report...');
    const runner = new TestRunner();
    const markdownReport = runner.generateMarkdownReport(report);
    
    // In a real environment, you might save this to a file
    console.log('\n📋 Full Report Generated');
    console.log('Run generateStep16Report() to get the markdown report');
  }).catch(error => {
    console.error('❌ Test execution failed:', error);
  });
}