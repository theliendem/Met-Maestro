/**
 * Optimized Message Passing System
 * Efficient communication between React Native and WebView with batching and throttling
 */

interface QueuedMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
}

interface MessageBatch {
  messages: QueuedMessage[];
  timestamp: number;
}

interface MessageHandler {
  type: string;
  handler: (data: any, messageId: string) => void | Promise<void>;
  throttle?: number; // ms between executions
}

class MessagePassingOptimizer {
  private static instance: MessagePassingOptimizer;
  private messageQueue: QueuedMessage[] = [];
  private handlers: Map<string, MessageHandler> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private throttleTimers: Map<string, number> = new Map();
  private messageHistory: Map<string, number> = new Map();
  private isProcessing = false;
  private webViewRef: any = null;

  // Configuration
  private readonly BATCH_DELAY = 16; // ~60fps batching
  private readonly MAX_BATCH_SIZE = 10;
  private readonly MESSAGE_HISTORY_SIZE = 100;
  private readonly HIGH_PRIORITY_IMMEDIATE = true;

  static getInstance(): MessagePassingOptimizer {
    if (!MessagePassingOptimizer.instance) {
      MessagePassingOptimizer.instance = new MessagePassingOptimizer();
    }
    return MessagePassingOptimizer.instance;
  }

