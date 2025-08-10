// Monitoring Controller Module
window.TradingMonitor = window.TradingMonitor || {};

window.TradingMonitor.MonitoringController = class MonitoringController {
  constructor(chartTargeting, mouseSimulator, dataExtractor) {
    this.chartTargeting = chartTargeting;
    this.mouseSimulator = mouseSimulator;
    this.dataExtractor = dataExtractor;
    this.interval = null;
    this.isRunning = false;
    this.debugCallback = null;
    this.mouseEventTriggered = false; // Track if mouse event has been triggered
    this.lastMouseEventTime = 0; // Track when we last triggered mouse event
    this.mouseEventInterval = 10000; // Re-trigger mouse event every 10 seconds
  }
  
  setDebugCallback(callback) {
    this.debugCallback = callback;
  }
  
  addDebugInfo(message, type = 'info') {
    if (this.debugCallback) {
      this.debugCallback(message, type);
    }
  }
  
  async start() {
    if (this.isRunning) {
      this.addDebugInfo('Monitoring already running', 'warning');
      return false;
    }

    try {
      this.addDebugInfo('Starting monitor - triggering initial mouse event');
      
      // Trigger initial mouse event once
      await this.triggerInitialMouseEvent();
      
      this.addDebugInfo('Setting up data monitoring every 1 second');
      this.interval = setInterval(() => {
        this.monitorDataOnly();
      }, 1000); // Changed to 1 second
      
      this.isRunning = true;
      
      // Store globally for manual control
      window.tradingDataMonitorInterval = this.interval;
      return true;
    } catch (error) {
      this.addDebugInfo(`Failed to start monitoring: ${error.message}`, 'error');
      return false;
    }
  }
  
  stop() {
    if (!this.isRunning) {
      this.addDebugInfo('No monitoring to stop', 'warning');
      return false;
    }

    clearInterval(this.interval);
    this.interval = null;
    this.isRunning = false;
    window.tradingDataMonitorInterval = null;
    this.addDebugInfo('Monitoring stopped');
    return true;
  }
  
  monitoringCycle() {
    try {
      this.simulateMouseEvents();
      this.extractTableDataDelayed();
    } catch (error) {
      this.addDebugInfo(`Monitoring cycle error: ${error.message}`, 'error');
    }
  }
  
  async triggerInitialMouseEvent() {
    try {
      this.addDebugInfo('Triggering initial mouse event...');
      this.simulateMouseEvents();
      this.lastMouseEventTime = Date.now();
      
      // Wait a bit for the tooltip to render before extracting data
      await new Promise(resolve => setTimeout(resolve, 150));
      this.dataExtractor.extractCurrentTableData();
      this.dataExtractor.logDataUpdate();
      
      this.mouseEventTriggered = true;
      this.addDebugInfo('Initial mouse event triggered successfully');
    } catch (error) {
      this.addDebugInfo(`Initial mouse event error: ${error.message}`, 'error');
    }
  }
  
  monitorDataOnly() {
    try {
      this.addDebugInfo('Monitoring data...');
      
      const now = Date.now();
      const timeSinceLastMouseEvent = now - this.lastMouseEventTime;
      
      // Re-trigger mouse event every 5 seconds to keep tooltip visible
      if (timeSinceLastMouseEvent >= this.mouseEventInterval) {
        this.addDebugInfo('Re-triggering mouse event to refresh tooltip');
        this.simulateMouseEvents();
        this.lastMouseEventTime = now;
        
        // Wait for tooltip to appear
        setTimeout(() => {
          this.dataExtractor.extractCurrentTableData();
          this.dataExtractor.logDataUpdate();
        }, 150);
      } else {
        this.addDebugInfo(`Next mouse event in ${Math.ceil((this.mouseEventInterval - timeSinceLastMouseEvent) / 1000)}s`);
        this.dataExtractor.extractCurrentTableData();
        this.dataExtractor.logDataUpdate();
      }
    } catch (error) {
      this.addDebugInfo(`Data monitoring error: ${error.message}`, 'error');
    }
  }
  
  simulateMouseEvents() {
    const targetElement = this.chartTargeting.findTargetElement();
    
    if (!targetElement) {
      return;
    }

    const coordinates = this.chartTargeting.getTargetCoordinates(targetElement);
    this.mouseSimulator.simulateMouseEvents(targetElement, coordinates);
  }
  
  extractTableDataDelayed() {
    // Use a small delay to let the tooltip render
    setTimeout(() => {
      this.dataExtractor.extractCurrentTableData();
      this.dataExtractor.logDataUpdate();
    }, 50);
  }
  
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: !!this.interval
    };
  }
  
  getCurrentTableData() {
    return this.dataExtractor.getCurrentData();
  }
  
  getDiagnostics() {
    const chartDiagnostics = this.chartTargeting.getDiagnostics();
    const status = this.getStatus();
    
    return {
      ...chartDiagnostics,
      monitoringStatus: status,
      url: window.location.href,
      domain: window.location.hostname
    };
  }
};
