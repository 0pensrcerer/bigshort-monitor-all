export class DataService {
  constructor(tabId = null) {
    this.debugCallback = null;
    this.tabId = tabId;
  }
  
  setDebugCallback(callback) {
    this.debugCallback = callback;
  }
  
  addDebugInfo(message) {
    if (this.debugCallback) {
      this.debugCallback(message);
    }
  }
  
  async getCurrentTab() {
    // If tabId is provided (popup window), use it
    if (this.tabId) {
      try {
        const tab = await chrome.tabs.get(parseInt(this.tabId));
        return tab;
      } catch (error) {
        this.addDebugInfo(`Failed to get tab ${this.tabId}: ${error.message}`);
        return null;
      }
    }
    
    // Otherwise get the active tab (sidepanel mode)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    } catch (error) {
      this.addDebugInfo(`Failed to get active tab: ${error.message}`);
      return null;
    }
  }
  
  async getTableData() {
    try {
      const tab = await this.getCurrentTab();
      if (!tab || !tab.url.includes('bigshort.com')) {
        this.addDebugInfo(`Update skipped - tab: ${!!tab}, bigshort: ${tab?.url.includes('bigshort.com')}`);
        return null;
      }
      
      this.addDebugInfo(`Checking for data updates for tab ${tab.id}`);
      
      // First, try to get data from storage (for real-time updates)
      const storageData = await this.getDataFromStorage(tab.id);
      if (storageData) {
        this.addDebugInfo(`Received data from storage with ${Object.keys(storageData).length} items`);
        return storageData;
      } else {
        this.addDebugInfo('No data found in storage, trying direct content script request');
      }
      
      // Fallback: Request table data from content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCurrentData' });
      this.addDebugInfo(`Received response: ${JSON.stringify(response)}`);
      
      if (response && response.data && Object.keys(response.data).length > 0) {
        this.addDebugInfo(`Received table data with ${Object.keys(response.data).length} items`);
        return response.data;
      } else {
        this.addDebugInfo('No table data or empty data received');
        return null;
      }
      
    } catch (error) {
      this.addDebugInfo(`Table data update error: ${error.message}`);
      
      // If content script is not responding, try to reinject it
      if (error.message.includes('Could not establish connection') || 
          error.message.includes('Receiving end does not exist')) {
        this.addDebugInfo('Content script not responding - attempting to reinject...');
        try {
          const tab = await this.getCurrentTab();
          if (tab) {
            await chrome.runtime.sendMessage({ 
              action: 'reinject_content_script', 
              tabId: tab.id 
            });
            this.addDebugInfo('Content script reinjection requested');
          }
        } catch (reinjectError) {
          this.addDebugInfo(`Failed to reinject content script: ${reinjectError.message}`);
        }
      }
      
      return null;
    }
  }
  
  async getDataFromStorage(tabId) {
    try {
      const storageKey = `latest_data_${tabId}`;
      this.addDebugInfo(`Checking storage key: ${storageKey}`);
      
      const result = await chrome.storage.local.get([storageKey]);
      this.addDebugInfo(`Storage result: ${JSON.stringify(result)}`);
      
      if (result[storageKey] && result[storageKey].data) {
        // Check if data is recent (within last 30 seconds)
        const age = Date.now() - result[storageKey].timestamp;
        this.addDebugInfo(`Data age: ${age}ms (max 30000ms)`);
        
        if (age < 30000) {
          this.addDebugInfo('Using recent storage data');
          return result[storageKey].data;
        } else {
          this.addDebugInfo('Storage data too old, skipping');
        }
      } else {
        this.addDebugInfo('No data found in storage');
      }
      return null;
    } catch (error) {
      this.addDebugInfo(`Storage data retrieval error: ${error.message}`);
      return null;
    }
  }
  
  async sendMonitoringCommand(action) {
    try {
      const tab = await this.getCurrentTab();
      if (tab) {
        const response = await chrome.tabs.sendMessage(tab.id, { action });
        this.addDebugInfo(`Content script response: ${JSON.stringify(response)}`);
        return response;
      }
      return null;
    } catch (error) {
      this.addDebugInfo(`Content script not responding: ${error.message}`);
      throw error;
    }
  }
  
  formatValue(value) {
    if (typeof value === 'number') {
      // Format numbers with appropriate precision
      if (value >= 1000000) {
        return (value / 1000000).toFixed(2) + 'M';
      } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'k';
      } else if (value % 1 !== 0) {
        return value.toFixed(2);
      } else {
        return value.toString();
      }
    }
    return String(value);
  }
  
  formatNestedValue(obj) {
    return Object.entries(obj)
      .map(([key, value]) => `${key}: ${this.formatValue(value)}`)
      .join('<br>');
  }
  
  formatCurrentValue(currentValue) {
    if (typeof currentValue === 'object' && currentValue !== null) {
      // For nested objects, show a summary
      const entries = Object.entries(currentValue);
      if (entries.length <= 3) {
        return entries.map(([k, v]) => `${k}: ${this.formatValue(v)}`).join(', ');
      } else {
        return `Object with ${entries.length} properties`;
      }
    } else {
      return this.formatValue(currentValue);
    }
  }
}
