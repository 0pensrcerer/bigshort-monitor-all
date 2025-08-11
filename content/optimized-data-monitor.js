// Optimized Data Monitor - Consolidated data extraction with smart caching
window.TradingMonitor = window.TradingMonitor || {};

window.TradingMonitor.OptimizedDataMonitor = class OptimizedDataMonitor {
  constructor() {
    // Core state
    this.isRunning = false;
    this.interval = null;
    this.debugCallback = null;
    
    // Method tracking for optimization
    this.lastSuccessfulMethod = null;
    this.methodSuccess = {
      tooltip: 0,
      directTable: 0
    };
    
    // Caching for performance
    this.elementCache = new Map();
    this.cacheTimeout = 3000; // 3 seconds
    this.lastCacheTime = 0;
    
    // Data and storage management
    this.currentData = {};
    this.previousData = {};
    this.pendingStorageWrites = new Map();
    this.storageTimeout = null;
    
    // Mouse event optimization
    this.mouseEventTriggered = false;
    this.lastMouseEventTime = 0;
    this.mouseEventInterval = 10000; // 10 seconds
    
    // Enhanced debugging for alarm issue
    this.cycleCount = 0;
    this.lastCycleTime = 0;
    this.monitoringHealth = {
      intervalActive: false,
      lastHeartbeat: Date.now(),
      consecutiveErrors: 0,
      lastError: null
    };
    
    // Callbacks
    this.onDataChange = null;
    this.onThresholdBreach = null;
  }
  
  setDebugCallback(callback) {
    this.debugCallback = callback;
  }
  
  addDebugInfo(message, type = 'info') {
    if (this.debugCallback) {
      this.debugCallback(message, type);
    }
  }
  
  // ============== MAIN CONTROL METHODS ==============
  
  async start() {
    if (this.isRunning) {
      this.addDebugInfo('Monitor already running', 'warning');
      return false;
    }
    
    try {
      this.addDebugInfo('🚀 Starting optimized data monitor with enhanced debugging');
      
      // Reset monitoring health
      this.monitoringHealth = {
        intervalActive: false,
        lastHeartbeat: Date.now(),
        consecutiveErrors: 0,
        lastError: null
      };
      
      // Trigger initial mouse event
      await this.triggerInitialMouseEvent();
      
      // Start monitoring cycle with health tracking
      this.addDebugInfo('⏰ Setting up monitoring interval (1000ms)');
      this.interval = setInterval(() => {
        this.monitoringCycleWithHealthCheck();
      }, 1000);
      
      this.isRunning = true;
      this.monitoringHealth.intervalActive = true;
      window.optimizedDataMonitorInterval = this.interval;
      
      // Start independent health monitoring
      this.startHealthMonitoring();
      
      // Initialize alarm debugging
      this.setAlarmDebugging(true);
      
      this.addDebugInfo('✅ Optimized monitor started successfully - interval ID: ' + this.interval);
      return true;
    } catch (error) {
      this.addDebugInfo(`❌ Failed to start monitor: ${error.message}`, 'error');
      this.monitoringHealth.lastError = error.message;
      return false;
    }
  }
  
  stop() {
    if (!this.isRunning) {
      this.addDebugInfo('⚠️ Monitor not running - cannot stop', 'warning');
      return false;
    }
    
    this.addDebugInfo(`🛑 Stopping optimized data monitor - Cycle count: ${this.cycleCount}, Last cycle: ${new Date(this.lastCycleTime).toLocaleTimeString()}`);
    
    // Update monitoring health
    this.monitoringHealth.intervalActive = false;
    this.monitoringHealth.lastHeartbeat = Date.now();
    
    // Stop health monitoring
    this.stopHealthMonitoring();
    
    if (this.interval) {
      this.addDebugInfo(`🔕 Clearing interval ${this.interval}`);
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.isRunning = false;
    this.clearElementCache();
    this.flushPendingStorage();
    
    this.addDebugInfo('Optimized monitor stopped');
    return true;
  }
  
  // ============== OPTIMIZED DATA EXTRACTION ==============
  
  monitoringCycleWithHealthCheck() {
    try {
      this.cycleCount++;
      this.lastCycleTime = Date.now();
      this.monitoringHealth.lastHeartbeat = Date.now();
      this.monitoringHealth.consecutiveErrors = 0;
      
      this.addDebugInfo(`🔄 Monitoring cycle #${this.cycleCount} starting - Health: ✅`);
      
      // Call the actual monitoring cycle
      this.monitoringCycle();
      
    } catch (error) {
      this.monitoringHealth.consecutiveErrors++;
      this.monitoringHealth.lastError = error.message;
      this.addDebugInfo(`❌ Monitoring cycle #${this.cycleCount} error: ${error.message}`, 'error');
      
      // Stop monitoring if too many consecutive errors
      if (this.monitoringHealth.consecutiveErrors >= 5) {
        this.addDebugInfo(`🛑 Stopping monitor due to ${this.monitoringHealth.consecutiveErrors} consecutive errors`, 'error');
        this.stop();
      }
    }
  }

  async monitoringCycle() {
    try {
      this.addDebugInfo(`📊 Monitoring cycle #${this.cycleCount} - extracting data`);
      
      // Check if we need to re-trigger mouse event
      const now = Date.now();
      if (now - this.lastMouseEventTime > this.mouseEventInterval) {
        this.addDebugInfo('🖱️ Re-triggering mouse event (periodic)');
        await this.triggerMouseEvent();
      }
      
      // Extract data using optimized method
      const data = await this.extractDataOptimized();
      
      if (data && Object.keys(data).length > 0) {
        this.addDebugInfo(`✅ Data extracted successfully - ${Object.keys(data).length} items`);
        this.processExtractedData(data);
      } else {
        this.addDebugInfo('⚠️ No data extracted in this cycle');
      }
      
    } catch (error) {
      this.addDebugInfo(`❌ Monitoring cycle error: ${error.message}`, 'error');
      throw error; // Re-throw for health check handling
    }
  }
  
  async extractDataOptimized() {
    this.addDebugInfo(`🔍 Starting data extraction - Last successful method: ${this.lastSuccessfulMethod || 'none'}`);
    
    // Try last successful method first (performance optimization)
    if (this.lastSuccessfulMethod) {
      this.addDebugInfo(`⚡ Trying last successful method: ${this.lastSuccessfulMethod}`);
      const data = await this[this.lastSuccessfulMethod]();
      if (data && Object.keys(data).length > 0) {
        this.methodSuccess[this.lastSuccessfulMethod.replace('extractFrom', '').toLowerCase()]++;
        this.addDebugInfo(`✅ Last successful method worked - extracted ${Object.keys(data).length} items`);
        return data;
      } else {
        this.addDebugInfo(`⚠️ Last successful method failed - fallback to other methods`);
      }
    }
    
    // Try methods in order of likely success
    const methods = ['extractFromTooltip', 'extractFromDirectTable'];
    this.addDebugInfo(`🔄 Trying extraction methods in order: ${methods.join(', ')}`);
    
    for (const method of methods) {
      try {
        this.addDebugInfo(`🧪 Attempting extraction with: ${method}`);
        const data = await this[method]();
        if (data && Object.keys(data).length > 0) {
          this.lastSuccessfulMethod = method;
          const methodName = method.replace('extractFrom', '').toLowerCase();
          this.methodSuccess[methodName]++;
          this.addDebugInfo(`✅ Successfully extracted data using: ${methodName} - ${Object.keys(data).length} items`);
          return data;
        } else {
          this.addDebugInfo(`❌ Method ${method} returned no data`);
        }
      } catch (error) {
        this.addDebugInfo(`Method ${method} failed: ${error.message}`, 'warning');
      }
    }
    
    return null;
  }
  
  // ============== EXTRACTION METHODS ==============
  
  async extractFromTooltip() {
    // Find tables that appear after mouse events (tooltips)
    const tables = this.findTooltipTables();
    
    if (tables.length === 0) {
      return null;
    }
    
    const data = {};
    tables.forEach(table => {
      const tableData = this.parseTable(table);
      Object.assign(data, tableData);
    });
    
    return Object.keys(data).length > 0 ? data : null;
  }
  
  async extractFromDirectTable() {
    // Direct scan of visible tables (fallback method)
    const tables = this.findVisibleTables();
    
    if (tables.length === 0) {
      return null;
    }
    
    const data = {};
    tables.forEach(table => {
      const tableData = this.parseTable(table);
      Object.assign(data, tableData);
    });
    
    return Object.keys(data).length > 0 ? data : null;
  }
  
  // ============== DOM FINDING WITH CACHING ==============
  
  findTooltipTables() {
    return this.findTablesWithCache('tooltip', () => {
      const tables = Array.from(document.querySelectorAll('table'));
      return tables.filter(table => {
        const rect = table.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               this.isLikelyTooltip(table);
      });
    });
  }
  
  findVisibleTables() {
    return this.findTablesWithCache('visible', () => {
      const tables = Array.from(document.querySelectorAll('table'));
      return tables.filter(table => {
        const rect = table.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
    });
  }
  
  findTablesWithCache(cacheKey, finder) {
    const now = Date.now();
    
    // Check cache validity
    if (this.elementCache.has(cacheKey)) {
      const cached = this.elementCache.get(cacheKey);
      if (now - cached.timestamp < this.cacheTimeout) {
        // Validate cached elements are still in DOM
        const validElements = cached.elements.filter(el => document.contains(el));
        if (validElements.length === cached.elements.length) {
          return validElements;
        }
      }
    }
    
    // Cache miss or invalid - refetch
    const elements = finder();
    this.elementCache.set(cacheKey, {
      elements,
      timestamp: now
    });
    
    return elements;
  }
  
  clearElementCache() {
    this.elementCache.clear();
    this.lastCacheTime = 0;
  }
  
  // ============== TABLE PARSING ==============
  
  parseTable(table) {
    const data = {};
    const rows = Array.from(table.querySelectorAll('tr'));
    
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      if (cells.length >= 2) {
        const key = cells[0].textContent.trim();
        const value = cells[1].textContent.trim();
        
        if (key && value && this.isValidDataPoint(key, value)) {
          data[key] = this.parseValue(value);
        }
      }
    });
    
    return data;
  }
  
  isValidDataPoint(key, value) {
    // Filter out headers, empty values, etc.
    const invalidPatterns = /^(header|title|name|label)$/i;
    return !invalidPatterns.test(key) && value.length > 0;
  }
  
  parseValue(value) {
    // Try to parse as number, otherwise return as string
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return !isNaN(numValue) ? numValue : value;
  }
  
  isLikelyTooltip(table) {
    const style = window.getComputedStyle(table);
    const rect = table.getBoundingClientRect();
    
    return (
      style.position === 'absolute' ||
      style.position === 'fixed' ||
      rect.width < 400 || // Small tables are likely tooltips
      table.closest('[role="tooltip"]') ||
      table.classList.contains('tooltip')
    );
  }
  
  // ============== MOUSE EVENT OPTIMIZATION ==============
  
  async triggerInitialMouseEvent() {
    this.addDebugInfo('Triggering initial mouse event');
    await this.triggerMouseEvent();
    this.mouseEventTriggered = true;
  }
  
  async triggerMouseEvent() {
    try {
      const targetElement = this.findTargetElement();
      if (!targetElement) {
        this.addDebugInfo('No target element found for mouse event', 'warning');
        return false;
      }
      
      this.simulateMouseMove(targetElement);
      this.lastMouseEventTime = Date.now();
      
      // Wait for tooltip to appear
      await this.sleep(500);
      return true;
      
    } catch (error) {
      this.addDebugInfo(`Mouse event failed: ${error.message}`, 'error');
      return false;
    }
  }
  
  findTargetElement() {
    // Use cached element if available and valid
    const cached = this.elementCache.get('targetElement');
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      if (document.contains(cached.element)) {
        return cached.element;
      }
    }
    
    // Find new target element
    const svg = document.querySelector('svg');
    if (!svg) return null;
    
    const targetRect = svg.querySelector('g:nth-child(5) rect:nth-child(13)');
    if (targetRect) {
      this.elementCache.set('targetElement', {
        element: targetRect,
        timestamp: Date.now()
      });
      return targetRect;
    }
    
    return null;
  }
  
  simulateMouseMove(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const event = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    });
    
    element.dispatchEvent(event);
  }
  
  // ============== DATA PROCESSING ==============
  
  processExtractedData(data) {
    this.addDebugInfo(`📊 Processing extracted data - ${Object.keys(data).length} items`);
    
    const hasChanges = JSON.stringify(data) !== JSON.stringify(this.currentData);
    this.addDebugInfo(`🔄 Data comparison - Has changes: ${hasChanges}`);
    
    if (hasChanges || Object.keys(this.currentData).length === 0) {
      this.addDebugInfo(`💾 Updating stored data - Previous: ${Object.keys(this.currentData).length} items, New: ${Object.keys(data).length} items`);
      
      this.previousData = { ...this.currentData };
      this.currentData = { ...data };
      
      this.addDebugInfo(`✅ Data updated: ${Object.keys(data).length} items`);
      
      // Batch storage write
      this.addDebugInfo(`💿 Batch writing to storage - key: latest_data`);
      this.batchStorageWrite('latest_data', {
        data: this.currentData,
        timestamp: Date.now()
      });
      
      // Notify callbacks
      if (this.onDataChange) {
        this.addDebugInfo(`📡 Calling onDataChange callback - START`);
        try {
          this.onDataChange(this.currentData, this.previousData);
          this.addDebugInfo(`✅ onDataChange callback completed successfully`);
        } catch (error) {
          this.addDebugInfo(`❌ ERROR in onDataChange callback: ${error.message}`, 'error');
          this.addDebugInfo(`🔍 This error might be stopping monitoring!`, 'error');
          
          // Log monitoring health after callback error
          setTimeout(() => {
            this.logMonitoringHealth();
          }, 1000);
        }
      }
      
      // Send to background
      this.addDebugInfo(`📤 Sending data update to background script`);
      this.sendDataUpdate(this.currentData);
    } else {
      this.addDebugInfo(`⚡ No data changes detected - skipping update`);
    }
  }
  
  // ============== OPTIMIZED STORAGE ==============
  
  batchStorageWrite(key, data) {
    this.pendingStorageWrites.set(key, data);
    
    // Debounce storage writes
    clearTimeout(this.storageTimeout);
    this.storageTimeout = setTimeout(() => {
      this.flushPendingStorage();
    }, 500);
  }
  
  async flushPendingStorage() {
    if (this.pendingStorageWrites.size === 0) return;
    
    try {
      const writes = Object.fromEntries(this.pendingStorageWrites);
      await chrome.storage.local.set(writes);
      this.addDebugInfo(`Flushed ${this.pendingStorageWrites.size} storage writes`);
      this.pendingStorageWrites.clear();
    } catch (error) {
      this.addDebugInfo(`Storage flush failed: ${error.message}`, 'error');
    }
  }
  
  // ============== MESSAGING ==============
  
  sendDataUpdate(data) {
    try {
      this.addDebugInfo(`📡 Sending data update to background - ${Object.keys(data).length} items`);
      
      chrome.runtime.sendMessage({
        action: 'dataUpdate',
        data: data,
        timestamp: Date.now()
      }).then(() => {
        this.addDebugInfo(`✅ Data update sent successfully to background`);
      }).catch((error) => {
        this.addDebugInfo(`⚠️ Failed to send data update: ${error.message}`, 'warning');
        // Ignore messaging errors in optimized version
      });
    } catch (error) {
      this.addDebugInfo(`❌ Error in sendDataUpdate: ${error.message}`, 'error');
      // Ignore messaging errors
    }
  }
  
  // ============== HEALTH MONITORING ==============
  
  startHealthMonitoring() {
    this.addDebugInfo('🏥 Starting independent health monitoring');
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5000); // Check every 5 seconds
  }
  
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      this.addDebugInfo('🏥 Stopping health monitoring');
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
  
  performHealthCheck() {
    const health = this.getMonitoringHealth();
    
    // Check if monitoring appears to have stopped
    if (health.isRunning && health.timeSinceLastCycle > 3000) {
      this.addDebugInfo('🚨 CRITICAL: Monitoring cycle appears to have stopped!', 'error');
      this.addDebugInfo('🔍 Performing detailed health analysis...', 'error');
      this.logMonitoringHealth();
      
      // Check if interval still exists
      if (!this.interval) {
        this.addDebugInfo('💥 FOUND ISSUE: Interval has been cleared!', 'error');
      } else {
        this.addDebugInfo('🤔 Interval still exists, but cycles not running', 'error');
      }
    }
    
    // Periodic health log (every 30 seconds)
    if (this.cycleCount % 6 === 0 && health.timeSinceLastCycle < 2000) {
      this.addDebugInfo('🏥 Periodic health check - monitoring is healthy ✅');
    }
  }

  // ============== UTILITIES ==============

  getMonitoringHealth() {
    const timeSinceLastCycle = Date.now() - this.lastCycleTime;
    const timeSinceLastHeartbeat = Date.now() - this.monitoringHealth.lastHeartbeat;
    
    return {
      isRunning: this.isRunning,
      intervalActive: this.monitoringHealth.intervalActive,
      cycleCount: this.cycleCount,
      lastCycleTime: this.lastCycleTime,
      timeSinceLastCycle,
      timeSinceLastHeartbeat,
      consecutiveErrors: this.monitoringHealth.consecutiveErrors,
      lastError: this.monitoringHealth.lastError,
      intervalId: this.interval,
      lastSuccessfulMethod: this.lastSuccessfulMethod,
      methodSuccess: { ...this.methodSuccess }
    };
  }

  logMonitoringHealth() {
    const health = this.getMonitoringHealth();
    this.addDebugInfo('🏥 MONITORING HEALTH CHECK:', 'info');
    this.addDebugInfo(`   🔄 Running: ${health.isRunning} | Interval Active: ${health.intervalActive}`);
    this.addDebugInfo(`   📊 Cycles: ${health.cycleCount} | Last: ${health.timeSinceLastCycle}ms ago`);
    this.addDebugInfo(`   💓 Heartbeat: ${health.timeSinceLastHeartbeat}ms ago`);
    this.addDebugInfo(`   ❌ Errors: ${health.consecutiveErrors} | Last Error: ${health.lastError || 'none'}`);
    this.addDebugInfo(`   🎯 Last Method: ${health.lastSuccessfulMethod || 'none'}`);
    this.addDebugInfo(`   🔢 Interval ID: ${health.intervalId}`);
    
    // Alert if monitoring seems stuck
    if (health.isRunning && health.timeSinceLastCycle > 5000) {
      this.addDebugInfo('🚨 WARNING: Monitoring cycle appears stuck!', 'error');
    }
    
    return health;
  }

  // ============== ALARM DEBUGGING ==============
  
  setAlarmDebugging(enabled = true) {
    this.alarmDebugging = enabled;
    if (enabled) {
      this.addDebugInfo('🚨 Enhanced alarm debugging ENABLED', 'info');
      
      // Hook into chrome.runtime.onMessage to detect alarm-related messages
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        if (!this.originalOnMessage) {
          this.originalOnMessage = chrome.runtime.onMessage;
          
          // Wrap message listener to detect alarm operations
          const originalAddListener = chrome.runtime.onMessage.addListener.bind(chrome.runtime.onMessage);
          chrome.runtime.onMessage.addListener = (callback) => {
            const wrappedCallback = (message, sender, sendResponse) => {
              if (message && (message.action === 'setThreshold' || message.action === 'clearThreshold' || message.type === 'alarm')) {
                this.addDebugInfo(`🚨 ALARM MESSAGE DETECTED: ${JSON.stringify(message)}`, 'warning');
                this.addDebugInfo('🔍 Pre-alarm monitoring health:');
                this.logMonitoringHealth();
                
                // Schedule post-alarm health check
                setTimeout(() => {
                  this.addDebugInfo('🔍 Post-alarm monitoring health:');
                  this.logMonitoringHealth();
                }, 1000);
              }
              
              return callback(message, sender, sendResponse);
            };
            
            return originalAddListener(wrappedCallback);
          };
        }
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }  getCurrentData() {
    return { ...this.currentData };
  }
  
  getStats() {
    return {
      isRunning: this.isRunning,
      lastSuccessfulMethod: this.lastSuccessfulMethod,
      methodSuccess: { ...this.methodSuccess },
      cacheSize: this.elementCache.size,
      dataItemCount: Object.keys(this.currentData).length
    };
  }
  
  // ============== CLEANUP ==============
  
  destroy() {
    this.stop();
    clearTimeout(this.storageTimeout);
    this.clearElementCache();
    this.currentData = {};
    this.previousData = {};
    this.pendingStorageWrites.clear();
  }
};
