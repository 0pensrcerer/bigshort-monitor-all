// Trading Data Monitor Main Module
window.TradingMonitor = window.TradingMonitor || {};

window.TradingMonitor.TradingDataMonitor = class TradingDataMonitor {
  constructor() {
    this.debugInfo = [];
    this.initialized = false;
    this.components = {};
  }
  
  async initialize() {
    if (this.initialized) {
      this.addDebugInfo('Monitor already initialized', 'warning');
      return false;
    }

    try {
      this.addDebugInfo('Initializing Trading Data Monitor...');
      
      // Check if the global namespace exists
      if (!window.TradingMonitor) {
        this.addDebugInfo('TradingMonitor namespace not found!', 'error');
        return false;
      }
      
      // Check if all required classes exist
      const requiredClasses = ['StorageManager', 'ChartTargeting', 'MouseEventSimulator', 'TableDataExtractor', 'MonitoringController', 'MessageHandler'];
      for (const className of requiredClasses) {
        if (!window.TradingMonitor[className]) {
          this.addDebugInfo(`${className} class not found in TradingMonitor namespace!`, 'error');
          return false;
        }
      }
      
      // Create core components
      this.addDebugInfo('Creating StorageManager...');
      this.components.storageManager = new window.TradingMonitor.StorageManager();
      this.addDebugInfo('Creating ChartTargeting...');
      this.components.chartTargeting = new window.TradingMonitor.ChartTargeting();
      this.addDebugInfo('Creating MouseEventSimulator...');
      this.components.mouseSimulator = new window.TradingMonitor.MouseEventSimulator();
      this.addDebugInfo('Creating TableDataExtractor...');
      this.components.dataExtractor = new window.TradingMonitor.TableDataExtractor();
      
      // Verify components were created
      this.addDebugInfo(`StorageManager created: ${!!this.components.storageManager}`);
      this.addDebugInfo(`StorageManager has isTabEnabled: ${typeof this.components.storageManager.isTabEnabled === 'function'}`);
      
      // Create controllers
      this.addDebugInfo('Creating MonitoringController...');
      this.components.monitoringController = new window.TradingMonitor.MonitoringController(
        this.components.chartTargeting,
        this.components.mouseSimulator,
        this.components.dataExtractor
      );
      
      this.addDebugInfo('Creating MessageHandler...');
      this.components.messageHandler = new window.TradingMonitor.MessageHandler(
        this.components.dataExtractor,
        this.components.monitoringController,
        this.components.storageManager
      );
      
      // Setup debug callbacks
      this.setupDebugCallbacks();
      
      // Initialize message handling
      this.components.messageHandler.initialize();
      
      // Setup data change notifications
      this.setupDataNotifications();
      
      // Store global reference
      window.tradingDataMonitor = this;
      
      this.initialized = true;
      this.addDebugInfo('Trading Data Monitor initialized successfully');
      
      // Check if this tab should be monitored
      await this.checkTabStatus();
      
      return true;
    } catch (error) {
      this.addDebugInfo(`Initialization failed: ${error.message}`, 'error');
      return false;
    }
  }
  
  setupDebugCallbacks() {
    // Setup debug callbacks for all components
    Object.values(this.components).forEach(component => {
      if (component.setDebugCallback) {
        component.setDebugCallback((message, type) => {
          this.addDebugInfo(message, type);
        });
      }
    });
  }
  
  setupDataNotifications() {
    // Setup data change notifications to sidebar
    this.components.dataExtractor.onDataChange = async (data) => {
      try {
        this.addDebugInfo('Data change detected, notifying sidebar...');
        await this.components.messageHandler.notifyDataUpdate(data);
        this.addDebugInfo('Sidebar notification sent successfully');
      } catch (error) {
        if (error.message.includes('Extension context invalidated') || 
            error.message.includes('context invalidated') ||
            error.message.includes('The extension context')) {
          this.addDebugInfo('🔄 Extension context invalidated - data change handling failed', 'warning');
          // Don't continue processing when extension context is gone
          return;
        }
        this.addDebugInfo(`Sidebar notification failed: ${error.message}`, 'error');
      }
    };

    // Setup threshold breach notifications
    this.components.dataExtractor.onThresholdBreach = async (breach) => {
      try {
        await this.components.messageHandler.notifyThresholdBreach(breach);
      } catch (error) {
        if (error.message.includes('Extension context invalidated') || 
            error.message.includes('context invalidated') ||
            error.message.includes('The extension context')) {
          this.addDebugInfo('🔄 Extension context invalidated - threshold breach notification skipped', 'warning');
          return;
        }
        // Silently handle other notification failures
      }
    };
  }  async checkTabStatus() {
    try {
      // Add debugging to check if storageManager exists and has the method
      if (!this.components.storageManager) {
        this.addDebugInfo('StorageManager component not found', 'error');
        return;
      }
      
      if (typeof this.components.storageManager.isTabEnabled !== 'function') {
        this.addDebugInfo('isTabEnabled method not found on StorageManager', 'error');
        this.addDebugInfo(`StorageManager methods: ${Object.getOwnPropertyNames(this.components.storageManager)}`, 'info');
        return;
      }
      
      const isEnabled = await this.components.storageManager.isTabEnabled();
      if (isEnabled) {
        this.addDebugInfo('Tab is enabled for monitoring');
        // Auto-start monitoring if enabled
        await this.startMonitoring();
      } else {
        this.addDebugInfo('Tab is not enabled for monitoring');
      }
    } catch (error) {
      this.addDebugInfo(`Failed to check tab status: ${error.message}`, 'error');
    }
  }
  
  async startMonitoring() {
    if (!this.initialized) {
      this.addDebugInfo('Monitor not initialized', 'error');
      return false;
    }
    
    return await this.components.monitoringController.start();
  }
  
  stopMonitoring() {
    if (!this.initialized) {
      this.addDebugInfo('Monitor not initialized', 'error');
      return false;
    }
    
    return this.components.monitoringController.stop();
  }
  
  getStatus() {
    if (!this.initialized) {
      return { initialized: false };
    }
    
    return {
      initialized: true,
      ...this.components.monitoringController.getStatus()
    };
  }
  
  getDiagnostics() {
    if (!this.initialized) {
      return { initialized: false, debugInfo: this.debugInfo };
    }
    
    return {
      initialized: true,
      debugInfo: this.debugInfo.slice(-20), // Last 20 debug messages
      ...this.components.monitoringController.getDiagnostics()
    };
  }
  
  getCurrentData() {
    if (!this.initialized) {
      return null;
    }
    
    return this.components.monitoringController.getCurrentTableData();
  }
  
  addDebugInfo(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const debugEntry = { timestamp, message, type };
    
    this.debugInfo.push(debugEntry);
    
    // Keep only last 100 entries
    if (this.debugInfo.length > 100) {
      this.debugInfo = this.debugInfo.slice(-100);
    }
    
    // Console logging for development
    if (type === 'error') {
      console.error(`[TradingMonitor] ${message}`);
    } else if (type === 'warning') {
      console.warn(`[TradingMonitor] ${message}`);
    } else {
      console.log(`[TradingMonitor] ${message}`);
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
    if (!this.initialized) {
      this.addDebugInfo('Monitor not initialized', 'error');
      return null;
    }
    
    this.components.dataExtractor.extractCurrentTableData();
    return this.components.dataExtractor.getCurrentData();
  }
  
  // Cleanup method
  destroy() {
    if (this.components.monitoringController) {
      this.components.monitoringController.stop();
    }
    
    this.initialized = false;
    window.tradingDataMonitor = null;
    this.addDebugInfo('Trading Data Monitor destroyed');
  }
};
