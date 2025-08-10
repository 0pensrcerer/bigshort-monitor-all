export class StorageService {
  constructor() {
    this.debugCallback = null;
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
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }
  
  async getThresholds() {
    try {
      const tab = await this.getCurrentTab();
      if (tab) {
        const thresholdKey = `thresholds_${tab.id}`;
        const result = await chrome.storage.local.get([thresholdKey]);
        const thresholds = result[thresholdKey] || {};
        this.addDebugInfo(`Loaded ${Object.keys(thresholds).length} thresholds`);
        return thresholds;
      }
      return {};
    } catch (error) {
      this.addDebugInfo(`Failed to load thresholds: ${error.message}`);
      return {};
    }
  }
  
  async saveThresholds(thresholds) {
    try {
      const tab = await this.getCurrentTab();
      if (tab) {
        const thresholdKey = `thresholds_${tab.id}`;
        await chrome.storage.local.set({ [thresholdKey]: thresholds });
        this.addDebugInfo('Thresholds saved to storage');
      }
    } catch (error) {
      this.addDebugInfo(`Failed to save thresholds: ${error.message}`);
      throw error;
    }
  }
  
  async getMonitoringStatus() {
    try {
      const tab = await this.getCurrentTab();
      if (tab) {
        const tabKey = `monitor_enabled_${tab.id}`;
        const result = await chrome.storage.local.get([tabKey]);
        return result[tabKey] !== undefined ? result[tabKey] : true; // Default to enabled
      }
      return false;
    } catch (error) {
      this.addDebugInfo(`Failed to get monitoring status: ${error.message}`);
      return false;
    }
  }
  
  async setMonitoringStatus(enabled) {
    try {
      const tab = await this.getCurrentTab();
      if (tab) {
        const tabKey = `monitor_enabled_${tab.id}`;
        await chrome.storage.local.set({ [tabKey]: enabled });
        this.addDebugInfo(`Storage updated: ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      this.addDebugInfo(`Failed to set monitoring status: ${error.message}`);
      throw error;
    }
  }
  
  async getDataOrder() {
    try {
      const tab = await this.getCurrentTab();
      if (tab) {
        const orderKey = `data_order_${tab.id}`;
        const result = await chrome.storage.local.get([orderKey]);
        const order = result[orderKey] || [];
        this.addDebugInfo(`Loaded data order with ${order.length} items`);
        return order;
      }
      return [];
    } catch (error) {
      this.addDebugInfo(`Failed to load data order: ${error.message}`);
      return [];
    }
  }
  
  async saveDataOrder(order) {
    try {
      const tab = await this.getCurrentTab();
      if (tab) {
        const orderKey = `data_order_${tab.id}`;
        await chrome.storage.local.set({ [orderKey]: order });
        this.addDebugInfo(`Data order saved with ${order.length} items`);
      }
    } catch (error) {
      this.addDebugInfo(`Failed to save data order: ${error.message}`);
      throw error;
    }
  }
  
  async getHiddenItems() {
    try {
      const tab = await this.getCurrentTab();
      if (tab) {
        const hiddenKey = `hidden_items_${tab.id}`;
        const result = await chrome.storage.local.get([hiddenKey]);
        const hiddenItems = result[hiddenKey] || [];
        this.addDebugInfo(`Loaded ${hiddenItems.length} hidden items`);
        return hiddenItems;
      }
      return [];
    } catch (error) {
      this.addDebugInfo(`Failed to load hidden items: ${error.message}`);
      return [];
    }
  }
  
  async saveHiddenItems(hiddenItems) {
    try {
      const tab = await this.getCurrentTab();
      if (tab) {
        const hiddenKey = `hidden_items_${tab.id}`;
        await chrome.storage.local.set({ [hiddenKey]: hiddenItems });
        this.addDebugInfo(`Hidden items saved: ${hiddenItems.length} items`);
      }
    } catch (error) {
      this.addDebugInfo(`Failed to save hidden items: ${error.message}`);
      throw error;
    }
  }
}
