/**
 * Memory Leak Prevention and Monitoring System
 * Prevents memory leaks in WebView components and monitors memory usage patterns
 */

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  allocatedMemoryMB: number;
}

interface LeakDetectionResult {
  hasLeak: boolean;
  confidence: 'low' | 'medium' | 'high';
  growthRate: number; // MB per minute
  snapshots: MemorySnapshot[];
  recommendations: string[];
}

interface ResourceTracker {
  timers: Set<NodeJS.Timeout | number>;
  intervals: Set<NodeJS.Timeout | number>;
  eventListeners: Map<string, { element: EventTarget; event: string; handler: EventListener }>;
  audioNodes: Set<AudioNode>;
  webViewRefs: Set<any>;
  animationFrames: Set<number>;
}

class MemoryLeakPrevention {
  private static instance: MemoryLeakPrevention;
  private memorySnapshots: MemorySnapshot[] = [];
  private resourceTracker: ResourceTracker = {
    timers: new Set(),
    intervals: new Set(),
    eventListeners: new Map(),
    audioNodes: new Set(),
    webViewRefs: new Set(),
    animationFrames: new Set()
  };
  
  private monitoringInterval: NodeJS.Timeout | null = null;
  private cleanupCallbacks: Set<() => void> = new Set();
  private isMonitoring = false;

  // Configuration
  private readonly MONITORING_INTERVAL = 10000; // 10 seconds
  private readonly MAX_SNAPSHOTS = 50;
  private readonly LEAK_THRESHOLD_MB_PER_MIN = 5; // 5MB growth per minute indicates leak
  private readonly MEMORY_WARNING_THRESHOLD = 100; // 100MB
  private readonly MEMORY_CRITICAL_THRESHOLD = 200; // 200MB

