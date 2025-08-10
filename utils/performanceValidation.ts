/**
 * Performance Validation and Testing Suite
 * Validates that all performance optimizations are working correctly
 */

import { performanceIntegration } from './performanceIntegration';
import { performanceMonitor } from './performanceMonitor';
import { audioContextManager } from './audioContextManager';
import { batteryOptimizer } from './batteryOptimizer';
import { memoryLeakPrevention } from './memoryLeakPrevention';
import { messageOptimizer } from './messagePassingOptimizer';

interface ValidationResult {
  test: string;
  passed: boolean;
  details: string;
  performance?: number;
}

interface ValidationReport {
  overallScore: number;
  results: ValidationResult[];
  recommendations: string[];
  timestamp: number;
}

class PerformanceValidation {
  private static instance: PerformanceValidation;

  static getInstance(): PerformanceValidation {
    if (!PerformanceValidation.instance) {
      PerformanceValidation.instance = new PerformanceValidation();
    }
    return PerformanceValidation.instance;
  }

  /**
   * Run comprehensive performance validation
   */
  async runValidation(): Promise<ValidationReport> {
    console.log('🧪 Starting performance validation tests...');
    
    const results: ValidationResult[] = [];
    
    // Test 1: Performance Integration Initialization
    results.push(await this.testPerformanceIntegration());
    
    // Test 2: Audio Context Management
    results.push(await this.testAudioContextManagement());
    
    // Test 3: Memory Leak Prevention
    results.push(await this.testMemoryLeakPrevention());
    
    // Test 4: Battery Optimization
    results.push(await this.testBatteryOptimization());
    
    // Test 5: Message Passing Optimization
    results.push(await this.testMessageOptimization());
    
    // Test 6: Performance Monitoring
    results.push(await this.testPerformanceMonitoring());
    
    // Test 7: WebView HTML Generation
    results.push(await this.testWebViewOptimization());
    
    // Calculate overall score
    const passedTests = results.filter(r => r.passed).length;
    const overallScore = (passedTests / results.length) * 100;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(results);
    
    const report: ValidationReport = {
      overallScore,
      results,
      recommendations,
      timestamp: Date.now()
    };
    
    this.printValidationReport(report);
    return report;
  }

  /**
   * Test performance integration system
   */
  private async testPerformanceIntegration(): Promise<ValidationResult> {
    try {
      const startTime = performance.now();
      
      await performanceIntegration.initialize({
        enableMonitoring: true,
        enableBatteryOptimization: true,
        enableMemoryLeakPrevention: true,
        enableMessageOptimization: true,
        enableAudioOptimization: true
      });
      
      const endTime = performance.now();
      const initTime = endTime - startTime;
      
      const status = performanceIntegration.getPerformanceStatus();
      
      return {
        test: 'Performance Integration',
        passed: status.overallHealth !== 'poor' && initTime < 100,
        details: `Initialization: ${initTime.toFixed(2)}ms, Health: ${status.overallHealth}`,
        performance: initTime
      };
    } catch (error) {
      return {
        test: 'Performance Integration',
        passed: false,
        details: `Failed to initialize: ${error}`
      };
    }
  }

  /**
   * Test audio context management
   */
  private async testAudioContextManagement(): Promise<ValidationResult> {
    try {
      const startTime = performance.now();
      
      // Initialize audio context
      const context = await audioContextManager.initialize();
      
      const endTime = performance.now();
      const initTime = endTime - startTime;
      
      const metrics = audioContextManager.getMetrics();
      
      // Test oscillator creation
      const oscillator = audioContextManager.createOptimizedOscillator(440);
      const hasOscillator = oscillator !== null;
      
      // Cleanup
      audioContextManager.cleanup();
      
      return {
        test: 'Audio Context Management',
        passed: context !== null && hasOscillator && initTime < 500 && metrics.isInitialized,
        details: `Context ready: ${context !== null}, Oscillator: ${hasOscillator}, Init: ${initTime.toFixed(2)}ms`,
        performance: initTime
      };
    } catch (error) {
      return {
        test: 'Audio Context Management',
        passed: false,
        details: `Audio test failed: ${error}`
      };
    }
  }

