// Storage Manager Module
window.TradingMonitor = window.TradingMonitor || {};

window.TradingMonitor.StorageManager = class StorageManager {
  constructor() {
    this.currentTabId = null;
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
  
  async getCurrentTabId() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ action: 'get_tab_id' }, (response) => {
          if (chrome.runtime.lastError) {
            this.addDebugInfo('Could not get tab ID from runtime', 'warning');
            resolve(null);
          } else {
            resolve(response?.tabId || null);
          }
        });
      } else {
        resolve(null);
      }
    });
  }
  
  async isMonitoringEnabled() {
    return new Promise(async (resolve) => {
      try {
        // Try to get tab ID first
        this.currentTabId = await this.getCurrentTabId();
        
        if (!this.currentTabId) {
          // Fallback: use a URL-based key if tab ID not available
          const urlKey = `monitor_enabled_url_${window.location.hostname}${window.location.pathname}`;
          chrome.storage.local.get([urlKey], (result) => {
            if (chrome.runtime.lastError) {
              this.addDebugInfo('Storage access failed, defaulting to enabled', 'warning');
              resolve(true); // Default to enabled
            } else {
              // If no setting exists, default to enabled (true)
              resolve(result[urlKey] !== undefined ? result[urlKey] : true);
            }
          });
          return;
        }
        
        const tabKey = `monitor_enabled_${this.currentTabId}`;
        chrome.storage.local.get([tabKey], (result) => {
          if (chrome.runtime.lastError) {
            this.addDebugInfo('Storage access failed, defaulting to enabled', 'warning');
            resolve(true); // Default to enabled
          } else {
            // If no setting exists, default to enabled (true)
            const enabled = result[tabKey] !== undefined ? result[tabKey] : true;
            this.addDebugInfo(`Tab ${this.currentTabId} monitoring permission: ${enabled}`);
            resolve(enabled);
          }
        });
      } catch (error) {
        this.addDebugInfo(`Permission check error: ${error.message}`, 'error');
        resolve(true); // Default to enabled even on error
      }
    });
  }
  
  // Alias for compatibility
  async isTabEnabled() {
    return await this.isMonitoringEnabled();
  }
  
  async setTabEnabled(enabled) {
    try {
      const tabId = await this.getCurrentTabId();
      if (tabId) {
        const key = `monitor_enabled_${tabId}`;
        await chrome.storage.local.set({ [key]: enabled });
        this.addDebugInfo(`Tab ${tabId} monitoring ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        // Fallback to URL-based storage
        const urlKey = `monitor_enabled_url_${window.location.hostname}${window.location.pathname}`;
        await chrome.storage.local.set({ [urlKey]: enabled });
        this.addDebugInfo(`URL-based monitoring ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      this.addDebugInfo(`Error setting tab status: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async clearTabData() {
    try {
      const tabId = await this.getCurrentTabId();
      if (tabId) {
        const key = `monitor_enabled_${tabId}`;
        await chrome.storage.local.remove([key]);
        this.addDebugInfo(`Cleared storage for tab ${tabId}`);
      }
    } catch (error) {
      this.addDebugInfo(`Error clearing tab data: ${error.message}`, 'error');
      throw error;
    }
  }
  
  getTabId() {
    return this.currentTabId;
  }
};
