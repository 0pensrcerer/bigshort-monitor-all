import { ThresholdManager } from './threshold-manager.js';
import { AlarmSystem } from './alarm-system.js';
import { UIController } from './ui-controller.js';
import { DataService } from './data-service.js';
import { StorageService } from './storage-service.js';

export class TradingMonitorSidebar {
  constructor(tabId = null) {
    this.tabId = tabId;
    this.debugInfo = [];
    this.currentTableData = {};
    this.updateInterval = null;
    this.isMonitoringActive = false;
    
    // Initialize services
    this.storageService = new StorageService(this.tabId);
    this.dataService = new DataService(this.tabId);
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
    const message = `${timestamp}: ${info}`;
    this.debugInfo.push(message);
    if (this.debugInfo.length > 50) this.debugInfo.shift(); // Keep last 50 entries
    
    // Update debug UI
    this.uiController.updateDebugInfo(this.debugInfo);
  }
  
  async initialize() {
    try {
      this.addDebugInfo('Sidebar script started');
      
      // Load saved thresholds
      await this.thresholdManager.loadThresholds();
      
      // Setup UI event handlers
      await this.setupUI();
      await this.checkInitialStatus();
      
      // Setup debug UI
      this.uiController.setupDebugUI();
      
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
    
    this.uiController.onOrderChanged(async (order) => {
      await this.saveDataOrder(order);
    });
    
    this.uiController.onHiddenItemsChanged(async (hiddenItems) => {
      await this.saveHiddenItems(hiddenItems);
    });
    
    this.uiController.onReRender(() => {
      this.forceDataRender();
    });
    
    // Load saved data order and hidden items
    await this.loadDataOrder();
    await this.loadHiddenItems();
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
  
  async loadDataOrder() {
    try {
      const order = await this.storageService.getDataOrder();
      this.uiController.setDataOrder(order);
      this.addDebugInfo(`Loaded data order: ${order.join(', ')}`);
    } catch (error) {
      this.addDebugInfo(`Failed to load data order: ${error.message}`);
    }
  }
  
  async saveDataOrder(order) {
    try {
      await this.storageService.saveDataOrder(order);
      this.addDebugInfo(`Saved data order: ${order.join(', ')}`);
    } catch (error) {
      this.addDebugInfo(`Failed to save data order: ${error.message}`);
    }
  }
  
  async loadHiddenItems() {
    try {
      const hiddenItems = await this.storageService.getHiddenItems();
      this.uiController.setHiddenItems(hiddenItems);
      this.addDebugInfo(`Loaded hidden items: ${hiddenItems.join(', ')}`);
    } catch (error) {
      this.addDebugInfo(`Failed to load hidden items: ${error.message}`);
    }
  }
  
  async saveHiddenItems(hiddenItems) {
    try {
      await this.storageService.saveHiddenItems(hiddenItems);
      this.addDebugInfo(`Saved hidden items: ${hiddenItems.join(', ')}`);
    } catch (error) {
      this.addDebugInfo(`Failed to save hidden items: ${error.message}`);
    }
  }
  
  forceDataRender() {
    // Re-render the UI with current data immediately
    if (this.currentTableData && Object.keys(this.currentTableData).length > 0) {
      this.addDebugInfo('Force rendering current data due to visibility change');
      const thresholdResults = this.thresholdManager.checkAllThresholds(this.currentTableData);
      this.uiController.renderTableData(this.currentTableData, thresholdResults);
    } else {
      this.addDebugInfo('No current data to render');
      this.uiController.showNoData();
    }
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
      this.addDebugInfo('Update skipped - monitoring not active');
      return;
    }
    
    this.addDebugInfo('Fetching table data...');
    const data = await this.dataService.getTableData();
    
    this.addDebugInfo(`Data fetch result: ${data ? `${Object.keys(data).length} items` : 'null/empty'}`);
    
    if (data) {
      this.addDebugInfo(`Processing data: ${JSON.stringify(data)}`);
      this.processDataUpdate(data);
      this.uiController.updateDataIndicator(true);
    } else {
      this.addDebugInfo('No data received - showing no data message');
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
      
      // Flash indicator only when data actually changes
      if (hasChanges) {
        this.uiController.updateDataIndicator(true);
      }
      
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
    
    window.resetHiddenItems = async () => {
      this.addDebugInfo('Resetting hidden items');
      this.uiController.setHiddenItems([]);
      await this.saveHiddenItems([]);
      this.addDebugInfo('Hidden items reset - all items should now be visible');
    };
    
    window.showDebugInfo = () => {
      console.log('Current debug info:', this.debugInfo);
      console.log('Hidden items:', this.uiController.hiddenItems);
      console.log('Data order:', this.uiController.dataOrder);
      console.log('Current data:', this.currentTableData);
      console.log('Is monitoring active:', this.isMonitoringActive);
    };
  }
  
  setupCleanup() {
    window.addEventListener('beforeunload', () => {
      this.stopDataUpdates();
      this.uiController.closeAllDropdowns();
    });
  }
}
