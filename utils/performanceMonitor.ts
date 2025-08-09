/**
 * Performance Monitor Utility
 * Tracks WebView performance metrics, memory usage, and audio context lifecycle
 */

interface PerformanceMetrics {
  webViewInitTime: number;
  audioContextInitTime: number;
  memoryUsage: number;
  renderTime: number;
  messagePassingLatency: number;
  audioLatency: number;
  timestamp: number;
}

interface AudioContextMetrics {
  state: string;
  sampleRate: number;
  currentTime: number;
  baseLatency?: number;
  outputLatency?: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = false;
  private startTime = 0;
  private memoryInterval?: NodeJS.Timeout;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startTime = performance.now();
    
    console.log('🔍 PerformanceMonitor: Starting monitoring');
    
    // Monitor memory usage every 5 seconds
    this.memoryInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, 5000);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = undefined;
    }
    
    console.log('🔍 PerformanceMonitor: Monitoring stopped');
    this.generateReport();
  }

  recordWebViewInit(duration: number): void {
    console.log(`📊 WebView initialization: ${duration.toFixed(2)}ms`);
    
    this.addMetric({
      webViewInitTime: duration,
      audioContextInitTime: 0,
      memoryUsage: this.getMemoryUsage(),
      renderTime: 0,
      messagePassingLatency: 0,
      audioLatency: 0,
      timestamp: performance.now()
    });
  }

  recordAudioContextInit(duration: number, contextMetrics?: AudioContextMetrics): void {
    console.log(`🔊 AudioContext initialization: ${duration.toFixed(2)}ms`);
    
    if (contextMetrics) {
      console.log(`🔊 AudioContext state: ${contextMetrics.state}`);
      console.log(`🔊 Sample rate: ${contextMetrics.sampleRate}Hz`);
      if (contextMetrics.baseLatency !== undefined) {
        console.log(`🔊 Base latency: ${(contextMetrics.baseLatency * 1000).toFixed(2)}ms`);
      }
      if (contextMetrics.outputLatency !== undefined) {
        console.log(`🔊 Output latency: ${(contextMetrics.outputLatency * 1000).toFixed(2)}ms`);
      }
    }

    this.addMetric({
      webViewInitTime: 0,
      audioContextInitTime: duration,
      memoryUsage: this.getMemoryUsage(),
      renderTime: 0,
      messagePassingLatency: 0,
      audioLatency: contextMetrics?.baseLatency ? contextMetrics.baseLatency * 1000 : 0,
      timestamp: performance.now()
    });
  }

  recordMessagePassingLatency(latency: number): void {
    if (latency > 10) { // Only log if latency > 10ms
      console.log(`📨 Message passing latency: ${latency.toFixed(2)}ms`);
    }
    
    this.addMetric({
      webViewInitTime: 0,
      audioContextInitTime: 0,
      memoryUsage: this.getMemoryUsage(),
      renderTime: 0,
      messagePassingLatency: latency,
      audioLatency: 0,
      timestamp: performance.now()
    });
  }

  recordRenderTime(duration: number): void {
    this.addMetric({
      webViewInitTime: 0,
      audioContextInitTime: 0,
      memoryUsage: this.getMemoryUsage(),
      renderTime: duration,
      messagePassingLatency: 0,
      audioLatency: 0,
      timestamp: performance.now()
    });
  }

  private recordMemoryUsage(): void {
    const memoryUsage = this.getMemoryUsage();
    
    // Only record if memory usage is significant
    if (memoryUsage > 0) {
      this.addMetric({
        webViewInitTime: 0,
        audioContextInitTime: 0,
        memoryUsage,
        renderTime: 0,
        messagePassingLatency: 0,
        audioLatency: 0,
        timestamp: performance.now()
      });
    }
  }

  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory bloat
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-50);
    }
  }

  private getMemoryUsage(): number {
    if (typeof (performance as any).memory !== 'undefined') {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  getAverageLatency(): number {
    const latencies = this.metrics
      .filter(m => m.messagePassingLatency > 0)
      .map(m => m.messagePassingLatency);
    
    if (latencies.length === 0) return 0;
    
    return latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  }

  getMemoryTrend(): 'increasing' | 'stable' | 'decreasing' | 'unknown' {
    const memoryMetrics = this.metrics
      .filter(m => m.memoryUsage > 0)
      .slice(-10); // Last 10 memory measurements
    
    if (memoryMetrics.length < 3) return 'unknown';
    
    const first = memoryMetrics[0].memoryUsage;
    const last = memoryMetrics[memoryMetrics.length - 1].memoryUsage;
    const diff = last - first;
    
    if (diff > 5) return 'increasing'; // >5MB increase
    if (diff < -2) return 'decreasing'; // >2MB decrease
    return 'stable';
  }

  generateReport(): void {
    const totalDuration = performance.now() - this.startTime;
    
    const webViewInits = this.metrics.filter(m => m.webViewInitTime > 0);
    const audioInits = this.metrics.filter(m => m.audioContextInitTime > 0);
    const memoryMeasurements = this.metrics.filter(m => m.memoryUsage > 0);
    const renderTimes = this.metrics.filter(m => m.renderTime > 0);
    
    console.log('\n📊 PERFORMANCE REPORT');
    console.log('============================');
    console.log(`📋 Monitoring Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`📊 Total Metrics Collected: ${this.metrics.length}`);
    
    // WebView Performance
    if (webViewInits.length > 0) {
      const avgInit = webViewInits.reduce((sum, m) => sum + m.webViewInitTime, 0) / webViewInits.length;
      console.log(`\n🌐 WebView Performance:`);
      console.log(`   Average Init Time: ${avgInit.toFixed(2)}ms`);
      console.log(`   Init Count: ${webViewInits.length}`);
    }
    
    // Audio Performance
    if (audioInits.length > 0) {
      const avgAudioInit = audioInits.reduce((sum, m) => sum + m.audioContextInitTime, 0) / audioInits.length;
      console.log(`\n🔊 Audio Performance:`);
      console.log(`   Average AudioContext Init: ${avgAudioInit.toFixed(2)}ms`);
      console.log(`   Audio Init Count: ${audioInits.length}`);
    }
    
    // Message Passing
    const avgLatency = this.getAverageLatency();
    if (avgLatency > 0) {
      console.log(`\n📨 Message Passing:`);
      console.log(`   Average Latency: ${avgLatency.toFixed(2)}ms`);
    }
    
    // Memory Usage
    if (memoryMeasurements.length > 0) {
      const currentMemory = memoryMeasurements[memoryMeasurements.length - 1].memoryUsage;
      const maxMemory = Math.max(...memoryMeasurements.map(m => m.memoryUsage));
      const trend = this.getMemoryTrend();
      
      console.log(`\n💾 Memory Usage:`);
      console.log(`   Current: ${currentMemory.toFixed(1)}MB`);
      console.log(`   Peak: ${maxMemory.toFixed(1)}MB`);
      console.log(`   Trend: ${trend}`);
      
      if (trend === 'increasing') {
        console.log('   ⚠️  Memory usage is increasing - possible memory leak');
      }
    }
    
    // Render Performance
    if (renderTimes.length > 0) {
      const avgRender = renderTimes.reduce((sum, m) => sum + m.renderTime, 0) / renderTimes.length;
      console.log(`\n🎨 Render Performance:`);
      console.log(`   Average Render Time: ${avgRender.toFixed(2)}ms`);
    }
    
    // Performance Recommendations
    console.log('\n💡 Recommendations:');
    
    if (avgLatency > 50) {
      console.log('   🔴 High message passing latency - consider optimizing WebView communication');
    }
    
    if (webViewInits.some(m => m.webViewInitTime > 1000)) {
      console.log('   🔴 Slow WebView initialization - consider optimizing HTML/CSS/JS bundle');
    }
    
    if (this.getMemoryTrend() === 'increasing') {
      console.log('   🔴 Memory leak detected - review cleanup code');
    } else if (memoryMeasurements.length > 0) {
      console.log('   ✅ Memory usage appears stable');
    }
    
    if (avgLatency > 0 && avgLatency < 20) {
      console.log('   ✅ Message passing latency within acceptable range');
    }
    
    console.log('============================\n');
  }

  reset(): void {
    this.metrics = [];
    console.log('🔍 PerformanceMonitor: Metrics reset');
  }

  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Create WebView-injectable performance monitoring script
export const createWebViewPerformanceScript = (): string => {
  return `
    // WebView Performance Monitoring
    (function() {
      const startTime = performance.now();
      let messageStartTime = 0;
      
      // Track WebView initialization
      window.addEventListener('load', function() {
        const loadTime = performance.now() - startTime;
        console.log('WebView loaded in', loadTime.toFixed(2), 'ms');
        
        // Send performance data back to React Native
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PERFORMANCE_METRIC',
            metric: 'webview_init',
            value: loadTime,
            timestamp: performance.now()
          }));
        }
      });
      
      // Track AudioContext initialization
      const originalAudioContext = window.AudioContext || window.webkitAudioContext;
      if (originalAudioContext) {
        window.AudioContext = window.webkitAudioContext = function(...args) {
          const contextStartTime = performance.now();
          const context = new originalAudioContext(...args);
          
          const initTime = performance.now() - contextStartTime;
          console.log('AudioContext created in', initTime.toFixed(2), 'ms');
          
          // Send audio context metrics
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PERFORMANCE_METRIC',
              metric: 'audio_context_init',
              value: initTime,
              contextState: context.state,
              sampleRate: context.sampleRate,
              baseLatency: context.baseLatency,
              outputLatency: context.outputLatency,
              timestamp: performance.now()
            }));
          }
          
          return context;
        };
      }
      
      // Track message passing latency
      window.addEventListener('message', function() {
        if (messageStartTime > 0) {
          const latency = performance.now() - messageStartTime;
          if (latency > 5) { // Only report significant latencies
            console.log('Message processing latency:', latency.toFixed(2), 'ms');
            
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PERFORMANCE_METRIC',
                metric: 'message_latency',
                value: latency,
                timestamp: performance.now()
              }));
            }
          }
        }
        messageStartTime = performance.now();
      });
      
      // Memory monitoring (if available)
      if (performance.memory) {
        setInterval(function() {
          const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PERFORMANCE_METRIC',
              metric: 'memory_usage',
              value: memoryMB,
              timestamp: performance.now()
            }));
          }
        }, 10000); // Every 10 seconds
      }
    })();
  `;
};

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// React Native WebView message handler for performance metrics
export const handlePerformanceMessage = (message: string): void => {
  try {
    const data = JSON.parse(message);
    
    if (data.type === 'PERFORMANCE_METRIC') {
      switch (data.metric) {
        case 'webview_init':
          performanceMonitor.recordWebViewInit(data.value);
          break;
        case 'audio_context_init':
          performanceMonitor.recordAudioContextInit(data.value, {
            state: data.contextState,
            sampleRate: data.sampleRate,
            currentTime: 0,
            baseLatency: data.baseLatency,
            outputLatency: data.outputLatency
          });
          break;
        case 'message_latency':
          performanceMonitor.recordMessagePassingLatency(data.value);
          break;
        case 'memory_usage':
          // Memory usage is handled internally
          break;
        default:
          console.log('Unknown performance metric:', data.metric);
      }
    }
  } catch (error) {
    console.warn('Failed to parse performance message:', error);
  }
};