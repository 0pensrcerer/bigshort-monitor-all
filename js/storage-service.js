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
}
