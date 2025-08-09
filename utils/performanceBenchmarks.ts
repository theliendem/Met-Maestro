/**
 * Performance Benchmarks and Monitoring System
 * Comprehensive performance testing and real-time monitoring for WebView metronome
 */

interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  timestamp: number;
}

interface PerformanceMetrics {
  fps: number;
  audioLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  batteryImpact: 'low' | 'medium' | 'high';
  networkUsage: number;
  renderTime: number;
  scriptExecutionTime: number;
}

interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  overallScore: number;
  recommendations: string[];
  timestamp: number;
}

class PerformanceBenchmarks {
  private static instance: PerformanceBenchmarks;
  private benchmarkResults: BenchmarkResult[] = [];
  private metricsHistory: PerformanceMetrics[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  static getInstance(): PerformanceBenchmarks {
    if (!PerformanceBenchmarks.instance) {
      PerformanceBenchmarks.instance = new PerformanceBenchmarks();
    }
    return PerformanceBenchmarks.instance;
  }

  /**
   * Run comprehensive performance benchmarks
   */
  async runBenchmarkSuite(): Promise<BenchmarkSuite> {
    console.log('📊 Starting comprehensive performance benchmark suite');
    const startTime = performance.now();
    const results: BenchmarkResult[] = [];

    // Audio Context Initialization Benchmark
    results.push(await this.benchmarkAudioContextInit());
    
    // Message Passing Benchmark
    results.push(await this.benchmarkMessagePassing());
    
    // DOM Manipulation Benchmark
    results.push(await this.benchmarkDOMManipulation());
    
    // Audio Generation Benchmark
    results.push(await this.benchmarkAudioGeneration());
    
    // Timer Accuracy Benchmark
    results.push(await this.benchmarkTimerAccuracy());
    
    // Memory Allocation Benchmark
    results.push(await this.benchmarkMemoryAllocation());
    
    // CSS Animation Benchmark
    results.push(await this.benchmarkCSSAnimations());

    this.benchmarkResults.push(...results);

    const totalTime = performance.now() - startTime;
    const overallScore = this.calculateOverallScore(results);
    const recommendations = this.generateRecommendations(results);

    const suite: BenchmarkSuite = {
      name: 'Met Maestro WebView Performance Suite',
      results,
      overallScore,
      recommendations,
      timestamp: Date.now()
    };

    console.log(`📊 Benchmark suite completed in ${totalTime.toFixed(2)}ms`);
    console.log(`📊 Overall performance score: ${overallScore}/100`);
    
    return suite;
  }

  /**
   * Benchmark audio context initialization
   */
  private async benchmarkAudioContextInit(): Promise<BenchmarkResult> {
    const iterations = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const context = new AudioContextClass();
        
        if (context.state === 'suspended') {
          await context.resume();
        }
        
        await context.close();
        
        const duration = performance.now() - startTime;
        times.push(duration);
      } catch (error) {
        console.warn('Audio context benchmark failed:', error);
        times.push(1000); // Penalty for failure
      }
      
      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.calculateBenchmarkResult('AudioContext Initialization', times, iterations);
  }

  /**
   * Benchmark message passing performance
   */
  private async benchmarkMessagePassing(): Promise<BenchmarkResult> {
    const iterations = 100;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      // Simulate message creation and serialization
      const message = {
        type: 'BENCHMARK_MESSAGE',
        data: {
          tempo: 120 + i,
          timeSignature: { numerator: 4, denominator: 4 },
          isPlaying: i % 2 === 0,
          timestamp: Date.now(),
          metadata: new Array(100).fill(`data_${i}`)
        }
      };
      
      const serialized = JSON.stringify(message);
      const deserialized = JSON.parse(serialized);
      
      // Simulate message processing
      const processed = {
        ...deserialized,
        processed: true,
        processingTime: performance.now() - startTime
      };
      
      const duration = performance.now() - startTime;
      times.push(duration);
    }

