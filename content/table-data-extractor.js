// Table Data Extractor Module
window.TradingMonitor = window.TradingMonitor || {};

window.TradingMonitor.TableDataExtractor = class TableDataExtractor {
  constructor() {
    this.currentData = {};
    this.previousData = {};
    this.debugCallback = null;
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
  
  extractCurrentTableData() {
    const tables = this.findTooltipTables();
    
    if (tables.length === 0) {
      return {};
    }

    const data = {};
    
    tables.forEach(table => {
      const tableData = this.parseTable(table);
      Object.assign(data, tableData);
    });

    this.updateDataHistory(data);
    return data;
  }
  
  findTooltipTables() {
    return document.querySelectorAll('table');
  }
  
  parseTable(table) {
    // Check if this is a valid trading data table
    const firstCell = table.querySelector('tr td');
    if (!firstCell || !firstCell.textContent.includes("Stock Price")) {
      return {};
    }
    
    const data = {};
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const key = this.extractKey(cells[0]);
        const value = this.extractValue(cells[1]);
        
        if (key && value !== null) {
          data[key] = value;
        }
      }
    });

    return data;
  }
  
  extractKey(cell) {
    return cell.textContent
      .replace(/●/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  extractValue(cell) {
    const valueText = cell.textContent.trim();
    return this.parseValue(valueText);
  }
  
  parseValue(text) {
    // Handle multi-line values (like Stock Price with Open, High, Low, Close)
    if (text.includes('Open:')) {
      const values = {};
      const openMatch = text.match(/Open:\s*([\d.]+)/);
      const highMatch = text.match(/High:\s*([\d.]+)/);
      const lowMatch = text.match(/Low:\s*([\d.]+)/);
      const closeMatch = text.match(/Close:\s*([\d.]+)/);
      
      if (openMatch) values.Open = parseFloat(openMatch[1]);
      if (highMatch) values.High = parseFloat(highMatch[1]);
      if (lowMatch) values.Low = parseFloat(lowMatch[1]);
      if (closeMatch) values.Close = parseFloat(closeMatch[1]);
      
      return values;
    }
    
    // Handle single values with suffixes
    const match = text.match(/([-]?[\d.]+)([kM]?)/);
    if (match) {
      let value = parseFloat(match[1]);
      const suffix = match[2];
      
      if (suffix === 'k') value *= 1e3;
      if (suffix === 'M') value *= 1e6;
      
      return value;
    }
    
    return text; // Return as string if no number found
  }
  
  updateDataHistory(newData) {
    this.previousData = { ...this.currentData };
    this.currentData = newData;
  }
  
  getCurrentData() {
    return this.currentData;
  }
  
  hasDataChanged() {
    return this.compareData(this.currentData, this.previousData);
  }
  
  compareData(newData, oldData) {
    // Check if data has changed
    const newKeys = Object.keys(newData || {});
    const oldKeys = Object.keys(oldData || {});
    
    // Different number of keys = changed
    if (newKeys.length !== oldKeys.length) return true;
    
    // Check each key-value pair
    for (const key of newKeys) {
      if (!(key in oldData)) return true;
      
      const newValue = newData[key];
      const oldValue = oldData[key];
      
      // Handle nested objects (like Stock Price)
      if (typeof newValue === 'object' && typeof oldValue === 'object') {
        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) return true;
      } else if (newValue !== oldValue) {
        return true;
      }
    }
    
    return false;
  }
  
  logDataUpdate() {
    if (this.hasDataChanged() && Object.keys(this.currentData).length > 0) {
      this.addDebugInfo('📊 Table data updated:');
      this.addDebugInfo('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      Object.entries(this.currentData).forEach(([key, value]) => {
        if (typeof value === 'object') {
          this.addDebugInfo(`${key}: ${JSON.stringify(value)}`);
        } else {
          this.addDebugInfo(`${key}: ${value}`);
        }
      });
      
      this.addDebugInfo('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Update previous data for next comparison
      this.previousData = { ...this.currentData };
      
      // Trigger data change callback if set
      if (this.onDataChange && typeof this.onDataChange === 'function') {
        this.onDataChange(this.currentData);
      }
    }
  }
};
