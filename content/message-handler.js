// Message Handler Module
window.TradingMonitor = window.TradingMonitor || {};

window.TradingMonitor.MessageHandler = class MessageHandler {
  constructor(dataExtractor, monitoringController, storageManager) {
    this.dataExtractor = dataExtractor;
    this.monitoringController = monitoringController;
    this.storageManager = storageManager;
    this.debugCallback = null;
  }
  
  initialize() {
    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        this.handleMessage(request, sender, sendResponse);
        return true; // Keep the message channel open for async responses
      });
    }
  }
  
  setDebugCallback(callback) {
    this.debugCallback = callback;
  }
  
  addDebugInfo(message, type = 'info') {
    if (this.debugCallback) {
      this.debugCallback(message, type);
    }
  }
  
  async handleMessage(request, sender, sendResponse) {
    try {
      const action = request.action;
      this.addDebugInfo(`Received message: ${action}`);
      
      switch (action) {
        case 'startMonitoring':
          const startResult = await this.monitoringController.start();
          sendResponse({ success: startResult });
          break;
          
        case 'stopMonitoring':
          const stopResult = this.monitoringController.stop();
          sendResponse({ success: stopResult });
          break;
          
        case 'getStatus':
          const status = this.monitoringController.getStatus();
          sendResponse({ status });
          break;
          
        case 'getCurrentData':
          const currentData = this.monitoringController.getCurrentTableData();
          sendResponse({ 
            data: currentData,
            timestamp: Date.now()
          });
          break;
          
        case 'getDiagnostics':
          const diagnostics = this.monitoringController.getDiagnostics();
          sendResponse({ diagnostics });
          break;
          
        case 'getTabId':
          const tabId = await this.storageManager.getCurrentTabId();
          sendResponse({ tabId });
          break;
          
        case 'enableTab':
          await this.storageManager.setTabEnabled(true);
          this.addDebugInfo('Tab monitoring enabled');
          sendResponse({ success: true });
          break;
          
        case 'disableTab':
          await this.storageManager.setTabEnabled(false);
          const stopOnDisable = this.monitoringController.stop();
          this.addDebugInfo('Tab monitoring disabled');
          sendResponse({ success: true, stopped: stopOnDisable });
          break;
          
        case 'isTabEnabled':
          const enabled = await this.storageManager.isTabEnabled();
          sendResponse({ enabled });
          break;
          
        case 'clearStorage':
          await this.storageManager.clearTabData();
          this.addDebugInfo('Storage cleared for this tab');
          sendResponse({ success: true });
          break;
          
        default:
          this.addDebugInfo(`Unknown action: ${action}`, 'warning');
          sendResponse({ error: `Unknown action: ${action}` });
      }
    } catch (error) {
      this.addDebugInfo(`Message handling error: ${error.message}`, 'error');
      sendResponse({ error: error.message });
    }
  }
  
  // Helper method to send messages to background/sidebar
  async sendMessage(action, data = {}) {
    try {
      this.addDebugInfo(`Sending message: ${action}`);
      
      // Check if chrome.runtime is available
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        throw new Error('Chrome runtime not available');
      }
      
      const response = await chrome.runtime.sendMessage({
        action,
        ...data,
        tabId: await this.storageManager.getCurrentTabId()
      });
      
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      
      this.addDebugInfo(`Message sent successfully: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      if (error.message.includes('Extension context invalidated') || 
          error.message.includes('message port closed') ||
          error.message.includes('Receiving end does not exist')) {
        this.addDebugInfo('Extension context lost - storing data locally instead', 'warning');
        // Fallback: store data in local storage for sidebar to pick up
        await this.storeFallbackData(action, data);
        return { success: true, fallback: true };
      }
      this.addDebugInfo(`Failed to send message: ${error.message}`, 'error');
      throw error;
    }
  }
  
  // Fallback method to store data when extension context is lost
  async storeFallbackData(action, data) {
    try {
      const tabId = await this.storageManager.getCurrentTabId();
      if (action === 'dataUpdate' && tabId) {
        const storageKey = `latest_data_${tabId}`;
        await chrome.storage.local.set({ 
          [storageKey]: {
            data: data.data,
            timestamp: Date.now()
          }
        });
        this.addDebugInfo('Data stored in fallback storage');
      }
    } catch (fallbackError) {
      this.addDebugInfo(`Fallback storage failed: ${fallbackError.message}`, 'error');
    }
  }
  
  // Notify sidebar of data updates
  async notifyDataUpdate(data) {
    try {
      this.addDebugInfo(`Sending data update notification with ${Object.keys(data).length} items`);
      const response = await this.sendMessage('dataUpdate', { data });
      if (response && response.fallback) {
        this.addDebugInfo('Data update stored in fallback storage', 'warning');
      } else {
        this.addDebugInfo('Data update notification sent successfully');
      }
    } catch (error) {
      // Try fallback storage directly if message sending fails
      this.addDebugInfo(`Data update notification failed: ${error.message}`, 'warning');
      await this.storeFallbackData('dataUpdate', { data });
    }
  }
  
  // Notify sidebar of threshold breaches
  async notifyThresholdBreach(breach) {
    try {
      await this.sendMessage('thresholdBreach', { breach });
    } catch (error) {
      // Silently handle notification failures
      this.addDebugInfo(`Threshold breach notification failed: ${error.message}`, 'warning');
    }
  }
};;