  /**
   * Test memory leak prevention
   */
  private async testMemoryLeakPrevention(): Promise<ValidationResult> {
    try {
      // Start monitoring
      memoryLeakPrevention.startMonitoring();
      
      // Track some resources
      const timerId = memoryLeakPrevention.trackTimer(setTimeout(() => {}, 1000));
      const intervalId = memoryLeakPrevention.trackInterval(setInterval(() => {}, 1000));
      
      // Get resource summary
      const summary = memoryLeakPrevention.getResourceSummary();
      
      // Cleanup tracked resources
      memoryLeakPrevention.cleanupTimer(timerId);
      memoryLeakPrevention.cleanupInterval(intervalId);
      
      // Run leak detection
      const leakDetection = memoryLeakPrevention.detectMemoryLeak();
      
      return {
        test: 'Memory Leak Prevention',
        passed: summary.timers >= 0 && summary.intervals >= 0 && leakDetection !== null,
        details: `Timers: ${summary.timers}, Intervals: ${summary.intervals}, Memory: ${summary.currentMemoryMB.toFixed(1)}MB`
      };
    } catch (error) {
      return {
        test: 'Memory Leak Prevention',
        passed: false,
        details: `Memory test failed: ${error}`
      };
    }
  }

  /**
   * Test battery optimization
   */
  private async testBatteryOptimization(): Promise<ValidationResult> {
    try {
      // Initialize battery optimizer
      await batteryOptimizer.initialize();
      
      // Get initial state
      const initialState = batteryOptimizer.getPowerState();
      
      // Test activity recording
      batteryOptimizer.recordActivity();
      
      // Test suspend/resume operations
      batteryOptimizer.suspendOperations();
      const suspendedState = batteryOptimizer.getPowerState();
      
      batteryOptimizer.resumeOperations();
      const resumedState = batteryOptimizer.getPowerState();
      
      // Get battery info
      const batteryInfo = batteryOptimizer.getBatteryInfo();
      
      return {
        test: 'Battery Optimization',
        passed: initialState !== null && !suspendedState.isActive && resumedState.isActive,
        details: `States working: ${!suspendedState.isActive && resumedState.isActive}, Battery API: ${batteryInfo.level !== undefined}`
      };
    } catch (error) {
      return {
        test: 'Battery Optimization',
        passed: false,
        details: `Battery test failed: ${error}`
      };
    }
  }

  /**
   * Test message passing optimization
   */
  private async testMessageOptimization(): Promise<ValidationResult> {
    try {
      // Test message queueing
      const startTime = performance.now();
      
      messageOptimizer.queueMessage('TEST_MESSAGE', { data: 'test' }, 'medium');
      messageOptimizer.queueMessage('HIGH_PRIORITY', { data: 'urgent' }, 'high');
      
      const metrics = messageOptimizer.getMetrics();
      const latency = messageOptimizer.getAverageLatency();
      
      // Clear queue
      messageOptimizer.clear();
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      return {
        test: 'Message Optimization',
        passed: metrics.queueSize >= 0 && processingTime < 10,
        details: `Queue size: ${metrics.queueSize}, Avg latency: ${latency.toFixed(2)}ms, Processing: ${processingTime.toFixed(2)}ms`,
        performance: processingTime
      };
    } catch (error) {
      return {
        test: 'Message Optimization',
        passed: false,
        details: `Message test failed: ${error}`
      };
    }
  }

  /**
   * Test performance monitoring
   */
  private async testPerformanceMonitoring(): Promise<ValidationResult> {
    try {
      // Start monitoring
      performanceMonitor.startMonitoring();
      
      // Record some metrics
      performanceMonitor.recordWebViewInit(150);
      performanceMonitor.recordAudioContextInit(75);
      performanceMonitor.recordMessagePassingLatency(12);
      
      // Get metrics
      const avgLatency = performanceMonitor.getAverageLatency();
      const memoryTrend = performanceMonitor.getMemoryTrend();
      
      // Stop monitoring
      performanceMonitor.stopMonitoring();
      
      return {
        test: 'Performance Monitoring',
        passed: avgLatency >= 0 && memoryTrend !== null,
        details: `Latency: ${avgLatency.toFixed(2)}ms, Memory trend: ${memoryTrend}`
      };
    } catch (error) {
      return {
        test: 'Performance Monitoring',
        passed: false,
        details: `Monitoring test failed: ${error}`
      };
    }
  }

