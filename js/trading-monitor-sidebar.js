import { ThresholdManager } from './threshold-manager.js';
import { AlarmSystem } from './alarm-system.js';
import { UIController } from './ui-controller.js';
import { DataService } from './data-service.js';
import { StorageService } from './storage-service.js';

export class TradingMonitorSidebar {
  constructor() {
    this.debugInfo = [];
    this.currentTableData = {};
    this.updateInterval = null;
    this.isMonitoringActive = false;
    
    // Initialize services
    this.storageService = new StorageService();
    this.dataService = new DataService();
    this.thresholdManager = new ThresholdManager(this.storageService);
    this.alarmSystem = new AlarmSystem();
    this.uiController = new UIController(this.thresholdManager, this.dataService);
    
    // Set up debug callbacks
    this.setupDebugCallbacks();
  }
  
  setupDebugCallbacks() {
    const debugCallback = (info) => this.addDebugInfo(info);
    
    this.storageService.setDebugCallback(debugCallback);
    this.dataService.setDebugCallback(debugCallback);
    this.alarmSystem.setDebugCallback(debugCallback);
    this.uiController.setDebugCallback(debugCallback);
  }
  
  addDebugInfo(info) {
    const timestamp = new Date().toLocaleTimeString();
    this.debugInfo.push(`${timestamp}: ${info}`);
    if (this.debugInfo.length > 50) this.debugInfo.shift(); // Keep last 50 entries
  }
  
  async initialize() {
    try {
      this.addDebugInfo('Sidebar script started');
      
      // Load saved thresholds
      await this.thresholdManager.loadThresholds();
      
      // Check current tab and setup UI
      await this.setupUI();
      await this.checkInitialStatus();
      
      // Setup test function
      this.setupTestFunction();
      
      // Setup cleanup
      this.setupCleanup();
      
      this.addDebugInfo('Sidebar initialization complete');
      
    } catch (error) {
      this.addDebugInfo(`Sidebar error: ${error.message}`);
      console.error('Sidebar error:', error);
      this.uiController.showError('Error loading sidebar');
    }
  }
  
  async setupUI() {
    this.uiController.onEnableClicked(async () => {
      await this.enableMonitoring();
    });
    
    this.uiController.onDisableClicked(async () => {
      await this.disableMonitoring();
    });
    
    this.uiController.onThresholdSet(async (key, thresholdValue, absolute) => {
      await this.setThreshold(key, thresholdValue, absolute);
    });
    
    this.uiController.onThresholdClear(async (key) => {
      await this.clearThreshold(key);
    });
    
    // Setup crosshair controls
    this.setupCrosshairControls();
  }
  