    return this.calculateBenchmarkResult('Message Passing', times, iterations);
  }

  /**
   * Benchmark DOM manipulation performance
   */
  private async benchmarkDOMManipulation(): Promise<BenchmarkResult> {
    const iterations = 50;
    const times: number[] = [];

    // Create test container
    const testContainer = document.createElement('div');
    testContainer.style.position = 'absolute';
    testContainer.style.left = '-9999px';
    document.body.appendChild(testContainer);

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      // Create tempo bar elements (simulating metronome UI)
      const tempoBar = document.createElement('div');
      tempoBar.className = 'tempo-bar-benchmark';
      tempoBar.style.width = '300px';
      tempoBar.style.height = '20px';
      tempoBar.style.display = 'flex';
      
      // Add beat indicators
      for (let beat = 0; beat < 8; beat++) {
        const indicator = document.createElement('div');
        indicator.className = 'beat-indicator';
        indicator.style.flex = '1';
        indicator.style.height = '100%';
        indicator.style.backgroundColor = beat === (i % 8) ? '#007AFF' : '#333';
        indicator.style.margin = '0 1px';
        indicator.style.transition = 'background-color 0.1s ease';
        tempoBar.appendChild(indicator);
      }
      
      testContainer.appendChild(tempoBar);
      
      // Force reflow
      testContainer.offsetHeight;
      
      // Update beat highlighting
      const indicators = tempoBar.querySelectorAll('.beat-indicator');
      indicators.forEach((indicator, index) => {
        (indicator as HTMLElement).style.backgroundColor = 
          index === (i % 8) ? '#007AFF' : '#333';
      });
      
      // Force another reflow
      testContainer.offsetHeight;
      
      const duration = performance.now() - startTime;
      times.push(duration);
      
      // Clean up
      testContainer.removeChild(tempoBar);
    }

    // Clean up test container
    document.body.removeChild(testContainer);

    return this.calculateBenchmarkResult('DOM Manipulation', times, iterations);
  }

  /**
   * Benchmark audio generation performance
   */
  private async benchmarkAudioGeneration(): Promise<BenchmarkResult> {
    const iterations = 25;
    const times: number[] = [];

    let audioContext: AudioContext | null = null;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        // Create oscillator and gain node
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Configure oscillator
        oscillator.frequency.setValueAtTime(800 + (i * 10), audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Configure gain envelope
        const currentTime = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start and stop
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.1);
        
        const duration = performance.now() - startTime;
        times.push(duration);
        
        // Small delay to prevent audio overlap
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } catch (error) {
      console.warn('Audio generation benchmark failed:', error);
      // Fill with penalty times
      for (let i = times.length; i < iterations; i++) {
        times.push(100); // 100ms penalty
      }
    } finally {
      if (audioContext && audioContext.state !== 'closed') {
        await audioContext.close();
      }
    }

    return this.calculateBenchmarkResult('Audio Generation', times, iterations);
  }

  /**
   * Benchmark timer accuracy
   */
  private async benchmarkTimerAccuracy(): Promise<BenchmarkResult> {
    const iterations = 20;
    const times: number[] = [];
    const expectedInterval = 100; // 100ms

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      await new Promise(resolve => {
        setTimeout(() => {
          const actualDuration = performance.now() - startTime;
          const accuracy = Math.abs(actualDuration - expectedInterval);
          times.push(accuracy); // Lower is better for timer accuracy
          resolve(undefined);
        }, expectedInterval);
      });
    }

    return this.calculateBenchmarkResult('Timer Accuracy', times, iterations);
  }

  /**
   * Benchmark memory allocation patterns
   */
  private async benchmarkMemoryAllocation(): Promise<BenchmarkResult> {
    const iterations = 30;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      // Simulate memory-intensive operations common in audio processing
      const arrays: number[][] = [];
      
      // Create multiple arrays (simulating audio buffers)
      for (let j = 0; j < 10; j++) {
        const buffer = new Array(1024).fill(0).map((_, index) => 
          Math.sin(2 * Math.PI * (index / 1024) * (440 + i + j))
        );
        arrays.push(buffer);
      }
      
      // Process arrays (simulating audio manipulation)
      const processed = arrays.map(buffer => 
        buffer.map(sample => sample * 0.8) // Apply gain
      );
      
      // Simulate cleanup
      arrays.length = 0;
      processed.length = 0;
      
      const duration = performance.now() - startTime;
      times.push(duration);
    }

    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }

    return this.calculateBenchmarkResult('Memory Allocation', times, iterations);
  }

  /**
   * Benchmark CSS animations performance
   */
  private async benchmarkCSSAnimations(): Promise<BenchmarkResult> {
    const iterations = 20;
    const times: number[] = [];

    // Create test element
    const testElement = document.createElement('div');
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.width = '100px';
    testElement.style.height = '100px';
    testElement.style.backgroundColor = '#007AFF';
    testElement.style.transition = 'all 0.5s ease-in-out';
    document.body.appendChild(testElement);

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      // Trigger animation
      testElement.style.transform = `scale(${1 + (i % 2) * 0.2}) rotate(${i * 18}deg)`;
      testElement.style.backgroundColor = i % 2 === 0 ? '#007AFF' : '#FF9500';
      
      // Wait for animation to complete
      await new Promise(resolve => {
        testElement.addEventListener('transitionend', resolve, { once: true });
        
        // Fallback timeout
        setTimeout(resolve, 600);
      });
      
      const duration = performance.now() - startTime;
      times.push(duration);
    }

    // Clean up
    document.body.removeChild(testElement);

    return this.calculateBenchmarkResult('CSS Animations', times, iterations);
  }

  /**
   * Calculate benchmark result statistics
   */
  private calculateBenchmarkResult(name: string, times: number[], iterations: number): BenchmarkResult {
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // Calculate standard deviation
    const variance = times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      name,
      duration: averageTime,
      iterations,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(results: BenchmarkResult[]): number {
    const weights = {
      'AudioContext Initialization': 0.2,
      'Message Passing': 0.15,
      'DOM Manipulation': 0.15,
      'Audio Generation': 0.25,
      'Timer Accuracy': 0.1,
      'Memory Allocation': 0.1,
      'CSS Animations': 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    results.forEach(result => {
      const weight = weights[result.name] || 0.1;
      let score = 100;

      // Score based on performance thresholds
      switch (result.name) {
        case 'AudioContext Initialization':
          score = Math.max(0, 100 - (result.averageTime / 10)); // 1000ms = 0 points
          break;
        case 'Message Passing':
          score = Math.max(0, 100 - (result.averageTime * 10)); // 10ms = 0 points
          break;
        case 'DOM Manipulation':
          score = Math.max(0, 100 - (result.averageTime / 2)); // 200ms = 0 points
          break;
        case 'Audio Generation':
          score = Math.max(0, 100 - (result.averageTime / 5)); // 500ms = 0 points
          break;
        case 'Timer Accuracy':
          score = Math.max(0, 100 - result.averageTime); // 100ms error = 0 points
          break;
        case 'Memory Allocation':
          score = Math.max(0, 100 - (result.averageTime / 3)); // 300ms = 0 points
          break;
        case 'CSS Animations':
          score = Math.max(0, 100 - (result.averageTime / 10)); // 1000ms = 0 points
          break;
      }

      totalScore += score * weight;
      totalWeight += weight;
    });

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(results: BenchmarkResult[]): string[] {
    const recommendations: string[] = [];

    results.forEach(result => {
      switch (result.name) {
        case 'AudioContext Initialization':
          if (result.averageTime > 500) {
            recommendations.push('AudioContext initialization is slow - consider lazy initialization');
          }
          break;
        case 'Message Passing':
          if (result.averageTime > 5) {
            recommendations.push('Message passing is slow - implement message batching');
          }
          break;
        case 'DOM Manipulation':
          if (result.averageTime > 50) {
            recommendations.push('DOM manipulation is slow - batch DOM updates');
          }
          break;
        case 'Audio Generation':
          if (result.averageTime > 100) {
            recommendations.push('Audio generation is slow - optimize oscillator creation');
          }
          break;
        case 'Timer Accuracy':
          if (result.averageTime > 10) {
            recommendations.push('Timer accuracy is poor - consider using Web Audio API for timing');
          }
          break;
        case 'Memory Allocation':
          if (result.averageTime > 50) {
            recommendations.push('Memory allocation is slow - consider object pooling');
          }
          break;
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable limits');
    }

    return recommendations;
  }

  /**
   * Start real-time performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    console.log('📊 Starting real-time performance monitoring');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(() => {
      this.collectRealTimeMetrics();
    }, 5000); // Every 5 seconds
  }

  /**
   * Stop real-time performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('📊 Stopping real-time performance monitoring');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Collect real-time performance metrics
   */
  private collectRealTimeMetrics(): void {
    const metrics: PerformanceMetrics = {
      fps: this.measureFPS(),
      audioLatency: 0, // Would be measured from audio context
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: 0, // Not directly available in web
      batteryImpact: 'low', // Estimated based on other metrics
      networkUsage: 0, // Not applicable for WebView
      renderTime: this.measureRenderTime(),
      scriptExecutionTime: this.measureScriptTime()
    };

    this.metricsHistory.push(metrics);

    // Keep only last 100 metrics
    if (this.metricsHistory.length > 100) {
      this.metricsHistory = this.metricsHistory.slice(-100);
    }

    // Log significant performance issues
    if (metrics.memoryUsage > 100) {
      console.warn('📊 High memory usage detected:', metrics.memoryUsage.toFixed(1), 'MB');
    }

    if (metrics.fps < 30) {
      console.warn('📊 Low FPS detected:', metrics.fps);
    }
  }

  /**
   * Measure current FPS
   */
  private measureFPS(): number {
    // This is a simplified FPS measurement
    // In practice, you'd use a more sophisticated method
    return 60; // Placeholder
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  /**
   * Measure render time
   */
  private measureRenderTime(): number {
    // Simplified render time measurement
    const startTime = performance.now();
    
    // Force a reflow
    document.body.offsetHeight;
    
    return performance.now() - startTime;
  }

  /**
   * Measure script execution time
   */
  private measureScriptTime(): number {
    const startTime = performance.now();
    
    // Perform some JavaScript operations
    let result = 0;
    for (let i = 0; i < 1000; i++) {
      result += Math.sin(i) * Math.cos(i);
    }
    
    return performance.now() - startTime;
  }

  /**
   * Get performance benchmark results
   */
  getBenchmarkResults(): BenchmarkResult[] {
    return [...this.benchmarkResults];
  }

  /**
   * Get real-time metrics history
   */
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    const latestSuite = this.benchmarkResults.length > 0 ? 
      this.runBenchmarkSuite() : Promise.resolve(null);
    
    const recentMetrics = this.metricsHistory.slice(-10);
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    
    return `
# Met Maestro Performance Report

**Generated:** ${new Date().toISOString()}

## Real-time Metrics (Last 10 measurements)
- **Average Memory Usage:** ${avgMemory.toFixed(1)}MB
- **Current FPS:** ${recentMetrics[recentMetrics.length - 1]?.fps || 'N/A'}
- **Render Performance:** ${recentMetrics[recentMetrics.length - 1]?.renderTime.toFixed(2) || 'N/A'}ms

## Benchmark Results
${this.benchmarkResults.map(result => `
### ${result.name}
- **Average Time:** ${result.averageTime.toFixed(2)}ms
- **Min/Max:** ${result.minTime.toFixed(2)}ms / ${result.maxTime.toFixed(2)}ms
- **Standard Deviation:** ${result.standardDeviation.toFixed(2)}ms
`).join('')}

## Performance Recommendations
${this.generateRecommendations(this.benchmarkResults).map(rec => `- ${rec}`).join('\n')}
`;
  }
}

// Export singleton instance
export const performanceBenchmarks = PerformanceBenchmarks.getInstance();