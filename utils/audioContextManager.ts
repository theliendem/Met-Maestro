/**
 * Optimized Audio Context Manager
 * Handles efficient audio context lifecycle, initialization, and cleanup
 */

interface AudioContextConfig {
  sampleRate?: number;
  latencyHint?: 'balanced' | 'interactive' | 'playback';
  minimumBufferSize?: number;
}

interface WebAudioNodes {
  oscillator?: OscillatorNode;
  gainNode?: GainNode;
  compressor?: DynamicsCompressorNode;
}

class AudioContextManager {
  private static instance: AudioContextManager;
  private audioContext: AudioContext | null = null;
  private nodes: WebAudioNodes = {};
  private isInitialized = false;
  private initPromise: Promise<AudioContext> | null = null;
  private resumePromise: Promise<void> | null = null;
  private cleanupTimeout: NodeJS.Timeout | null = null;
  private lastUsed = Date.now();

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  /**
   * Initialize audio context with optimal settings
   */
  async initialize(config: AudioContextConfig = {}): Promise<AudioContext> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return existing context if already initialized
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.resume();
      this.lastUsed = Date.now();
      return this.audioContext;
    }

    this.initPromise = this.createAudioContext(config);
    
    try {
      this.audioContext = await this.initPromise;
      this.isInitialized = true;
      this.lastUsed = Date.now();
      
      // Set up automatic cleanup after 5 minutes of inactivity
      this.scheduleCleanup();
      
      console.log('🔊 AudioContext initialized successfully');
      return this.audioContext;
    } catch (error) {
      console.error('❌ Failed to initialize AudioContext:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Create audio context with optimized settings
   */
  private async createAudioContext(config: AudioContextConfig): Promise<AudioContext> {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    if (!AudioContextClass) {
      throw new Error('AudioContext not supported');
    }

    const contextOptions: AudioContextOptions = {
      sampleRate: config.sampleRate || 44100,
      latencyHint: config.latencyHint || 'interactive'
    };

    const context = new AudioContextClass(contextOptions);
    
    // Resume context if suspended (required by some browsers)
    if (context.state === 'suspended') {
      await context.resume();
    }

    // Create and connect optimized audio processing chain
    await this.setupAudioChain(context);
    
    return context;
  }

  /**
   * Set up optimized audio processing chain
   */
  private async setupAudioChain(context: AudioContext): Promise<void> {
    try {
      // Create compressor for consistent audio levels
      this.nodes.compressor = context.createDynamicsCompressor();
      this.nodes.compressor.threshold.setValueAtTime(-24, context.currentTime);
      this.nodes.compressor.knee.setValueAtTime(30, context.currentTime);
      this.nodes.compressor.ratio.setValueAtTime(6, context.currentTime);
      this.nodes.compressor.attack.setValueAtTime(0.003, context.currentTime);
      this.nodes.compressor.release.setValueAtTime(0.25, context.currentTime);
      
      // Create master gain node
      this.nodes.gainNode = context.createGain();
      this.nodes.gainNode.gain.setValueAtTime(0.8, context.currentTime); // 80% volume
      
      // Connect audio chain: compressor -> gain -> destination
      this.nodes.compressor.connect(this.nodes.gainNode);
      this.nodes.gainNode.connect(context.destination);
      
      console.log('🔊 Audio processing chain set up successfully');
    } catch (error) {
      console.error('❌ Failed to setup audio chain:', error);
      throw error;
    }
  }

  /**
   * Resume audio context (required for user interaction compliance)
   */
  async resume(): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    if (this.audioContext.state === 'running') {
      return;
    }

    // Return existing resume promise if already resuming
    if (this.resumePromise) {
      return this.resumePromise;
    }

    this.resumePromise = this.audioContext.resume();
    
    try {
      await this.resumePromise;
      this.resumePromise = null;
      console.log('🔊 AudioContext resumed');
    } catch (error) {
      this.resumePromise = null;
      console.error('❌ Failed to resume AudioContext:', error);
      throw error;
    }
  }

  /**
   * Create an optimized oscillator for metronome clicks
   */
  createOptimizedOscillator(frequency: number = 800, type: OscillatorType = 'sine'): OscillatorNode {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    this.lastUsed = Date.now();
    
    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;
    
    // Connect to the processing chain
    if (this.nodes.compressor) {
      oscillator.connect(this.nodes.compressor);
    } else {
      // Fallback to direct connection
      oscillator.connect(this.audioContext.destination);
    }
    
    return oscillator;
  }

  /**
   * Create an optimized gain envelope for smooth audio
   */
  createClickEnvelope(oscillator: OscillatorNode, duration: number = 0.1): void {
    if (!this.audioContext) return;

    const gainNode = this.audioContext.createGain();
    const currentTime = this.audioContext.currentTime;
    
    // Disconnect oscillator from processing chain and reconnect through envelope
    oscillator.disconnect();
    oscillator.connect(gainNode);
    
    if (this.nodes.compressor) {
      gainNode.connect(this.nodes.compressor);
    } else {
      gainNode.connect(this.audioContext.destination);
    }
    
    // Create smooth envelope to prevent audio pops
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.8, currentTime + 0.01); // 10ms attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration); // Smooth decay
  }

  /**
   * Get current audio context state and metrics
   */
  getMetrics(): {
    state: string;
    sampleRate: number;
    currentTime: number;
    baseLatency?: number;
    outputLatency?: number;
    isInitialized: boolean;
    lastUsed: number;
  } {
    return {
      state: this.audioContext?.state || 'not-initialized',
      sampleRate: this.audioContext?.sampleRate || 0,
      currentTime: this.audioContext?.currentTime || 0,
      baseLatency: this.audioContext?.baseLatency,
      outputLatency: this.audioContext?.outputLatency,
      isInitialized: this.isInitialized,
      lastUsed: this.lastUsed
    };
  }

  /**
   * Schedule automatic cleanup after inactivity
   */
  private scheduleCleanup(): void {
    // Clear existing cleanup timer
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
    }

    // Schedule cleanup after 5 minutes of inactivity
    this.cleanupTimeout = setTimeout(() => {
      const inactiveTime = Date.now() - this.lastUsed;
      
      if (inactiveTime >= 300000) { // 5 minutes
        console.log('🔊 Cleaning up AudioContext after 5 minutes of inactivity');
        this.cleanup();
      } else {
        // Reschedule if there was recent activity
        this.scheduleCleanup();
      }
    }, 300000); // 5 minutes
  }

  /**
   * Suspend audio context to save battery
   */
  async suspend(): Promise<void> {
    if (!this.audioContext || this.audioContext.state !== 'running') {
      return;
    }

    try {
      await this.audioContext.suspend();
      console.log('🔊 AudioContext suspended for battery saving');
    } catch (error) {
      console.error('❌ Failed to suspend AudioContext:', error);
    }
  }

  /**
   * Clean up audio context and resources
   */
  cleanup(): void {
    console.log('🔊 Cleaning up AudioContextManager');

    // Clear cleanup timer
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }

    // Disconnect and clean up nodes
    Object.values(this.nodes).forEach(node => {
      if (node) {
        try {
          node.disconnect();
        } catch (error) {
          // Ignore disconnection errors
        }
      }
    });
    this.nodes = {};

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (error) {
        console.warn('⚠️ Error closing AudioContext:', error);
      }
    }

    // Reset state
    this.audioContext = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.resumePromise = null;
    
    console.log('🔊 AudioContextManager cleanup complete');
  }

  /**
   * Force cleanup (for component unmount)
   */
  forceCleanup(): void {
    this.cleanup();
  }

  /**
   * Check if audio context is ready for use
   */
  isReady(): boolean {
    return this.isInitialized && 
           this.audioContext !== null && 
           this.audioContext.state === 'running';
  }
}

