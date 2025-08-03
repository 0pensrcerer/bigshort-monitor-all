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
      this.addDebugInfo('Starting monitor - running every 0.5 seconds');
      this.interval = setInterval(() => {
        this.monitoringCycle();
      }, 500);
      
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