  setupCrosshairControls() {
    const showBtn = document.getElementById('show-crosshair-btn');
    const hideBtn = document.getElementById('hide-crosshair-btn');
    const refreshBtn = document.getElementById('refresh-crosshair-btn');
    
    if (showBtn) {
      showBtn.addEventListener('click', async () => {
        await this.showCrosshair();
      });
    }
    
    if (hideBtn) {
      hideBtn.addEventListener('click', async () => {
        await this.hideCrosshair();
      });
    }
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await this.refreshCrosshairStatus();
      });
    }
    
    // Initial status check
    this.refreshCrosshairStatus();
  }
  
  async showCrosshair() {
    try {
      const tab = await this.storageService.getCurrentTab();
      if (!tab) {
        this.updateCrosshairUI(false);
        return;
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'showCrosshair'
      });
      
      if (response && response.success) {
        this.addDebugInfo('Crosshair activated');
        this.updateCrosshairUI(true);
      } else {
        this.addDebugInfo('Failed to activate crosshair');
        this.updateCrosshairUI(false);
      }
    } catch (error) {
      this.addDebugInfo(`Crosshair error: ${error.message}`);
      this.updateCrosshairUI(false);
    }
  }
  
  async hideCrosshair() {
    try {
      const tab = await this.storageService.getCurrentTab();
      if (!tab) {
        this.updateCrosshairUI(false);
        return;
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'hideCrosshair'
      });
      
      if (response && response.success) {
        this.addDebugInfo('Crosshair hidden');
        this.updateCrosshairUI(false);
      } else {
        this.addDebugInfo('Failed to hide crosshair');
      }
    } catch (error) {
      this.addDebugInfo(`Crosshair error: ${error.message}`);
      this.updateCrosshairUI(false);
    }
  }
  
  async refreshCrosshairStatus() {
    try {
      const tab = await this.storageService.getCurrentTab();
      if (!tab) {
        this.updateCrosshairUI(false);
        return;
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'getCrosshairCoords'
      });
      
      if (response) {
        this.updateCrosshairUI(response.active, response.coordinates);
        this.addDebugInfo(`Crosshair status: ${response.active ? 'active' : 'inactive'}`);
      } else {
        this.updateCrosshairUI(false);
      }
    } catch (error) {
      this.addDebugInfo(`Crosshair status error: ${error.message}`);
      this.updateCrosshairUI(false);
    }
  }
  
  updateCrosshairUI(isActive, coordinates = null) {
    const statusElement = document.getElementById('crosshair-status');
    const coordsElement = document.getElementById('crosshair-coords');
    const indicator = document.getElementById('crosshair-indicator');
    
    if (statusElement) {
      statusElement.textContent = isActive ? 'Active' : 'Inactive';
    }
    
    if (coordsElement) {
      if (coordinates && coordinates.x > 0 && coordinates.y > 0) {
        coordsElement.textContent = `x: ${coordinates.x}, y: ${coordinates.y}`;
      } else {
        coordsElement.textContent = 'x: ---, y: ---';
      }
    }
    
    if (indicator) {
      indicator.className = isActive ? 'data-indicator active' : 'data-indicator';
    }
  }
  
  async checkInitialStatus() {
    const tab = await this.storageService.getCurrentTab();
    
    if (!tab) {
      this.uiController.showError('Could not get current tab');
      this.addDebugInfo('ERROR: No active tab found');
      return;
    }
    
    this.addDebugInfo(`Tab found: ${tab.url}`);
    
    // Check if this is a BigShort tab
    if (!tab.url.includes('bigshort.com')) {
      this.uiController.updateStatus('info', 'Not a BigShort tab');
      this.uiController.hideButtonsForNonBigShort();
      this.addDebugInfo('Not on BigShort domain');
      return;
    }
    
    this.addDebugInfo('BigShort domain detected');
    
    // Check current monitoring status
    const isEnabled = await this.storageService.getMonitoringStatus();
    this.addDebugInfo(`Current status: ${isEnabled ? 'enabled' : 'disabled'}`);
    
    // Set initial state
    this.isMonitoringActive = isEnabled;
    if (isEnabled) {
      this.addDebugInfo('Starting table data updates - monitoring enabled');
      this.startDataUpdates();
      this.uiController.showMonitoringActive();
    } else {
      this.addDebugInfo('Monitoring disabled');
      this.uiController.showMonitoringDisabled();
    }
  }
  
  async enableMonitoring() {
    try {
      this.addDebugInfo('Enable button clicked');
      
      // Store enabled state
      await this.storageService.setMonitoringStatus(true);
      
      // Try to send command to content script
      try {
        await this.dataService.sendMonitoringCommand('start_monitor');
        this.uiController.showMonitoringActive();
        
        // Start monitoring
        this.isMonitoringActive = true;
        this.startDataUpdates();
        
      } catch (error) {
        this.uiController.showMonitoringWarning();
      }
      
    } catch (error) {
      this.addDebugInfo(`Enable error: ${error.message}`);
      this.uiController.showError('Failed to enable monitoring');
    }
  }
  
  async disableMonitoring() {
    try {
      this.addDebugInfo('Disable button clicked');
      
      // Store disabled state
      await this.storageService.setMonitoringStatus(false);
      
      // Stop monitoring
      this.isMonitoringActive = false;
      this.stopDataUpdates();
      this.uiController.showMonitoringDisabled();
      
      // Try to send command to content script
      try {
        await this.dataService.sendMonitoringCommand('stop_monitor');
      } catch (error) {
        // Content script not responding, but we've already disabled locally
      }
      
    } catch (error) {
      this.addDebugInfo(`Disable error: ${error.message}`);
      this.uiController.showError('Failed to disable monitoring');
    }
  }
  
  async setThreshold(key, thresholdValue, absolute = false) {
    const parsed = await this.thresholdManager.setThreshold(key, thresholdValue, absolute);
    
    // Reset alarm state for this key since threshold changed
    this.alarmSystem.resetAlarmState(key);
    
    const absoluteText = absolute ? ' (absolute)' : '';
    this.addDebugInfo(`Threshold set for ${key}: ${parsed.value}${absoluteText}`);
    return parsed;
  }
  
  async clearThreshold(key) {
    await this.thresholdManager.clearThreshold(key);
    
    // Reset alarm state for this key since threshold removed
    this.alarmSystem.resetAlarmState(key);
    
    this.addDebugInfo(`Threshold cleared for ${key}`);
  }
  
  startDataUpdates() {
    if (this.updateInterval) return;
    
    // Reset all alarm states when starting monitoring
    this.alarmSystem.resetAllStates();
    
    this.updateInterval = setInterval(async () => {
      await this.updateData();
    }, 1000); // Update every second
    
    this.addDebugInfo('Started table data updates');
  }
  
  stopDataUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      
      // Reset all alarm states when stopping monitoring
      this.alarmSystem.resetAllStates();
      
      this.addDebugInfo('Stopped table data updates');
    }
  }
  
  async updateData() {
    if (!this.isMonitoringActive) {
      return;
    }
    
    const data = await this.dataService.getTableData();
    
    if (data) {
      this.processDataUpdate(data);
      this.uiController.updateDataIndicator(true);
    } else {
      this.uiController.showNoData();
      this.uiController.updateDataIndicator(false);
    }
  }
  
  processDataUpdate(data) {
    // Check for changes
    const hasChanges = JSON.stringify(data) !== JSON.stringify(this.currentTableData);
    this.addDebugInfo(`Data has changes: ${hasChanges}`);
    
    if (hasChanges || Object.keys(this.currentTableData).length === 0) {
      this.currentTableData = { ...data };
      
      // Check thresholds
      const thresholdResults = this.thresholdManager.checkAllThresholds(data);
      
      // Process alarms
      const alarmTriggers = this.alarmSystem.processThresholdResults(thresholdResults);
      
      if (alarmTriggers.length > 0) {
        this.alarmSystem.triggerAlarm(alarmTriggers);
      }
      
      // Update UI
      this.uiController.renderTableData(data, thresholdResults);
      this.addDebugInfo('Table data rendered');
    }
  }
  
  setupTestFunction() {
    window.testTableData = () => {
      const testData = {
        "Stock Price": { "Open": 100.50, "High": 105.25, "Low": 99.75, "Close": 103.80 },
        "Volume": 1250000,
        "Market Cap": 2500000000,
        "P/E Ratio": 15.6
      };
      
      this.addDebugInfo('Testing table data display with sample data');
      document.getElementById('table-data-section').style.display = 'block';
      this.processDataUpdate(testData);
      return testData;
    };
  }
  
  setupCleanup() {
    window.addEventListener('beforeunload', () => {
      this.stopDataUpdates();
      this.uiController.closeAllDropdowns();
    });
  }
}