  /**
   * Set the WebView reference for sending messages
   */
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
  }

  /**
   * Register a message handler with optional throttling
   */
  registerHandler(type: string, handler: (data: any, messageId: string) => void | Promise<void>, throttle?: number): void {
    this.handlers.set(type, { type, handler, throttle });
  }

  /**
   * Unregister a message handler
   */
  unregisterHandler(type: string): void {
    this.handlers.delete(type);
    this.throttleTimers.delete(type);
  }

  /**
   * Send message to WebView with optimizations
   */
  sendToWebView(type: string, data: any, priority: 'high' | 'medium' | 'low' = 'medium'): string {
    const messageId = this.generateMessageId();
    const message: QueuedMessage = {
      id: messageId,
      type,
      data,
      timestamp: performance.now(),
      priority
    };

    // High priority messages are sent immediately
    if (priority === 'high' && this.HIGH_PRIORITY_IMMEDIATE) {
      this.sendImmediately(message);
      return messageId;
    }

    // Add to queue for batching
    this.messageQueue.push(message);
    this.scheduleBatch();

    return messageId;
  }

  /**
   * Process incoming message from WebView
   */
  async processIncomingMessage(message: string): Promise<void> {
    const startTime = performance.now();

    try {
      let parsedMessage;
      
      // Try to parse as batch first
      try {
        parsedMessage = JSON.parse(message);
      } catch (error) {
        console.warn('Failed to parse incoming message:', error);
        return;
      }

      // Handle batch messages
      if (parsedMessage.batch && Array.isArray(parsedMessage.messages)) {
        await this.processBatch(parsedMessage as MessageBatch);
      } else {
        // Handle single message
        await this.processSingleMessage(parsedMessage);
      }

      // Track processing performance
      const processingTime = performance.now() - startTime;
      if (processingTime > 10) {
        console.log(`📨 Message processing took ${processingTime.toFixed(2)}ms`);
      }

    } catch (error) {
      console.error('❌ Error processing incoming message:', error);
    }
  }

  /**
   * Process a batch of messages
   */
  private async processBatch(batch: MessageBatch): Promise<void> {
    console.log(`📦 Processing message batch with ${batch.messages.length} messages`);
    
    // Sort by priority and timestamp
    const sortedMessages = batch.messages.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    // Process messages with throttling
    for (const message of sortedMessages) {
      await this.processSingleMessage(message);
    }
  }

  /**
   * Process a single message with throttling
   */
  private async processSingleMessage(message: any): Promise<void> {
    const handler = this.handlers.get(message.type);
    
    if (!handler) {
      console.warn(`No handler registered for message type: ${message.type}`);
      return;
    }

    // Check throttling
    if (handler.throttle && this.isThrottled(message.type, handler.throttle)) {
      return;
    }

    // Update throttle timer
    if (handler.throttle) {
      this.throttleTimers.set(message.type, performance.now());
    }

    try {
      await handler.handler(message.data, message.id);
    } catch (error) {
      console.error(`❌ Error in message handler for ${message.type}:`, error);
    }
  }

  /**
   * Check if message type is currently throttled
   */
  private isThrottled(messageType: string, throttleMs: number): boolean {
    const lastExecution = this.throttleTimers.get(messageType);
    if (!lastExecution) return false;
    
    return (performance.now() - lastExecution) < throttleMs;
  }

  /**
   * Send message immediately (for high priority)
   */
  private sendImmediately(message: QueuedMessage): void {
    if (!this.webViewRef) {
      console.warn('WebView ref not set, cannot send message');
      return;
    }

    try {
      const messageString = JSON.stringify(message);
      this.webViewRef.postMessage(messageString);
      this.addToHistory(message.id);
    } catch (error) {
      console.error('❌ Error sending immediate message:', error);
    }
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatch(): void {
    if (this.batchTimeout) return; // Already scheduled

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }

  /**
   * Process and send batched messages
   */
  private processBatch(): void {
    if (this.messageQueue.length === 0) {
      this.batchTimeout = null;
      return;
    }

    if (!this.webViewRef) {
      console.warn('WebView ref not set, clearing message queue');
      this.messageQueue = [];
      this.batchTimeout = null;
      return;
    }

    // Take messages up to MAX_BATCH_SIZE
    const messagesToSend = this.messageQueue.splice(0, this.MAX_BATCH_SIZE);
    
    // Create batch
    const batch: MessageBatch = {
      messages: messagesToSend,
      timestamp: performance.now()
    };

    try {
      const batchString = JSON.stringify({
        batch: true,
        messages: messagesToSend,
        timestamp: batch.timestamp
      });
      
      this.webViewRef.postMessage(batchString);
      
      // Add to history
      messagesToSend.forEach(message => {
        this.addToHistory(message.id);
      });

      console.log(`📦 Sent batch with ${messagesToSend.length} messages`);
      
    } catch (error) {
      console.error('❌ Error sending message batch:', error);
      
      // Re-queue messages if send failed
      this.messageQueue.unshift(...messagesToSend);
    }

    this.batchTimeout = null;

    // Schedule next batch if queue has more messages
    if (this.messageQueue.length > 0) {
      this.scheduleBatch();
    }
  }

  /**
   * Add message to history for duplicate detection
   */
  private addToHistory(messageId: string): void {
    this.messageHistory.set(messageId, performance.now());
    
    // Limit history size
    if (this.messageHistory.size > this.MESSAGE_HISTORY_SIZE) {
      const oldestKey = this.messageHistory.keys().next().value;
      this.messageHistory.delete(oldestKey);
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear message queue and reset state
   */
  clear(): void {
    this.messageQueue = [];
    this.throttleTimers.clear();
    this.messageHistory.clear();
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    queueSize: number;
    handlersRegistered: number;
    throttledTypes: number;
    messageHistory: number;
    isProcessing: boolean;
  } {
    return {
      queueSize: this.messageQueue.length,
      handlersRegistered: this.handlers.size,
      throttledTypes: this.throttleTimers.size,
      messageHistory: this.messageHistory.size,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Flush all pending messages immediately
   */
  flush(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    if (this.messageQueue.length > 0) {
      this.processBatch();
    }
  }
}

/**
 * WebView-injectable optimized message handling script
 */
export const createOptimizedMessageHandlingScript = (): string => {
  return `
    // Optimized Message Handling for WebView
    (function() {
      const messageQueue = [];
      const handlers = new Map();
      const throttleTimers = new Map();
      let batchTimeout = null;
      
      const BATCH_DELAY = 16; // ~60fps
      const MAX_BATCH_SIZE = 10;
      
      // Register message handler with throttling
      window.registerMessageHandler = function(type, handler, throttleMs = 0) {
        handlers.set(type, { handler, throttleMs });
      };
      
      // Optimized message sending to React Native
      window.sendToReactNative = function(type, data, priority = 'medium') {
        const message = {
          id: generateMessageId(),
          type: type,
          data: data,
          timestamp: performance.now(),
          priority: priority
        };
        
        // High priority messages sent immediately
        if (priority === 'high') {
          sendImmediately(message);
          return message.id;
        }
        
        // Add to batch queue
        messageQueue.push(message);
        scheduleBatch();
        
        return message.id;
      };
      
      // Process incoming messages from React Native
      window.addEventListener('message', function(event) {
        const startTime = performance.now();
        
        try {
          const data = JSON.parse(event.data);
          
          // Handle batched messages
          if (data.batch && data.messages) {
            processBatchedMessages(data.messages);
          } else {
            // Handle single message
            processMessage(data);
          }
          
          // Track processing time
          const processingTime = performance.now() - startTime;
          if (processingTime > 10) {
            console.log('Message processing took', processingTime.toFixed(2), 'ms');
          }
          
        } catch (error) {
          console.error('Error processing incoming message:', error);
        }
      });
      
      function processMessage(message) {
        const handler = handlers.get(message.type);
        if (!handler) {
          console.warn('No handler for message type:', message.type);
          return;
        }
        
        // Check throttling
        if (handler.throttleMs > 0) {
          const lastExecution = throttleTimers.get(message.type);
          if (lastExecution && (performance.now() - lastExecution) < handler.throttleMs) {
            return; // Skip throttled message
          }
          throttleTimers.set(message.type, performance.now());
        }
        
        try {
          handler.handler(message.data, message.id);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      }
      
      function processBatchedMessages(messages) {
        // Sort by priority
        messages.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        messages.forEach(processMessage);
      }
      
      function sendImmediately(message) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        }
      }
      
      function scheduleBatch() {
        if (batchTimeout) return;
        
        batchTimeout = setTimeout(() => {
          processBatch();
        }, BATCH_DELAY);
      }
      
      function processBatch() {
        if (messageQueue.length === 0) {
          batchTimeout = null;
          return;
        }
        
        const messagesToSend = messageQueue.splice(0, MAX_BATCH_SIZE);
        
        if (window.ReactNativeWebView) {
          const batch = {
            batch: true,
            messages: messagesToSend,
            timestamp: performance.now()
          };
          
          window.ReactNativeWebView.postMessage(JSON.stringify(batch));
        }
        
        batchTimeout = null;
        
        // Schedule next batch if needed
        if (messageQueue.length > 0) {
          scheduleBatch();
        }
      }
      
      function generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      
      // Cleanup on page unload
      window.addEventListener('beforeunload', function() {
        if (batchTimeout) {
          clearTimeout(batchTimeout);
          processBatch(); // Send any remaining messages
        }
      });
    })();
  `;
};

// Export singleton instance
export const messageOptimizer = MessagePassingOptimizer.getInstance();

// Common message handlers for metronome functionality
export const setupMetronomeMessageHandlers = (optimizer: MessagePassingOptimizer, callbacks: {
  onBeat?: (beat: number, measure: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onTempoChange?: (tempo: number) => void;
  onTimeSignatureChange?: (numerator: number, denominator: number) => void;
}): void => {
  
  // Beat updates (high frequency, throttled)
  optimizer.registerHandler('BEAT', (data) => {
    callbacks.onBeat?.(data.beat, data.measure || 1);
  }, 50); // Throttle to 20fps max
  
  // Play state changes (immediate)
  optimizer.registerHandler('PLAY_STATE_CHANGED', (data) => {
    callbacks.onPlayStateChange?.(data.isPlaying);
  });
  
  // Tempo changes (throttled)
  optimizer.registerHandler('TEMPO_CHANGED', (data) => {
    callbacks.onTempoChange?.(data.tempo);
  }, 100); // Throttle to 10fps
  
  // Time signature changes (immediate)
  optimizer.registerHandler('TIME_SIGNATURE_CHANGED', (data) => {
    callbacks.onTimeSignatureChange?.(data.numerator, data.denominator);
  });
  
  // Performance metrics
  optimizer.registerHandler('PERFORMANCE_METRIC', (data) => {
    // Handle performance data (already implemented in performanceMonitor)
  });
};