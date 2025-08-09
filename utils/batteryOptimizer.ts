/**
 * Battery Optimization Utility
 * Manages power-efficient operation of WebView components and audio contexts
 */

interface PowerState {
  isActive: boolean;
  lastActivity: number;
  backgroundMode: boolean;
  audioContextSuspended: boolean;
  timersSuspended: boolean;
  renderingPaused: boolean;
}

interface BatteryInfo {
  level?: number;
  charging?: boolean;
  chargingTime?: number;
  dischargingTime?: number;
}

class BatteryOptimizer {
  private static instance: BatteryOptimizer;
  private powerState: PowerState = {
    isActive: true,
    lastActivity: Date.now(),
    backgroundMode: false,
    audioContextSuspended: false,
    timersSuspended: false,
    renderingPaused: false
  };
  
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private batteryInfo: BatteryInfo = {};
  private suspendedTimers: Set<NodeJS.Timeout> = new Set();
  private onBackgroundCallbacks: Set<() => void> = new Set();
  private onForegroundCallbacks: Set<() => void> = new Set();
  private onLowBatteryCallbacks: Set<(level: number) => void> = new Set();

  // Configuration
  private readonly INACTIVITY_SUSPEND_DELAY = 30000; // 30 seconds
  private readonly LOW_BATTERY_THRESHOLD = 0.2; // 20%
  private readonly CRITICAL_BATTERY_THRESHOLD = 0.1; // 10%

  static getInstance(): BatteryOptimizer {
    if (!BatteryOptimizer.instance) {
      BatteryOptimizer.instance = new BatteryOptimizer();
    }
    return BatteryOptimizer.instance;
  }

  /**
   * Initialize battery optimization monitoring
   */
  async initialize(): Promise<void> {
    console.log('🔋 Initializing battery optimizer');

    // Set up activity tracking
    this.setupActivityTracking();
    
    // Set up app state change detection
    this.setupAppStateTracking();
    
    // Initialize battery API monitoring if available
    await this.initializeBatteryAPI();
    
    // Set up inactivity monitoring
    this.startInactivityMonitoring();

    console.log('🔋 Battery optimizer initialized');
  }

  /**
   * Register callback for background mode
   */
  onBackground(callback: () => void): void {
    this.onBackgroundCallbacks.add(callback);
  }

  /**
   * Register callback for foreground mode
   */
  onForeground(callback: () => void): void {
    this.onForegroundCallbacks.add(callback);
  }

  /**
   * Register callback for low battery
   */
  onLowBattery(callback: (level: number) => void): void {
    this.onLowBatteryCallbacks.add(callback);
  }

  /**
   * Record user activity to reset inactivity timer
   */
  recordActivity(): void {
    this.powerState.lastActivity = Date.now();
    this.powerState.isActive = true;

    // Resume suspended operations if needed
    if (this.powerState.audioContextSuspended || this.powerState.timersSuspended) {
      this.resumeOperations();
    }

    this.restartInactivityMonitoring();
  }

  /**
   * Manually suspend operations for battery saving
   */
  suspendOperations(): void {
    if (this.powerState.audioContextSuspended && this.powerState.timersSuspended) {
      return; // Already suspended
    }

    console.log('🔋 Suspending operations for battery optimization');

    // Suspend audio context
    this.suspendAudioContext();
    
    // Suspend non-critical timers
    this.suspendTimers();
    
    // Pause rendering updates
    this.pauseRendering();

    this.powerState.isActive = false;
  }

  /**
   * Resume operations from suspended state
   */
  resumeOperations(): void {
    if (!this.powerState.audioContextSuspended && !this.powerState.timersSuspended) {
      return; // Not suspended
    }

    console.log('🔋 Resuming operations from battery optimization');

    // Resume audio context
    this.resumeAudioContext();
    
    // Resume timers
    this.resumeTimers();
    
    // Resume rendering
    this.resumeRendering();

    this.powerState.isActive = true;
  }