  static getInstance(): MemoryLeakPrevention {
    if (!MemoryLeakPrevention.instance) {
      MemoryLeakPrevention.instance = new MemoryLeakPrevention();
    }
    return MemoryLeakPrevention.instance;
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    console.log('🧠 Starting memory leak prevention monitoring');
    this.isMonitoring = true;

    // Take initial snapshot
    this.takeMemorySnapshot();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.takeMemorySnapshot();
      this.analyzeMemoryTrends();
    }, this.MONITORING_INTERVAL);

    // Set up periodic cleanup
    setInterval(() => {
      this.performRoutineCleanup();
    }, 30000); // Every 30 seconds

    // Set up unload cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.forceCleanup();
      });
    }
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('🧠 Stopping memory leak prevention monitoring');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Track a timer for cleanup
   */
  trackTimer(timerId: NodeJS.Timeout | number): NodeJS.Timeout | number {
    this.resourceTracker.timers.add(timerId);
    return timerId;
  }

  /**
   * Track an interval for cleanup
   */
  trackInterval(intervalId: NodeJS.Timeout | number): NodeJS.Timeout | number {
    this.resourceTracker.intervals.add(intervalId);
    return intervalId;
  }

  /**
   * Track an event listener for cleanup
   */
  trackEventListener(element: EventTarget, event: string, handler: EventListener): string {
    const id = `${Date.now()}_${Math.random()}`;
    this.resourceTracker.eventListeners.set(id, { element, event, handler });
    return id;
  }

  /**
   * Track an audio node for cleanup
   */
  trackAudioNode(node: AudioNode): AudioNode {
    this.resourceTracker.audioNodes.add(node);
    return node;
  }

  /**
   * Track a WebView ref for cleanup
   */
  trackWebViewRef(ref: any): any {
    this.resourceTracker.webViewRefs.add(ref);
    return ref;
  }

  /**
   * Track animation frame for cleanup
   */
  trackAnimationFrame(frameId: number): number {
    this.resourceTracker.animationFrames.add(frameId);
    return frameId;
  }

  /**
   * Clean up a specific timer
   */
  cleanupTimer(timerId: NodeJS.Timeout | number): void {
    clearTimeout(timerId as NodeJS.Timeout);
    this.resourceTracker.timers.delete(timerId);
  }

  /**
   * Clean up a specific interval
   */
  cleanupInterval(intervalId: NodeJS.Timeout | number): void {
    clearInterval(intervalId as NodeJS.Timeout);
    this.resourceTracker.intervals.delete(intervalId);
  }

  /**
   * Clean up a specific event listener
   */
  cleanupEventListener(listenerId: string): void {
    const listener = this.resourceTracker.eventListeners.get(listenerId);
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler);
      this.resourceTracker.eventListeners.delete(listenerId);
    }
  }

  /**
   * Clean up a specific audio node
   */
  cleanupAudioNode(node: AudioNode): void {
    try {
      node.disconnect();
      this.resourceTracker.audioNodes.delete(node);
    } catch (error) {
      console.warn('Error cleaning up audio node:', error);
    }
  }

  /**
   * Add cleanup callback
   */
  addCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * Remove cleanup callback
   */
  removeCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * Take a memory snapshot
   */
  private takeMemorySnapshot(): void {
    let memoryInfo: any = {};
    
    // Try to get memory info from performance API
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      memoryInfo = (performance as any).memory;
    }

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memoryInfo.usedJSHeapSize || 0,
      totalJSHeapSize: memoryInfo.totalJSHeapSize || 0,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit || 0,
      allocatedMemoryMB: (memoryInfo.usedJSHeapSize || 0) / 1024 / 1024
    };

    this.memorySnapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.memorySnapshots.length > this.MAX_SNAPSHOTS) {
      this.memorySnapshots = this.memorySnapshots.slice(-this.MAX_SNAPSHOTS);
    }

    // Log significant memory usage
    if (snapshot.allocatedMemoryMB > this.MEMORY_WARNING_THRESHOLD) {
      console.warn(`🧠 High memory usage: ${snapshot.allocatedMemoryMB.toFixed(1)}MB`);
    }

    if (snapshot.allocatedMemoryMB > this.MEMORY_CRITICAL_THRESHOLD) {
      console.error(`🧠 Critical memory usage: ${snapshot.allocatedMemoryMB.toFixed(1)}MB - forcing cleanup`);
      this.performEmergencyCleanup();
    }
  }

  /**
   * Analyze memory trends for leak detection
   */
  private analyzeMemoryTrends(): void {
    if (this.memorySnapshots.length < 5) return;

    const recentSnapshots = this.memorySnapshots.slice(-10);
    const oldestSnapshot = recentSnapshots[0];
    const newestSnapshot = recentSnapshots[recentSnapshots.length - 1];

    const timeDiffMinutes = (newestSnapshot.timestamp - oldestSnapshot.timestamp) / (1000 * 60);
    const memoryGrowthMB = newestSnapshot.allocatedMemoryMB - oldestSnapshot.allocatedMemoryMB;
    const growthRate = memoryGrowthMB / timeDiffMinutes;

    // Check for potential memory leak
    if (growthRate > this.LEAK_THRESHOLD_MB_PER_MIN) {
      console.warn(`🧠 Potential memory leak detected: ${growthRate.toFixed(2)} MB/min growth rate`);
      this.performRoutineCleanup();
    }
  }

  /**
   * Detect memory leaks with detailed analysis
   */
  detectMemoryLeak(): LeakDetectionResult {
    if (this.memorySnapshots.length < 10) {
      return {
        hasLeak: false,
        confidence: 'low',
        growthRate: 0,
        snapshots: [...this.memorySnapshots],
        recommendations: ['Need more data points for accurate leak detection']
      };
    }

    const recentSnapshots = this.memorySnapshots.slice(-20);
    const oldestSnapshot = recentSnapshots[0];
    const newestSnapshot = recentSnapshots[recentSnapshots.length - 1];

    const timeDiffMinutes = (newestSnapshot.timestamp - oldestSnapshot.timestamp) / (1000 * 60);
    const memoryGrowthMB = newestSnapshot.allocatedMemoryMB - oldestSnapshot.allocatedMemoryMB;
    const growthRate = memoryGrowthMB / timeDiffMinutes;

    // Calculate confidence based on trend consistency
    let consistentGrowthCount = 0;
    for (let i = 1; i < recentSnapshots.length; i++) {
      if (recentSnapshots[i].allocatedMemoryMB > recentSnapshots[i - 1].allocatedMemoryMB) {
        consistentGrowthCount++;
      }
    }
    
    const growthConsistency = consistentGrowthCount / (recentSnapshots.length - 1);
    
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (growthConsistency > 0.8 && growthRate > this.LEAK_THRESHOLD_MB_PER_MIN) {
      confidence = 'high';
    } else if (growthConsistency > 0.6 && growthRate > this.LEAK_THRESHOLD_MB_PER_MIN / 2) {
      confidence = 'medium';
    }

    const recommendations: string[] = [];
    
    if (growthRate > this.LEAK_THRESHOLD_MB_PER_MIN) {
      recommendations.push('Memory growth rate exceeds threshold - investigate for leaks');
    }
    
    if (this.resourceTracker.timers.size > 10) {
      recommendations.push(`${this.resourceTracker.timers.size} active timers - check for uncleared timers`);
    }
    
    if (this.resourceTracker.eventListeners.size > 20) {
      recommendations.push(`${this.resourceTracker.eventListeners.size} event listeners - check for unremoved listeners`);
    }
    
    if (this.resourceTracker.audioNodes.size > 5) {
      recommendations.push(`${this.resourceTracker.audioNodes.size} audio nodes - check for undisconnected nodes`);
    }

    return {
      hasLeak: growthRate > this.LEAK_THRESHOLD_MB_PER_MIN && confidence !== 'low',
      confidence,
      growthRate,
      snapshots: recentSnapshots,
      recommendations
    };
  }

  /**
   * Perform routine cleanup of tracked resources
   */
  private performRoutineCleanup(): void {
    let cleanedResources = 0;

    // Clean up completed timers (this is a simplified approach)
    this.resourceTracker.timers.forEach(timerId => {
      // In a real implementation, you'd need to check if timer is still active
      cleanedResources++;
    });

    // Clean up disconnected audio nodes
    this.resourceTracker.audioNodes.forEach(node => {
      // Check if node is still connected
      try {
        if (node.numberOfOutputs === 0) {
          this.cleanupAudioNode(node);
          cleanedResources++;
        }
      } catch (error) {
        // Node might already be cleaned up
        this.resourceTracker.audioNodes.delete(node);
        cleanedResources++;
      }
    });

    // Clean up invalid WebView refs
    this.resourceTracker.webViewRefs.forEach(ref => {
      if (!ref || !ref.current) {
        this.resourceTracker.webViewRefs.delete(ref);
        cleanedResources++;
      }
    });

    if (cleanedResources > 0) {
      console.log(`🧠 Routine cleanup: removed ${cleanedResources} stale resources`);
    }
  }

  /**
   * Perform emergency cleanup when memory is critical
   */
  private performEmergencyCleanup(): void {
    console.log('🧠 Performing emergency cleanup due to critical memory usage');
    
    // Clear all tracked timers
    this.resourceTracker.timers.forEach(timerId => {
      clearTimeout(timerId as NodeJS.Timeout);
    });
    this.resourceTracker.timers.clear();

    // Clear all tracked intervals
    this.resourceTracker.intervals.forEach(intervalId => {
      clearInterval(intervalId as NodeJS.Timeout);
    });
    this.resourceTracker.intervals.clear();

    // Disconnect all audio nodes
    this.resourceTracker.audioNodes.forEach(node => {
      try {
        node.disconnect();
      } catch (error) {
        // Ignore errors for already disconnected nodes
      }
    });
    this.resourceTracker.audioNodes.clear();

    // Cancel all animation frames
    this.resourceTracker.animationFrames.forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    this.resourceTracker.animationFrames.clear();

    // Trigger custom cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    });

    console.log('🧠 Emergency cleanup completed');
  }

  /**
   * Force complete cleanup (for component unmount)
   */
  forceCleanup(): void {
    console.log('🧠 Forcing complete cleanup');

    this.stopMonitoring();
    this.performEmergencyCleanup();

    // Clear all event listeners
    this.resourceTracker.eventListeners.forEach((listener, id) => {
      this.cleanupEventListener(id);
    });

    this.cleanupCallbacks.clear();
    this.memorySnapshots = [];
  }

  /**
   * Get current resource usage summary
   */
  getResourceSummary(): {
    timers: number;
    intervals: number;
    eventListeners: number;
    audioNodes: number;
    webViewRefs: number;
    animationFrames: number;
    currentMemoryMB: number;
  } {
    const currentSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
    
    return {
      timers: this.resourceTracker.timers.size,
      intervals: this.resourceTracker.intervals.size,
      eventListeners: this.resourceTracker.eventListeners.size,
      audioNodes: this.resourceTracker.audioNodes.size,
      webViewRefs: this.resourceTracker.webViewRefs.size,
      animationFrames: this.resourceTracker.animationFrames.size,
      currentMemoryMB: currentSnapshot?.allocatedMemoryMB || 0
    };
  }

  /**
   * Get memory snapshots for analysis
   */
  getMemorySnapshots(): MemorySnapshot[] {
    return [...this.memorySnapshots];
  }
}

