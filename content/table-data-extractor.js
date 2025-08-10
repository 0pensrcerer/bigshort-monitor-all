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
    
    this.addDebugInfo(`Found ${tables.length} tables on page`);
    
    if (tables.length === 0) {
      this.addDebugInfo('No tables found - returning empty data');
      return {};
    }

    const data = {};
    
    tables.forEach((table, index) => {
      this.addDebugInfo(`Processing table ${index + 1}`);
      const tableData = this.parseTable(table);
      this.addDebugInfo(`Table ${index + 1} extracted ${Object.keys(tableData).length} items`);
      Object.assign(data, tableData);
    });

    this.addDebugInfo(`Total extracted data: ${Object.keys(data).length} items`);
    this.updateDataHistory(data);
    return data;
  }
  
  findTooltipTables() {
    // Look for all tables that are visible and likely to be tooltips
    const tables = Array.from(document.querySelectorAll('table'));
    
    this.addDebugInfo(`Found ${tables.length} total tables on page`);
    
    // Filter for visible tables that might contain trading data
    const visibleTables = tables.filter(table => {
      const rect = table.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      const computedStyle = window.getComputedStyle(table);
      const isDisplayed = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
      
      return isVisible && isDisplayed;
    });
    
    this.addDebugInfo(`Found ${visibleTables.length} visible tables`);
    
    return visibleTables;
  }
  
  parseTable(table) {
    const rows = table.querySelectorAll('tr');
    this.addDebugInfo(`Table has ${rows.length} rows`);
    
    if (rows.length === 0) {
      this.addDebugInfo('Table has no rows');
      return {};
    }
    
    const data = {};
    let hasValidData = false;
    
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td');
      this.addDebugInfo(`Row ${rowIndex + 1} has ${cells.length} cells`);
      
      if (cells.length >= 2) {
        const key = this.extractKey(cells[0]);
        const value = this.extractValue(cells[1]);
        
        this.addDebugInfo(`Row ${rowIndex + 1}: "${key}" = "${value}"`);
        
        if (key && value !== null) {
          // Check if this looks like trading data
          if (this.isValidTradingDataKey(key)) {
            data[key] = value;
            hasValidData = true;
            this.addDebugInfo(`✓ Added valid trading data: ${key}`);
          } else {
            this.addDebugInfo(`✗ Skipped non-trading data: ${key}`);
          }
        }
      }
    });

    this.addDebugInfo(`Table parsing complete. Has valid data: ${hasValidData}`);
    return hasValidData ? data : {};
  }
  
  isValidTradingDataKey(key) {
    // List of known trading data keys
    const validKeys = [
      'Call Wall', 'Put Wall', 'Gamma Gravity', 'Zero Gamma Flip',
      'Stock Price', 'VWAP', 'MomoFlow', 'SmartFlow', 'Momo Tally', 'Smart Tally',
      'Net Call Flow', 'Net Put Flow', 'Net Unusual Call Prem', 'Net Unusual Put Prem',
      'NOFA'
    ];
    
    // Check for exact matches or partial matches with DTE suffixes
    return validKeys.some(validKey => 
      key === validKey || 
      key.startsWith(validKey + ' ') ||
      key.includes('DTE') ||
      key.includes('Martian')
    );
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
