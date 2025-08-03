export class ThresholdManager {
  constructor(storageService) {
    this.storage = storageService;
    this.thresholds = {};
  }
  
  async loadThresholds() {
    this.thresholds = await this.storage.getThresholds();
  }
  
  async setThreshold(key, thresholdValue, absolute = false) {
    const parsed = this.parseThresholdValue(thresholdValue);
    if (!parsed.valid) {
      throw new Error(parsed.error);
    }
    
    this.thresholds[key] = {
      value: parsed.value,
      originalInput: parsed.originalInput,
      absolute: absolute
    };
    
    await this.storage.saveThresholds(this.thresholds);
    return parsed;
  }
  
  async clearThreshold(key) {
    delete this.thresholds[key];
    await this.storage.saveThresholds(this.thresholds);
  }
  
  getThreshold(key) {
    return this.thresholds[key];
  }
  
  hasThreshold(key) {
    return this.thresholds[key] !== undefined;
  }
  
  checkAllThresholds(data) {
    const results = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (this.thresholds[key]) {
        results[key] = this.checkSingleThreshold(key, value);
      }
    });
    
    return results;
  }
  
  checkSingleThreshold(key, value) {
    const threshold = this.thresholds[key];
    const numericValue = this.parseNumericValue(value);
    
    if (numericValue === null) return null;
    
    let isAbove, isBelow;
    
    if (threshold.absolute) {
      // For absolute thresholds, check if absolute value exceeds threshold
      const absValue = Math.abs(numericValue);
      const absThreshold = Math.abs(threshold.value);
      isAbove = absValue >= absThreshold;
      isBelow = absValue < absThreshold;
    } else {
      // Normal threshold checking
      isAbove = numericValue >= threshold.value;
      isBelow = numericValue < threshold.value;
    }
    
    return {
      key,
      value: numericValue,
      threshold: threshold.value,
      absolute: threshold.absolute || false,
      isAbove,
      isBelow,
      hasThreshold: true
    };
  }
  
  parseThresholdValue(input) {
    if (!input || typeof input !== 'string') {
      return { valid: false, error: 'Invalid input' };
    }
    
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) {
      return { valid: false, error: 'Empty input' };
    }
    
    // Match number with optional suffix
    const match = trimmed.match(/^([-+]?[\d.]+)([kmgb]?)$/);
    if (!match) {
      return { valid: false, error: 'Invalid format. Use: 123, -45.6, 100k, 1.5m, 2g, 1b' };
    }
    
    const [, numberStr, suffix] = match;
    let value = parseFloat(numberStr);
    
    if (isNaN(value)) {
      return { valid: false, error: 'Invalid number' };
    }
    
    // Apply suffix multipliers
    switch (suffix) {
      case 'k': value *= 1e3; break;     // thousands
      case 'm': value *= 1e6; break;     // millions
      case 'g': 
      case 'b': value *= 1e9; break;     // billions
      default: 
        // No suffix - keep the number as is
        break;
    }
    
    return { valid: true, value, originalInput: input.trim() };
  }
  
  parseNumericValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return null;
    
    // Remove common formatting and extract number
    const cleaned = value.replace(/[,%$\s]/g, '');
    const match = cleaned.match(/([-+]?[\d.]+)([kmgb]?)/i);
    
    if (!match) return null;
    
    let num = parseFloat(match[1]);
    const suffix = match[2].toLowerCase();
    
    switch (suffix) {
      case 'k': num *= 1e3; break;     // thousands
      case 'm': num *= 1e6; break;     // millions
      case 'g': 
      case 'b': num *= 1e9; break;     // billions
      default: 
        // No suffix - keep the number as is
        break;
    }
    
    return isNaN(num) ? null : num;
  }
  
  formatThresholdValue(value) {
    if (Math.abs(value) >= 1e9) {
      return (value / 1e9).toFixed(2) + 'B';
    } else if (Math.abs(value) >= 1e6) {
      return (value / 1e6).toFixed(2) + 'M';
    } else if (Math.abs(value) >= 1e3) {
      return (value / 1e3).toFixed(1) + 'k';
    } else if (value % 1 !== 0) {
      return value.toFixed(2);
    } else {
      return value.toString();
    }
  }
}