  /**
   * Test WebView HTML optimization
   */
  private async testWebViewOptimization(): Promise<ValidationResult> {
    try {
      const baseHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test</title>
        </head>
        <body>
          <div>Test content</div>
        </body>
        </html>
      `;
      
      const startTime = performance.now();
      const optimizedHTML = performanceIntegration.generateOptimizedWebViewHTML(baseHTML);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      // Check if optimization scripts were injected
      const hasPerformanceScript = optimizedHTML.includes('WebView Performance Monitoring');
      const hasAudioScript = optimizedHTML.includes('Optimized AudioContext');
      const hasBatteryScript = optimizedHTML.includes('Battery Optimization');
      const hasMemoryScript = optimizedHTML.includes('Memory Leak Prevention');
      
      const scriptsInjected = hasPerformanceScript && hasAudioScript && hasBatteryScript && hasMemoryScript;
      
      return {
        test: 'WebView HTML Optimization',
        passed: scriptsInjected && processingTime < 50,
        details: `Scripts injected: ${scriptsInjected}, Processing: ${processingTime.toFixed(2)}ms`,
        performance: processingTime
      };
    } catch (error) {
      return {
        test: 'WebView HTML Optimization',
        passed: false,
        details: `HTML optimization failed: ${error}`
      };
    }
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(results: ValidationResult[]): string[] {
    const recommendations: string[] = [];
    const failedTests = results.filter(r => !r.passed);
    
    if (failedTests.length === 0) {
      recommendations.push('✅ All performance optimizations are working correctly');
      recommendations.push('💡 Consider enabling benchmarking in development for detailed metrics');
    } else {
      recommendations.push(`❌ ${failedTests.length} test(s) failed - review implementation`);
      
      failedTests.forEach(test => {
        recommendations.push(`🔍 ${test.test}: ${test.details}`);
      });
    }
    
    // Performance-based recommendations
    const slowTests = results.filter(r => r.performance && r.performance > 100);
    if (slowTests.length > 0) {
      recommendations.push('⚡ Some operations are slower than expected - consider optimization');
    }
    
    return recommendations;
  }

  /**
   * Print validation report to console
   */
  private printValidationReport(report: ValidationReport): void {
    console.log('\n🧪 PERFORMANCE VALIDATION REPORT');
    console.log('================================');
    console.log(`Overall Score: ${report.overallScore.toFixed(1)}%`);
    console.log(`Timestamp: ${new Date(report.timestamp).toISOString()}\n`);
    
    console.log('Test Results:');
    report.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      const perf = result.performance ? ` (${result.performance.toFixed(2)}ms)` : '';
      console.log(`${index + 1}. ${status} ${result.test}${perf}`);
      console.log(`   ${result.details}`);
    });
    
    console.log('\nRecommendations:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('================================\n');
  }

  /**
   * Quick health check - simplified validation
   */
  async quickHealthCheck(): Promise<boolean> {
    try {
      const status = performanceIntegration.getPerformanceStatus();
      const memoryInfo = memoryLeakPrevention.getResourceSummary();
      
      const isHealthy = 
        status.overallHealth !== 'poor' &&
        status.memoryUsage < 150 &&
        status.messageLatency < 50 &&
        memoryInfo.timers < 20 &&
        memoryInfo.eventListeners < 50;
      
      console.log(`🏥 Quick Health Check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      return isHealthy;
    } catch (error) {
      console.error('🏥 Health check failed:', error);
      return false;
    }
  }
}

// Export singleton
export const performanceValidation = PerformanceValidation.getInstance();

// Convenience functions
export const runPerformanceValidation = () => performanceValidation.runValidation();
export const quickHealthCheck = () => performanceValidation.quickHealthCheck();