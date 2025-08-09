/**
 * Performance Integration Utility
 * Integrates all performance optimization systems into a cohesive solution
 */

import React from 'react';
import { performanceMonitor, createWebViewPerformanceScript, handlePerformanceMessage } from './performanceMonitor';
import { audioContextManager, createOptimizedAudioContextScript } from './audioContextManager';
import { messageOptimizer, createOptimizedMessageHandlingScript, setupMetronomeMessageHandlers } from './messagePassingOptimizer';
import { batteryOptimizer, createBatteryOptimizationScript } from './batteryOptimizer';
import { memoryLeakPrevention, createMemoryLeakPreventionScript } from './memoryLeakPrevention';
import { performanceBenchmarks } from './performanceBenchmarks';

interface PerformanceConfig {
  enableMonitoring?: boolean;
  enableBatteryOptimization?: boolean;
  enableMemoryLeakPrevention?: boolean;
  enableMessageOptimization?: boolean;
  enableAudioOptimization?: boolean;
  enableBenchmarking?: boolean;
}

interface PerformanceStatus {
  isMonitoring: boolean;
  memoryUsage: number;
  batteryOptimized: boolean;
  audioContextReady: boolean;
  messageLatency: number;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

class PerformanceIntegration {
  private static instance: PerformanceIntegration;
  private isInitialized = false;
  private config: PerformanceConfig = {};
  private webViewRef: any = null;

  static getInstance(): PerformanceIntegration {
    if (!PerformanceIntegration.instance) {
      PerformanceIntegration.instance = new PerformanceIntegration();
    }
    return PerformanceIntegration.instance;
  }

  /**
   * Initialize all performance optimization systems
   */
  async initialize(config: PerformanceConfig = {}): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Performance Optimization Suite');
    
    this.config = {
      enableMonitoring: true,
      enableBatteryOptimization: true,
      enableMemoryLeakPrevention: true,
      enableMessageOptimization: true,
      enableAudioOptimization: true,
      enableBenchmarking: false, // Disabled by default in production
      ...config
    };

    // Initialize performance monitoring
    if (this.config.enableMonitoring) {
      performanceMonitor.startMonitoring();
    }

    // Initialize battery optimization
    if (this.config.enableBatteryOptimization) {
      await batteryOptimizer.initialize();
      
      // Set up battery optimization callbacks
      batteryOptimizer.onLowBattery((level) => {
        console.log(`🔋 Low battery detected (${(level * 100).toFixed(1)}%) - enabling power saving`);
        this.enablePowerSavingMode();
      });
    }

    // Initialize memory leak prevention
    if (this.config.enableMemoryLeakPrevention) {
      memoryLeakPrevention.startMonitoring();
      
      // Set up cleanup callback
      memoryLeakPrevention.addCleanupCallback(() => {
        this.performEmergencyCleanup();
      });
    }

    // Initialize audio context manager
    if (this.config.enableAudioOptimization) {
      // Audio context will be initialized on demand
      console.log('🔊 Audio optimization ready');
    }

    // Initialize message passing optimization
    if (this.config.enableMessageOptimization) {
      // Message optimizer will be configured when WebView ref is set
      console.log('📨 Message optimization ready');
    }

    // Initialize benchmarking (if enabled)
    if (this.config.enableBenchmarking) {
      performanceBenchmarks.startMonitoring();
    }

    this.isInitialized = true;
    console.log('✅ Performance Optimization Suite initialized');
  }

  /**
   * Set WebView reference and configure optimizations
   */
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    
    // Configure message optimizer
    if (this.config.enableMessageOptimization) {
      messageOptimizer.setWebViewRef(ref);
      
      // Set up standard metronome message handlers
      setupMetronomeMessageHandlers(messageOptimizer, {
        onBeat: (beat, measure) => {
          // Handle beat updates efficiently
        },
        onPlayStateChange: (isPlaying) => {
          if (isPlaying) {
            batteryOptimizer.recordActivity();
          }
        },
        onTempoChange: (tempo) => {
          // Handle tempo changes
        }
      });
    }