  /**
   * Enter background mode for maximum battery savings
   */
  enterBackgroundMode(): void {
    if (this.powerState.backgroundMode) return;

    console.log('🔋 Entering background mode');
    this.powerState.backgroundMode = true;

    // Suspend all operations
    this.suspendOperations();
    
    // Notify callbacks
    this.onBackgroundCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in background callback:', error);
      }
    });
  }

  /**
   * Exit background mode and resume normal operation
   */
  exitBackgroundMode(): void {
    if (!this.powerState.backgroundMode) return;

    console.log('🔋 Exiting background mode');
    this.powerState.backgroundMode = false;

    // Resume operations
    this.resumeOperations();
    
    // Notify callbacks
    this.onForegroundCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in foreground callback:', error);
      }
    });

    this.recordActivity();
  }

  /**
   * Get current power optimization state
   */
  getPowerState(): PowerState {
    return { ...this.powerState };
  }

  /**
   * Get battery information
   */
  getBatteryInfo(): BatteryInfo {
    return { ...this.batteryInfo };
  }

  /**
   * Check if operations should be optimized based on battery level
   */
  shouldOptimizeForBattery(): boolean {
    const { level, charging } = this.batteryInfo;
    
    // If charging, don't optimize aggressively
    if (charging) return false;
    
    // If battery level is unknown, be conservative
    if (level === undefined) return true;
    
    // Optimize if battery is low
    return level < this.LOW_BATTERY_THRESHOLD;
  }

  /**
   * Check if we're in critical battery mode
   */
  isCriticalBattery(): boolean {
    const { level, charging } = this.batteryInfo;
    return !charging && level !== undefined && level < this.CRITICAL_BATTERY_THRESHOLD;
  }

  /**
   * Set up activity tracking
   */
  private setupActivityTracking(): void {
    // This would be implemented differently in WebView vs React Native
    // For now, we'll provide the interface and let components call recordActivity()
  }

  /**
   * Set up app state change detection
   */
  private setupAppStateTracking(): void {
    // In React Native, this would use AppState
    // In WebView, this would use visibility API
    
    // WebView visibility API support
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.enterBackgroundMode();
        } else {
          this.exitBackgroundMode();
        }
      });
    }
  }

  /**
   * Initialize Battery API monitoring if available
   */
  private async initializeBatteryAPI(): Promise<void> {
    try {
      // Battery API is deprecated but still works in some browsers
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        
        this.batteryInfo = {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };

        // Set up battery event listeners
        battery.addEventListener('levelchange', () => {
          this.batteryInfo.level = battery.level;
          this.checkBatteryLevel();
        });

        battery.addEventListener('chargingchange', () => {
          this.batteryInfo.charging = battery.charging;
        });

        console.log(`🔋 Battery API initialized - Level: ${(battery.level * 100).toFixed(1)}%, Charging: ${battery.charging}`);
      }
    } catch (error) {
      console.warn('🔋 Battery API not available or failed to initialize:', error);
    }
  }

  /**
   * Check battery level and trigger optimizations
   */
  private checkBatteryLevel(): void {
    const { level, charging } = this.batteryInfo;
    
    if (level === undefined) return;

    // Trigger low battery callbacks
    if (!charging && level < this.LOW_BATTERY_THRESHOLD) {
      this.onLowBatteryCallbacks.forEach(callback => {
        try {
          callback(level);
        } catch (error) {
          console.error('Error in low battery callback:', error);
        }
      });
    }

    // Auto-suspend if critical battery
    if (this.isCriticalBattery() && this.powerState.isActive) {
      console.log('🔋 Critical battery level detected, suspending operations');
      this.suspendOperations();
    }
  }

  /**
   * Start inactivity monitoring
   */
  private startInactivityMonitoring(): void {
    this.inactivityTimeout = setTimeout(() => {
      console.log('🔋 Inactivity timeout reached, suspending operations');
      this.suspendOperations();
    }, this.INACTIVITY_SUSPEND_DELAY);
  }

  /**
   * Restart inactivity monitoring
   */
  private restartInactivityMonitoring(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    this.startInactivityMonitoring();
  }

  /**
   * Suspend audio context for battery saving
   */
  private suspendAudioContext(): void {
    if (this.powerState.audioContextSuspended) return;

    // This would integrate with the audio context manager
    // For now, we'll just mark the state
    this.powerState.audioContextSuspended = true;
    
    // Send message to WebView to suspend audio
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'SUSPEND_AUDIO_CONTEXT'
      }));
    }
  }

  /**
   * Resume audio context from suspended state
   */
  private resumeAudioContext(): void {
    if (!this.powerState.audioContextSuspended) return;

    this.powerState.audioContextSuspended = false;
    
    // Send message to WebView to resume audio
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'RESUME_AUDIO_CONTEXT'
      }));
    }
  }

  /**
   * Suspend non-critical timers
   */
  private suspendTimers(): void {
    this.powerState.timersSuspended = true;
    // Implementation would depend on specific timers to manage
  }

  /**
   * Resume suspended timers
   */
  private resumeTimers(): void {
    this.powerState.timersSuspended = false;
    // Implementation would depend on specific timers to manage
  }

  /**
   * Pause rendering updates
   */
  private pauseRendering(): void {
    this.powerState.renderingPaused = true;
    
    // Send message to WebView to pause rendering
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'PAUSE_RENDERING'
      }));
    }
  }

  /**
   * Resume rendering updates
   */
  private resumeRendering(): void {
    this.powerState.renderingPaused = false;
    
    // Send message to WebView to resume rendering
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'RESUME_RENDERING'
      }));
    }
  }

  /**
   * Cleanup and prepare for app termination
   */
  cleanup(): void {
    console.log('🔋 Cleaning up battery optimizer');

    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }

    // Clear callbacks
    this.onBackgroundCallbacks.clear();
    this.onForegroundCallbacks.clear();
    this.onLowBatteryCallbacks.clear();

    // Ensure operations are suspended for clean shutdown
    this.suspendOperations();
  }
}

/**
 * WebView-injectable battery optimization script
 */