// WebView-injectable optimized audio context script
export const createOptimizedAudioContextScript = (): string => {
  return `
    // Optimized Audio Context Manager for WebView
    (function() {
      let audioContextManager = null;
      let isInitialized = false;
      
      // Optimized AudioContext initialization
      window.initOptimizedAudioContext = async function() {
        if (isInitialized) return;
        
        const startTime = performance.now();
        
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          
          if (!AudioContextClass) {
            throw new Error('AudioContext not supported');
          }
          
          // Create context with optimized settings
          const context = new AudioContextClass({
            sampleRate: 44100,
            latencyHint: 'interactive'
          });
          
          // Resume if suspended
          if (context.state === 'suspended') {
            await context.resume();
          }
          
          // Set up optimized audio chain
          const compressor = context.createDynamicsCompressor();
          compressor.threshold.setValueAtTime(-24, context.currentTime);
          compressor.knee.setValueAtTime(30, context.currentTime);
          compressor.ratio.setValueAtTime(6, context.currentTime);
          compressor.attack.setValueAtTime(0.003, context.currentTime);
          compressor.release.setValueAtTime(0.25, context.currentTime);
          
          const masterGain = context.createGain();
          masterGain.gain.setValueAtTime(0.8, context.currentTime);
          
          compressor.connect(masterGain);
          masterGain.connect(context.destination);
          
          audioContextManager = {
            context: context,
            compressor: compressor,
            masterGain: masterGain,
            lastUsed: Date.now()
          };
          
          isInitialized = true;
          
          const initTime = performance.now() - startTime;
          console.log('✅ Optimized AudioContext initialized in', initTime.toFixed(2), 'ms');
          
          // Report performance metrics
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
        } catch (error) {
          console.error('❌ Failed to initialize optimized AudioContext:', error);
          throw error;
        }
      };
      
      // Optimized click generation
      window.createOptimizedClick = function(frequency = 800, duration = 0.1) {
        if (!audioContextManager) {
          console.warn('AudioContext not initialized');
          return;
        }
        
        audioContextManager.lastUsed = Date.now();
        
        const { context, compressor } = audioContextManager;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        oscillator.type = 'sine';
        
        // Create smooth envelope
        const currentTime = context.currentTime;
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.8, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(compressor);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration);
        
        return oscillator;
      };
      
      // Cleanup function
      window.cleanupOptimizedAudio = function() {
        if (audioContextManager) {
          console.log('🔊 Cleaning up optimized audio context');
          
          if (audioContextManager.context.state !== 'closed') {
            audioContextManager.context.close();
          }
          
          audioContextManager = null;
          isInitialized = false;
        }
      };
      
      // Auto cleanup after 5 minutes of inactivity
      setInterval(function() {
        if (audioContextManager && Date.now() - audioContextManager.lastUsed > 300000) {
          window.cleanupOptimizedAudio();
        }
      }, 60000); // Check every minute
      
      // Cleanup on page unload
      window.addEventListener('beforeunload', window.cleanupOptimizedAudio);
    })();
  `;
};

// Export singleton instance
export const audioContextManager = AudioContextManager.getInstance();