    console.log('📱 WebView reference configured for optimizations');
  }

  /**
   * Generate optimized WebView HTML with all performance enhancements
   */
  generateOptimizedWebViewHTML(baseHTML: string): string {
    let optimizedHTML = baseHTML;

    // Inject performance monitoring script
    if (this.config.enableMonitoring) {
      const performanceScript = createWebViewPerformanceScript();
      optimizedHTML = optimizedHTML.replace('</head>', `
        <script>
          ${performanceScript}
        </script>
      </head>`);
    }

    // Inject audio optimization script
    if (this.config.enableAudioOptimization) {
      const audioScript = createOptimizedAudioContextScript();
      optimizedHTML = optimizedHTML.replace('</head>', `
        <script>
          ${audioScript}
        </script>
      </head>`);
    }

    // Inject message optimization script
    if (this.config.enableMessageOptimization) {
      const messageScript = createOptimizedMessageHandlingScript();
      optimizedHTML = optimizedHTML.replace('</head>', `
        <script>
          ${messageScript}
        </script>
      </head>`);
    }

    // Inject battery optimization script
    if (this.config.enableBatteryOptimization) {
      const batteryScript = createBatteryOptimizationScript();
      optimizedHTML = optimizedHTML.replace('</head>', `
        <script>
          ${batteryScript}
        </script>
      </head>`);
    }

    // Inject memory leak prevention script
    if (this.config.enableMemoryLeakPrevention) {
      const memoryScript = createMemoryLeakPreventionScript();
      optimizedHTML = optimizedHTML.replace('</head>', `
        <script>
          ${memoryScript}
        </script>
      </head>`);
    }

    // Add optimized CSS for better rendering
    optimizedHTML = optimizedHTML.replace('</head>', `
      <style>
        /* Performance optimizations */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Use GPU acceleration for animations */
        .tempo-bar, .beat-indicator, .play-button {
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        /* Optimize for 60fps animations */
        .tempo-bar .beat-indicator.active {
          will-change: background-color;
        }
        
        /* Reduce layout thrashing */
        .container {
          contain: layout style paint;
        }
        
        /* Optimize button interactions */
        button, .clickable {
          cursor: pointer;
          touch-action: manipulation;
        }
      </style>
    </head>`);

    return optimizedHTML;
  }

  /**
   * Handle messages from WebView with performance optimizations
   */
  handleWebViewMessage(message: string): void {
    // Process performance metrics
    handlePerformanceMessage(message);
    
    // Process through optimized message handler
    if (this.config.enableMessageOptimization) {
      messageOptimizer.processIncomingMessage(message);
    }
    
    // Handle memory snapshots
    try {
      const data = JSON.parse(message);
      if (data.type === 'MEMORY_SNAPSHOT' && this.config.enableMemoryLeakPrevention) {
        const { snapshot, resourceCounts } = data;
        console.log(`🧠 Memory: ${snapshot.allocatedMemoryMB.toFixed(1)}MB, Resources: ${JSON.stringify(resourceCounts)}`);
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }

  /**
   * Send optimized message to WebView
   */
  sendToWebView(type: string, data: any, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    if (this.config.enableMessageOptimization) {
      messageOptimizer.sendToWebView(type, data, priority);
    } else if (this.webViewRef) {
      // Fallback to direct sending
      this.webViewRef.postMessage(JSON.stringify({ type, data }));
    }
  }

  /**
   * Enable power saving mode
   */
  enablePowerSavingMode(): void {
    console.log('🔋 Enabling power saving mode');
    
    // Suspend audio context if not actively playing
    batteryOptimizer.suspendOperations();
    
    // Reduce message passing frequency
    if (this.config.enableMessageOptimization) {
      messageOptimizer.clear(); // Clear pending non-critical messages
    }
    
    // Send power saving signal to WebView
    this.sendToWebView('ENABLE_POWER_SAVING', {}, 'high');
  }

  /**
   * Disable power saving mode
   */
  disablePowerSavingMode(): void {
    console.log('🔋 Disabling power saving mode');
    
    batteryOptimizer.resumeOperations();
    this.sendToWebView('DISABLE_POWER_SAVING', {}, 'high');
  }

  /**
   * Perform emergency cleanup
   */
  performEmergencyCleanup(): void {
    console.log('🚨 Performing emergency performance cleanup');
    
    // Cleanup audio resources
    audioContextManager.forceCleanup();
    
    // Clear message queue
    messageOptimizer.clear();
    
    // Force memory cleanup
    memoryLeakPrevention.forceCleanup();
    
    // Send cleanup signal to WebView
    this.sendToWebView('EMERGENCY_CLEANUP', {}, 'high');
  }

  /**
   * Run performance benchmark
   */
  async runBenchmark(): Promise<any> {
    if (!this.config.enableBenchmarking) {
      console.warn('Benchmarking is disabled');
      return null;
    }
    
    console.log('📊 Running performance benchmark...');
    return await performanceBenchmarks.runBenchmarkSuite();
  }

  /**
   * Get current performance status
   */
  getPerformanceStatus(): PerformanceStatus {
    const memoryInfo = memoryLeakPrevention.getResourceSummary();
    const audioMetrics = audioContextManager.getMetrics();
    const messageMetrics = messageOptimizer.getMetrics();
    
    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    
    if (memoryInfo.currentMemoryMB > 200 || messageMetrics.queueSize > 50) {
      overallHealth = 'poor';
    } else if (memoryInfo.currentMemoryMB > 100 || messageMetrics.queueSize > 20) {
      overallHealth = 'fair';
    } else if (memoryInfo.currentMemoryMB > 50 || messageMetrics.queueSize > 10) {
      overallHealth = 'good';
    }
    
    return {
      isMonitoring: this.config.enableMonitoring || false,
      memoryUsage: memoryInfo.currentMemoryMB,
      batteryOptimized: batteryOptimizer.getPowerState().backgroundMode,
      audioContextReady: audioMetrics.isInitialized,
      messageLatency: messageOptimizer.getAverageLatency(),
      overallHealth
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(): string {
    const status = this.getPerformanceStatus();
    const memoryInfo = memoryLeakPrevention.getResourceSummary();
    const batteryInfo = batteryOptimizer.getBatteryInfo();
    
    return `
# Met Maestro Performance Report

**Generated:** ${new Date().toISOString()}
**Overall Health:** ${status.overallHealth.toUpperCase()}

## System Status
- **Memory Usage:** ${status.memoryUsage.toFixed(1)}MB
- **Battery Level:** ${batteryInfo.level ? `${(batteryInfo.level * 100).toFixed(1)}%` : 'Unknown'}
- **Charging:** ${batteryInfo.charging ? 'Yes' : 'No'}
- **Audio Context:** ${status.audioContextReady ? 'Ready' : 'Not Ready'}
- **Message Latency:** ${status.messageLatency.toFixed(2)}ms

## Resource Usage
- **Active Timers:** ${memoryInfo.timers}
- **Event Listeners:** ${memoryInfo.eventListeners}
- **Audio Nodes:** ${memoryInfo.audioNodes}
- **Animation Frames:** ${memoryInfo.animationFrames}

## Optimization Status
- **Monitoring:** ${status.isMonitoring ? 'Active' : 'Inactive'}
- **Battery Optimization:** ${status.batteryOptimized ? 'Active' : 'Inactive'}
- **Memory Leak Prevention:** ${this.config.enableMemoryLeakPrevention ? 'Active' : 'Inactive'}
- **Message Optimization:** ${this.config.enableMessageOptimization ? 'Active' : 'Inactive'}

## Recommendations
${status.overallHealth === 'poor' ? '- Critical: System performance is degraded - consider restarting' : ''}
${status.memoryUsage > 100 ? '- Warning: High memory usage detected' : ''}
${status.messageLatency > 50 ? '- Warning: High message latency detected' : ''}
${status.overallHealth === 'excellent' ? '- All systems operating optimally' : ''}
`;
  }

  /**
   * Cleanup all performance optimization systems
   */
  cleanup(): void {
    console.log('🧹 Cleaning up performance optimization suite');
    
    performanceMonitor.stopMonitoring();
    batteryOptimizer.cleanup();
    memoryLeakPrevention.forceCleanup();
    audioContextManager.forceCleanup();
    messageOptimizer.clear();
    performanceBenchmarks.stopMonitoring();
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const performanceIntegration = PerformanceIntegration.getInstance();

// Convenience function for easy integration
export const initializePerformanceOptimizations = async (config?: PerformanceConfig) => {
  return await performanceIntegration.initialize(config);
};

// React hook for performance status
export const usePerformanceStatus = () => {
  const [status, setStatus] = React.useState<PerformanceStatus | null>(null);
  
  React.useEffect(() => {
    const updateStatus = () => {
      setStatus(performanceIntegration.getPerformanceStatus());
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return status;
};