export const createBatteryOptimizationScript = (): string => {
  return `
    // Battery Optimization for WebView
    (function() {
      let isBackgroundMode = false;
      let audioContextSuspended = false;
      let renderingPaused = false;
      let animationFrameId = null;
      let suspendedIntervals = new Set();
      let suspendedTimeouts = new Set();
      
      // Track user activity
      let lastActivity = Date.now();
      const INACTIVITY_TIMEOUT = 30000; // 30 seconds
      let inactivityTimer = null;
      
      // Activity tracking
      ['touchstart', 'touchend', 'click', 'keydown'].forEach(eventType => {
        document.addEventListener(eventType, recordActivity, { passive: true });
      });
      
      function recordActivity() {
        lastActivity = Date.now();
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
        
        // Resume if suspended due to inactivity
        if (audioContextSuspended || renderingPaused) {
          resumeOperations();
        }
        
        startInactivityTimer();
        
        // Notify React Native
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'USER_ACTIVITY',
            timestamp: lastActivity
          }));
        }
      }
      
      function startInactivityTimer() {
        inactivityTimer = setTimeout(() => {
          console.log('🔋 WebView: Inactivity timeout, suspending operations');
          suspendOperations();
        }, INACTIVITY_TIMEOUT);
      }
      
      // Visibility API for background detection
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          enterBackgroundMode();
        } else {
          exitBackgroundMode();
        }
      });
      
      // Battery optimization functions
      function enterBackgroundMode() {
        if (isBackgroundMode) return;
        
        console.log('🔋 WebView: Entering background mode');
        isBackgroundMode = true;
        suspendOperations();
      }
      
      function exitBackgroundMode() {
        if (!isBackgroundMode) return;
        
        console.log('🔋 WebView: Exiting background mode');
        isBackgroundMode = false;
        resumeOperations();
        recordActivity();
      }
      
      function suspendOperations() {
        suspendAudioContext();
        pauseRendering();
        suspendTimers();
      }
      
      function resumeOperations() {
        resumeAudioContext();
        resumeRendering();
        resumeTimers();
      }
      
      function suspendAudioContext() {
        if (audioContextSuspended) return;
        
        audioContextSuspended = true;
        
        // Suspend existing audio context
        if (window.audioContext && window.audioContext.state === 'running') {
          window.audioContext.suspend().then(() => {
            console.log('🔋 WebView: AudioContext suspended');
          }).catch(error => {
            console.warn('Failed to suspend AudioContext:', error);
          });
        }
      }
      
      function resumeAudioContext() {
        if (!audioContextSuspended) return;
        
        audioContextSuspended = false;
        
        // Resume audio context
        if (window.audioContext && window.audioContext.state === 'suspended') {
          window.audioContext.resume().then(() => {
            console.log('🔋 WebView: AudioContext resumed');
          }).catch(error => {
            console.warn('Failed to resume AudioContext:', error);
          });
        }
      }
      
      function pauseRendering() {
        if (renderingPaused) return;
        
        renderingPaused = true;
        
        // Cancel animation frames
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        
        // Pause any CSS animations
        document.querySelectorAll('*').forEach(element => {
          const style = element.style;
          if (style.animationPlayState !== 'paused') {
            element.dataset.wasAnimating = 'true';
            style.animationPlayState = 'paused';
          }
        });
        
        console.log('🔋 WebView: Rendering paused');
      }
      
      function resumeRendering() {
        if (!renderingPaused) return;
        
        renderingPaused = false;
        
        // Resume CSS animations
        document.querySelectorAll('[data-was-animating]').forEach(element => {
          element.style.animationPlayState = 'running';
          delete element.dataset.wasAnimating;
        });
        
        console.log('🔋 WebView: Rendering resumed');
      }
      
      function suspendTimers() {
        // This is a simplified version - in practice you'd need to track specific timers
        console.log('🔋 WebView: Non-critical timers suspended');
      }
      
      function resumeTimers() {
        console.log('🔋 WebView: Timers resumed');
      }
      
      // Handle messages from React Native
      window.addEventListener('message', function(event) {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'SUSPEND_AUDIO_CONTEXT':
              suspendAudioContext();
              break;
            case 'RESUME_AUDIO_CONTEXT':
              resumeAudioContext();
              break;
            case 'PAUSE_RENDERING':
              pauseRendering();
              break;
            case 'RESUME_RENDERING':
              resumeRendering();
              break;
            case 'ENTER_BACKGROUND':
              enterBackgroundMode();
              break;
            case 'EXIT_BACKGROUND':
              exitBackgroundMode();
              break;
          }
        } catch (error) {
          console.warn('Error processing battery optimization message:', error);
        }
      });
      
      // Initialize
      startInactivityTimer();
      
      // Cleanup on unload
      window.addEventListener('beforeunload', function() {
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
        suspendOperations();
      });
      
      console.log('🔋 WebView battery optimization initialized');
    })();
  `;
};

// Export singleton instance
export const batteryOptimizer = BatteryOptimizer.getInstance();