/**
 * WebView-injectable memory leak prevention script
 */
export const createMemoryLeakPreventionScript = (): string => {
  return `
    // Memory Leak Prevention for WebView
    (function() {
      const trackedResources = {
        timers: new Set(),
        intervals: new Set(),
        eventListeners: new Map(),
        animationFrames: new Set()
      };
      
      let memorySnapshots = [];
      let monitoringInterval = null;
      
      // Override timer functions to track resources
      const originalSetTimeout = window.setTimeout;
      const originalSetInterval = window.setInterval;
      const originalClearTimeout = window.clearTimeout;
      const originalClearInterval = window.clearInterval;
      const originalRequestAnimationFrame = window.requestAnimationFrame;
      const originalCancelAnimationFrame = window.cancelAnimationFrame;
      
      window.setTimeout = function(fn, delay, ...args) {
        const id = originalSetTimeout.call(this, fn, delay, ...args);
        trackedResources.timers.add(id);
        return id;
      };
      
      window.setInterval = function(fn, delay, ...args) {
        const id = originalSetInterval.call(this, fn, delay, ...args);
        trackedResources.intervals.add(id);
        return id;
      };
      
      window.clearTimeout = function(id) {
        originalClearTimeout.call(this, id);
        trackedResources.timers.delete(id);
      };
      
      window.clearInterval = function(id) {
        originalClearInterval.call(this, id);
        trackedResources.intervals.delete(id);
      };
      
      window.requestAnimationFrame = function(fn) {
        const id = originalRequestAnimationFrame.call(this, fn);
        trackedResources.animationFrames.add(id);
        return id;
      };
      
      window.cancelAnimationFrame = function(id) {
        originalCancelAnimationFrame.call(this, id);
        trackedResources.animationFrames.delete(id);
      };
      
      // Override addEventListener to track listeners
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
      
      EventTarget.prototype.addEventListener = function(event, handler, options) {
        const listenerId = Math.random().toString(36).substr(2, 9);
        trackedResources.eventListeners.set(listenerId, {
          element: this,
          event: event,
          handler: handler
        });
        
        originalAddEventListener.call(this, event, handler, options);
      };
      
      // Memory monitoring
      function takeMemorySnapshot() {
        const memoryInfo = performance.memory || {};
        const snapshot = {
          timestamp: Date.now(),
          usedJSHeapSize: memoryInfo.usedJSHeapSize || 0,
          totalJSHeapSize: memoryInfo.totalJSHeapSize || 0,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit || 0,
          allocatedMemoryMB: (memoryInfo.usedJSHeapSize || 0) / 1024 / 1024
        };
        
        memorySnapshots.push(snapshot);
        
        // Keep only last 20 snapshots
        if (memorySnapshots.length > 20) {
          memorySnapshots = memorySnapshots.slice(-20);
        }
        
        // Report to React Native
        if (window.ReactNativeWebView && snapshot.allocatedMemoryMB > 0) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MEMORY_SNAPSHOT',
            snapshot: snapshot,
            resourceCounts: {
              timers: trackedResources.timers.size,
              intervals: trackedResources.intervals.size,
              eventListeners: trackedResources.eventListeners.size,
              animationFrames: trackedResources.animationFrames.size
            }
          }));
        }
        
        // Check for critical memory usage
        if (snapshot.allocatedMemoryMB > 100) {
          console.warn('🧠 WebView: High memory usage:', snapshot.allocatedMemoryMB.toFixed(1), 'MB');
          performEmergencyCleanup();
        }
      }
      
      function performEmergencyCleanup() {
        console.log('🧠 WebView: Performing emergency cleanup');
        
        // Clear all tracked timers
        trackedResources.timers.forEach(id => originalClearTimeout(id));
        trackedResources.timers.clear();
        
        // Clear all tracked intervals
        trackedResources.intervals.forEach(id => originalClearInterval(id));
        trackedResources.intervals.clear();
        
        // Cancel all animation frames
        trackedResources.animationFrames.forEach(id => originalCancelAnimationFrame(id));
        trackedResources.animationFrames.clear();
        
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
      }
      
      // Start monitoring
      function startMemoryMonitoring() {
        if (monitoringInterval) return;
        
        takeMemorySnapshot(); // Initial snapshot
        
        monitoringInterval = originalSetInterval(() => {
          takeMemorySnapshot();
        }, 10000); // Every 10 seconds
        
        console.log('🧠 WebView: Memory monitoring started');
      }
      
      function stopMemoryMonitoring() {
        if (monitoringInterval) {
          originalClearInterval(monitoringInterval);
          monitoringInterval = null;
        }
      }
      
      // Cleanup on page unload
      window.addEventListener('beforeunload', function() {
        performEmergencyCleanup();
        stopMemoryMonitoring();
      });
      
      // Initialize monitoring
      startMemoryMonitoring();
      
      // Expose cleanup function
      window.performWebViewCleanup = performEmergencyCleanup;
      
      console.log('🧠 WebView memory leak prevention initialized');
    })();
  `;
};

// Export singleton instance
export const memoryLeakPrevention = MemoryLeakPrevention.getInstance();