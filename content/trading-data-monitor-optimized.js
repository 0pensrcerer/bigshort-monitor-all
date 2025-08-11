// Trading Data Monitor Main Module - Optimized Version
window.TradingMonitor = window.TradingMonitor || {};

window.TradingMonitor.TradingDataMonitor = class TradingDataMonitor {
  constructor() {
    this.debugInfo = [];
    this.initialized = false;
    this.optimizedMonitor = null;
    this.storageManager = null;
    this.messageHandler = null;
  }
  
  async initialize() {
    if (this.initialized) {
      this.addDebugInfo('Monitor already initialized', 'warning');
      return false;
    }

    try {
      this.addDebugInfo('Initializing Optimized Trading Data Monitor...');
      
      // Check if required classes exist
      if (!window.TradingMonitor.OptimizedDataMonitor) {
        this.addDebugInfo('OptimizedDataMonitor class not found!', 'error');
        return false;
      }
      
      if (!window.TradingMonitor.StorageManager) {
        this.addDebugInfo('StorageManager class not found!', 'error');
        return false;
      }
      
      if (!window.TradingMonitor.MessageHandler) {
        this.addDebugInfo('MessageHandler class not found!', 'error');
        return false;
      }
      
      // Create optimized components
      this.addDebugInfo('Creating OptimizedDataMonitor...');
      this.optimizedMonitor = new window.TradingMonitor.OptimizedDataMonitor();
      
      this.addDebugInfo('Creating StorageManager...');
      this.storageManager = new window.TradingMonitor.StorageManager();
      
      this.addDebugInfo('Creating MessageHandler...');
      this.messageHandler = new window.TradingMonitor.MessageHandler();
      
      // Set up debug callbacks
      this.optimizedMonitor.setDebugCallback((msg, type) => this.addDebugInfo(msg, type));
      this.storageManager.setDebugCallback((msg, type) => this.addDebugInfo(msg, type));
      this.messageHandler.setDebugCallback((msg, type) => this.addDebugInfo(msg, type));
      
      // Set up data change callback
      this.optimizedMonitor.onDataChange = (newData, oldData) => {
        this.handleDataChange(newData, oldData);
      };
      
      // Check if monitoring should be enabled for this tab
      const isEnabled = await this.storageManager.isTabEnabled();
      this.addDebugInfo(`Tab monitoring enabled: ${isEnabled}`);
      
      if (isEnabled) {
        const success = await this.optimizedMonitor.start();
        if (success) {
          this.addDebugInfo('Optimized monitor started successfully');
        } else {
          this.addDebugInfo('Failed to start optimized monitor', 'error');
        }
      } else {
        this.addDebugInfo('Monitoring disabled for this tab');
      }
      
      // Set up message handlers
      this.setupMessageHandlers();
      
      this.initialized = true;
      this.addDebugInfo('Optimized Trading Data Monitor initialized successfully');
      
      // Store global reference
      window.tradingDataMonitor = this;
      
      return true;
    } catch (error) {
      this.addDebugInfo(`Initialization failed: ${error.message}`, 'error');
      console.error('Trading Data Monitor initialization error:', error);
      return false;
    }
  }
  
  setupMessageHandlers() {
    // Set up message handler for external communication
    if (this.messageHandler && this.messageHandler.initialize) {
      this.messageHandler.initialize();
    }
  }
  
  handleDataChange(newData, oldData) {
    try {
      this.addDebugInfo('Data change detected, notifying background...');
      
      // Send data update to background
      if (chrome.runtime) {
        chrome.runtime.sendMessage({
          action: 'dataUpdate',
          data: newData,
          timestamp: Date.now()
        }).catch(() => {
          // Ignore messaging errors
        });
      }
      
      this.addDebugInfo(`Data updated: ${Object.keys(newData).length} items`);
    } catch (error) {
      this.addDebugInfo(`Data change handling failed: ${error.message}`, 'error');
    }
  }
  
  async startMonitoring() {
    try {
      if (!this.optimizedMonitor) {
        this.addDebugInfo('Optimized monitor not initialized', 'error');
        return false;
      }
      
      const success = await this.optimizedMonitor.start();
      if (success) {
        this.addDebugInfo('Monitoring started successfully');
      } else {
        this.addDebugInfo('Failed to start monitoring', 'error');
      }
      return success;
    } catch (error) {
      this.addDebugInfo(`Start monitoring failed: ${error.message}`, 'error');
      return false;
    }
  }
  
  stopMonitoring() {
    try {
      if (!this.optimizedMonitor) {
        this.addDebugInfo('Optimized monitor not initialized', 'warning');
        return false;
      }
      
      const success = this.optimizedMonitor.stop();
      if (success) {
        this.addDebugInfo('Monitoring stopped successfully');
      }
      return success;
    } catch (error) {
      this.addDebugInfo(`Stop monitoring failed: ${error.message}`, 'error');
      return false;
    }
  }
  
  getStatus() {
    if (!this.optimizedMonitor) {
      return {
        initialized: this.initialized,
        running: false,
        error: 'Monitor not initialized'
      };
    }
    
    const stats = this.optimizedMonitor.getStats();
    return {
      initialized: this.initialized,
      running: stats.isRunning,
      stats: stats
    };
  }
  
  getDiagnostics() {
    return {
      debugInfo: [...this.debugInfo],
      initialized: this.initialized,
      components: {
        optimizedMonitor: !!this.optimizedMonitor,
        storageManager: !!this.storageManager,
        messageHandler: !!this.messageHandler
      },
      status: this.getStatus()
    };
  }
  
  getCurrentData() {
    if (!this.optimizedMonitor) {
      return {};
    }
    return this.optimizedMonitor.getCurrentData();
  }
  
  addDebugInfo(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    this.debugInfo.push({
      timestamp,
      message,
      type
    });
    
    // Keep only last 100 entries for performance
    if (this.debugInfo.length > 100) {
      this.debugInfo = this.debugInfo.slice(-50);
    }
    
    // Console logging based on type
    switch (type) {
      case 'error':
        console.error(`[TradingMonitor] ${logMessage}`);
        break;
      case 'warning':
        console.warn(`[TradingMonitor] ${logMessage}`);
        break;
      default:
        console.log(`[TradingMonitor] ${logMessage}`);
    }
  }
  
  // Manual control methods for debugging
  manualStart() {
    return this.startMonitoring();
  }
  
  manualStop() {
    return this.stopMonitoring();
  }
  
  manualExtract() {
    if (this.optimizedMonitor) {
      // Trigger immediate data extraction
      this.optimizedMonitor.monitoringCycle();
      return true;
    }
    return false;
  }
  
  destroy() {
    try {
      if (this.optimizedMonitor) {
        this.optimizedMonitor.destroy();
      }
      this.initialized = false;
      this.addDebugInfo('Trading Data Monitor destroyed');
    } catch (error) {
      console.error('Error during destroy:', error);
    }
  }
};
