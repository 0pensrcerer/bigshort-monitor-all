export class UIController {
  constructor(thresholdManager, dataService) {
    this.thresholdManager = thresholdManager;
    this.dataService = dataService;
    this.activeDropdown = null;
    this.debugCallback = null;
    
    // Callback registrations
    this.enableCallback = null;
    this.disableCallback = null;
    this.thresholdSetCallback = null;
    this.thresholdClearCallback = null;
  }
  
  setDebugCallback(callback) {
    this.debugCallback = callback;
  }
  
  addDebugInfo(message) {
    if (this.debugCallback) {
      this.debugCallback(message);
    }
  }
  
  onEnableClicked(callback) {
    this.enableCallback = callback;
    document.getElementById('enable-btn').addEventListener('click', callback);
  }
  
  onDisableClicked(callback) {
    this.disableCallback = callback;
    document.getElementById('disable-btn').addEventListener('click', callback);
  }
  
  onThresholdSet(callback) {
    this.thresholdSetCallback = callback;
  }
  
  onThresholdClear(callback) {
    this.thresholdClearCallback = callback;
  }
  
  renderTableData(data, thresholdResults) {
    const container = document.getElementById('table-data-content');
    const noDataDiv = document.getElementById('no-data');
    
    if (!container) {
      this.addDebugInfo('ERROR: table-data-content container not found');
      return;
    }
    
    // Store any active dropdown info before clearing
    let activeDropdownKey = null;
    if (this.activeDropdown) {
      activeDropdownKey = this.activeDropdown.getAttribute('data-key');
    }
    
    // Hide no-data message
    noDataDiv.style.display = 'none';
    
    // Clear existing data items
    this.clearDataItems(container);
    
    // Create data items for each key-value pair
    Object.entries(data).forEach(([key, value]) => {
      const item = this.createDataItem(key, value, thresholdResults[key], activeDropdownKey === key);
      container.appendChild(item);
    });
    
    this.addGlobalClickHandler();
  }
  
  clearDataItems(container) {
    const existingItems = container.querySelectorAll('.data-item');
    existingItems.forEach(item => item.remove());
  }
  
  createDataItem(key, value, thresholdResult, isActiveDropdown) {
    const dataItem = document.createElement('div');
    dataItem.className = 'data-item changed';
    dataItem.setAttribute('data-key', key);
    
    // Apply threshold styling
    if (thresholdResult && thresholdResult.hasThreshold) {
      dataItem.classList.add('has-threshold');
      if (thresholdResult.isAbove) {
        dataItem.classList.add('threshold-exceeded');
      } else {
        dataItem.classList.add('threshold-set');
      }
    }
    
    // Restore dropdown active state
    if (isActiveDropdown) {
      dataItem.classList.add('dropdown-active');
    }
    
    // Create label
    const label = document.createElement('div');
    label.className = 'data-label';
    label.textContent = key;
    
    // Create value display
    const valueDiv = document.createElement('div');
    valueDiv.className = 'data-value';
    
    if (typeof value === 'object' && value !== null) {
      valueDiv.innerHTML = this.dataService.formatNestedValue(value);
    } else {
      valueDiv.textContent = this.dataService.formatValue(value);
    }
    
    // Add threshold indicators
    if (thresholdResult && thresholdResult.hasThreshold) {
      const threshold = this.thresholdManager.getThreshold(key);
      
      const thresholdIndicator = document.createElement('span');
      thresholdIndicator.className = 'threshold-indicator';
      
      let thresholdText = `T: ${this.thresholdManager.formatThresholdValue(threshold.value)}`;
      if (threshold.absolute) {
        thresholdText += ' (±)';
      }
      thresholdIndicator.textContent = thresholdText;
      
      const statusIcon = document.createElement('span');
      statusIcon.className = 'threshold-icon';
      statusIcon.textContent = thresholdResult.isAbove ? '⚠️' : '🎯';
      
      dataItem.appendChild(thresholdIndicator);
      dataItem.appendChild(statusIcon);
    }
    
    dataItem.appendChild(label);
    dataItem.appendChild(valueDiv);
    
    // Add click listener for dropdown (only if not already active)
    if (!isActiveDropdown) {
      dataItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        this.closeAllDropdowns();
        this.createThresholdDropdown(key, value, dataItem);
      });
    }
    
    // Remove animation class after delay
    setTimeout(() => {
      dataItem.classList.remove('changed');
    }, 1000);
    
    return dataItem;
  }
  
  createThresholdDropdown(dataKey, currentValue, triggerElement) {
    const dropdown = document.createElement('div');
    dropdown.className = 'threshold-dropdown';
    dropdown.setAttribute('data-key', dataKey);
    
    const displayValue = this.dataService.formatCurrentValue(currentValue);
    
    dropdown.innerHTML = `
      <div class="dropdown-header">Set Threshold for "${dataKey}"</div>
      <div class="threshold-input-group">
        <input type="text" class="threshold-input" placeholder="e.g. 100, -50, 1.5k, 2m" />
        <button class="threshold-btn btn-save">Save</button>
      </div>
      <div class="threshold-checkbox-group">
        <label class="threshold-checkbox-label">
          <input type="checkbox" class="threshold-absolute-checkbox" />
          <span class="checkmark"></span>
          Absolute (alarm on ±threshold)
        </label>
      </div>
      <div class="threshold-input-group">
        <button class="threshold-btn btn-clear">Clear</button>
        <button class="threshold-btn btn-close">Close</button>
      </div>
      <div class="threshold-examples">
        Examples: 100, -45.6, 100k, 1.5m, 2g, 1b<br>
        Current value: ${displayValue}<br>
        <span class="absolute-help">Absolute: alarm when value crosses ±threshold (e.g., 1000 triggers at 1000 or -1000)</span>
      </div>
      <div class="threshold-status"></div>
    `;
    
    this.setupDropdownEvents(dropdown, dataKey, triggerElement);
    this.positionDropdown(dropdown, triggerElement);
    
    // Store reference
    this.activeDropdown = dropdown;
    
    return dropdown;
  }
  
  setupDropdownEvents(dropdown, dataKey, triggerElement) {
    const input = dropdown.querySelector('.threshold-input');
    const absoluteCheckbox = dropdown.querySelector('.threshold-absolute-checkbox');
    const saveBtn = dropdown.querySelector('.btn-save');
    const clearBtn = dropdown.querySelector('.btn-clear');
    const closeBtn = dropdown.querySelector('.btn-close');
    const status = dropdown.querySelector('.threshold-status');
    
    // Pre-populate with existing threshold
    const existingThreshold = this.thresholdManager.getThreshold(dataKey);
    if (existingThreshold) {
      input.value = existingThreshold.originalInput || this.thresholdManager.formatThresholdValue(existingThreshold.value);
      if (existingThreshold.absolute) {
        absoluteCheckbox.checked = true;
      }
    }
    
    // Save threshold
    const saveThreshold = async () => {
      try {
        await this.thresholdSetCallback(dataKey, input.value, absoluteCheckbox.checked);
        status.textContent = 'Saved successfully!';
        status.className = 'threshold-status status-success';
        
        setTimeout(() => {
          this.closeDropdown(dropdown, triggerElement);
        }, 1500);
      } catch (error) {
        status.textContent = error.message;
        status.className = 'threshold-status status-error';
      }
    };
    
    // Clear threshold
    const clearThreshold = async () => {
      try {
        await this.thresholdClearCallback(dataKey);
        status.textContent = 'Threshold cleared';
        status.className = 'threshold-status status-info';
        
        setTimeout(() => {
          this.closeDropdown(dropdown, triggerElement);
        }, 1000);
      } catch (error) {
        status.textContent = error.message;
        status.className = 'threshold-status status-error';
      }
    };
    
    // Close dropdown
    const closeDropdown = () => {
      this.closeDropdown(dropdown, triggerElement);
    };
    
    // Event listeners
    saveBtn.addEventListener('click', saveThreshold);
    clearBtn.addEventListener('click', clearThreshold);
    closeBtn.addEventListener('click', closeDropdown);
    
    // Keyboard events
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveThreshold();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
      }
    });
    
    // Focus input
    setTimeout(() => input.focus(), 100);
  }
  
  positionDropdown(dropdown, triggerElement) {
    // Add to document body for fixed positioning
    document.body.appendChild(dropdown);
    
    const positionDropdown = () => {
      const rect = triggerElement.getBoundingClientRect();
      
      let top = rect.bottom + 5;
      let left = rect.right - 250;
      
      // Ensure dropdown stays within viewport
      if (left < 10) left = 10;
      if (left + 250 > window.innerWidth - 10) {
        left = window.innerWidth - 260;
      }
      
      // If dropdown would go below viewport, position above
      if (top + 200 > window.innerHeight) {
        top = rect.top - 200;
      }
      
      dropdown.style.left = left + 'px';
      dropdown.style.top = top + 'px';
    };
    
    // Position and show
    positionDropdown();
    setTimeout(() => {
      dropdown.classList.add('show');
    }, 10);
    
    // Mark trigger as active
    triggerElement.classList.add('dropdown-active');
    
    // Reposition on window events
    const repositionHandler = () => positionDropdown();
    window.addEventListener('resize', repositionHandler);
    window.addEventListener('scroll', repositionHandler);
    
    // Store cleanup function
    dropdown._cleanup = () => {
      window.removeEventListener('resize', repositionHandler);
      window.removeEventListener('scroll', repositionHandler);
    };
  }
  
  closeDropdown(dropdown, triggerElement) {
    if (dropdown._cleanup) {
      dropdown._cleanup();
    }
    dropdown.remove();
    triggerElement.classList.remove('dropdown-active');
    
    if (this.activeDropdown === dropdown) {
      this.activeDropdown = null;
    }
  }
  
  closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.threshold-dropdown');
    dropdowns.forEach(dropdown => {
      if (dropdown._cleanup) {
        dropdown._cleanup();
      }
      dropdown.remove();
    });
    
    // Remove active states
    document.querySelectorAll('.dropdown-active').forEach(item => {
      item.classList.remove('dropdown-active');
    });
    
    this.activeDropdown = null;
  }
  
  addGlobalClickHandler() {
    // Remove existing handler to prevent duplicates
    document.removeEventListener('click', this.globalClickHandler);
    
    // Add new handler
    this.globalClickHandler = (e) => {
      if (!e.target.closest('.threshold-dropdown') && !e.target.closest('.data-item')) {
        this.closeAllDropdowns();
      }
    };
    
    document.addEventListener('click', this.globalClickHandler);
  }
  
  showNoData() {
    const noDataDiv = document.getElementById('no-data');
    noDataDiv.style.display = 'block';
    
    const container = document.getElementById('table-data-content');
    this.clearDataItems(container);
  }
  
  showMonitoringActive() {
    this.updateStatus('enabled', 'MONITORING ACTIVE');
    document.getElementById('table-data-section').style.display = 'block';
  }
  
  showMonitoringDisabled() {
    this.updateStatus('disabled', 'MONITORING DISABLED');
    this.showNoData();
  }
  
  showMonitoringWarning() {
    this.updateStatus('warning', 'ENABLED (reload page to start)');
  }
  
  showError(message) {
    this.updateStatus('error', message);
  }
  
  updateStatus(type, message) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
  }
  
  updateDataIndicator(active) {
    const indicator = document.getElementById('data-indicator');
    if (active) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }
  }
  
  hideButtonsForNonBigShort() {
    document.getElementById('button-container').style.display = 'none';
  }
}
