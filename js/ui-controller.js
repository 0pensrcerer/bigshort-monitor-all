export class UIController {
  constructor(thresholdManager, dataService) {
    this.thresholdManager = thresholdManager;
    this.dataService = dataService;
    this.activeDropdown = null;
    this.debugCallback = null;
    this.dataOrder = []; // Store the current order of data items
    this.hiddenItems = []; // Store hidden item keys
    this.draggedElement = null;
    this.showHiddenItems = false; // Toggle for showing hidden items
    
    // Callback registrations
    this.enableCallback = null;
    this.disableCallback = null;
    this.thresholdSetCallback = null;
    this.thresholdClearCallback = null;
    this.orderChangedCallback = null;
    this.hiddenItemsChangedCallback = null;
    this.reRenderCallback = null;
  }
  
  setDebugCallback(callback) {
    this.debugCallback = callback;
  }
  
  getRandomColor() {
    const colors = [
      '#ff6b6b', // Red
      '#4ecdc4', // Teal
      '#45b7d1', // Blue
      '#96ceb4', // Green
      '#feca57', // Yellow
      '#ff9ff3', // Pink
      '#54a0ff', // Light Blue
      '#5f27cd', // Purple
      '#00d2d3', // Cyan
      '#ff9f43', // Orange
      '#10ac84', // Emerald
      '#ee5a24', // Red Orange
      '#0abde3', // Sky Blue
      '#8395a7', // Gray Blue
      '#222f3e', // Dark Blue
      '#c44569', // Magenta
      '#f8b500', // Amber
      '#6c5ce7', // Purple Blue
      '#fd79a8', // Light Pink
      '#00b894', // Mint Green
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
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
  
  onOrderChanged(callback) {
    this.orderChangedCallback = callback;
  }
  
  onHiddenItemsChanged(callback) {
    this.hiddenItemsChangedCallback = callback;
  }
  
  onReRender(callback) {
    this.reRenderCallback = callback;
  }
  
  setDataOrder(order) {
    this.dataOrder = [...order];
  }
  
  setHiddenItems(hiddenItems) {
    this.hiddenItems = [...hiddenItems];
  }
  
  renderTableData(data, thresholdResults) {
    const container = document.getElementById('table-data-content');
    const noDataDiv = document.getElementById('no-data');
    
    if (!container) {
      this.addDebugInfo('ERROR: table-data-content container not found');
      return;
    }
    
    this.addDebugInfo(`Rendering data with ${Object.keys(data).length} total items`);
    
    // Store any active dropdown info before clearing
    let activeDropdownKey = null;
    if (this.activeDropdown) {
      activeDropdownKey = this.activeDropdown.getAttribute('data-key');
    }
    
    // Clear existing data items
    this.clearDataItems(container);
    
    // Create ordered list of keys
    const orderedKeys = this.getOrderedKeys(data);
    const visibleKeys = orderedKeys.filter(key => !this.hiddenItems.includes(key) || this.showHiddenItems);
    const hiddenKeys = orderedKeys.filter(key => this.hiddenItems.includes(key));
    
    this.addDebugInfo(`Ordered keys: ${orderedKeys.length}, Visible: ${visibleKeys.length}, Hidden: ${hiddenKeys.length}`);
    
    // If no visible items and no hidden items to show, display no data message
    if (visibleKeys.length === 0 && (hiddenKeys.length === 0 || this.showHiddenItems)) {
      this.addDebugInfo('No visible items to render - showing no data message');
      noDataDiv.style.display = 'block';
      return;
    }
    
    // Hide no-data message since we have items to show
    noDataDiv.style.display = 'none';
    
    // Create data items for visible items
    visibleKeys.forEach(key => {
      if (data.hasOwnProperty(key)) {
        // Only apply hidden styling if we're in "show hidden mode" AND the item is still hidden
        // Unhidden items should always appear normal
        const shouldShowAsHidden = this.showHiddenItems && this.hiddenItems.includes(key);
        const item = this.createDataItem(key, data[key], thresholdResults[key], activeDropdownKey === key, shouldShowAsHidden);
        container.appendChild(item);
      }
    });
    
    // Add show/hide hidden toggle if there are hidden items
    if (hiddenKeys.length > 0) {
      const showHiddenSection = this.createShowHiddenSection(hiddenKeys.length);
      container.appendChild(showHiddenSection);
    }
    
    this.addGlobalClickHandler();
  }
  
  clearDataItems(container) {
    const existingItems = container.querySelectorAll('.data-item, .show-hidden-section');
    existingItems.forEach(item => item.remove());
  }
  
  createDataItem(key, value, thresholdResult, isActiveDropdown, isHidden = false) {
    const dataItem = document.createElement('div');
    dataItem.className = 'data-item';
    dataItem.setAttribute('data-key', key);
    dataItem.draggable = true;
    
    // Apply random color for border
    const randomColor = this.getRandomColor();
    dataItem.style.setProperty('--item-color', randomColor);
    
    // Apply hidden state
    if (isHidden) {
      dataItem.classList.add('hidden');
    }
    
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
    
    // Create hide toggle button
    const hideToggle = document.createElement('button');
    hideToggle.className = 'hide-toggle';
    hideToggle.textContent = isHidden ? '👁' : '✕';
    hideToggle.title = isHidden ? 'Show item' : 'Hide item';
    hideToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleItemVisibility(key);
    });
    
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
    dataItem.appendChild(hideToggle);
    
    // Add drag and drop event listeners
    this.addDragAndDropListeners(dataItem);
    
    // Add click listener for dropdown (only if not already active)
    if (!isActiveDropdown) {
      dataItem.addEventListener('click', (e) => {
        // Don't trigger dropdown if we're dragging
        if (dataItem.classList.contains('dragging')) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        this.closeAllDropdowns();
        this.createThresholdDropdown(key, value, dataItem);
      });
    }
    
    return dataItem;
  }
  
  getOrderedKeys(data) {
    const dataKeys = Object.keys(data);
    
    // If no saved order, return keys as they are
    if (this.dataOrder.length === 0) {
      this.dataOrder = [...dataKeys];
      return dataKeys;
    }
    
    // Filter saved order to only include current keys, then add any new keys
    const orderedKeys = this.dataOrder.filter(key => dataKeys.includes(key));
    const newKeys = dataKeys.filter(key => !this.dataOrder.includes(key));
    
    // Update stored order with any new keys
    if (newKeys.length > 0) {
      this.dataOrder = [...orderedKeys, ...newKeys];
      this.saveCurrentOrder();
    }
    
    return this.dataOrder;
  }
  
  addDragAndDropListeners(dataItem) {
    dataItem.addEventListener('dragstart', (e) => {
      this.draggedElement = dataItem;
      dataItem.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', dataItem.outerHTML);
    });
    
    dataItem.addEventListener('dragend', (e) => {
      dataItem.classList.remove('dragging');
      this.clearDragOver();
      this.draggedElement = null;
    });
    
    dataItem.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (this.draggedElement && this.draggedElement !== dataItem) {
        this.clearDragOver();
        dataItem.classList.add('drag-over');
      }
    });
    
    dataItem.addEventListener('dragleave', (e) => {
      dataItem.classList.remove('drag-over');
    });
    
    dataItem.addEventListener('drop', (e) => {
      e.preventDefault();
      
      if (this.draggedElement && this.draggedElement !== dataItem) {
        this.reorderItems(this.draggedElement, dataItem);
      }
      
      this.clearDragOver();
    });
  }
  
  clearDragOver() {
    document.querySelectorAll('.data-item').forEach(item => {
      item.classList.remove('drag-over');
    });
  }
  
  reorderItems(draggedItem, targetItem) {
    const container = document.getElementById('table-data-content');
    const draggedKey = draggedItem.getAttribute('data-key');
    const targetKey = targetItem.getAttribute('data-key');
    
    // Update the order array
    const draggedIndex = this.dataOrder.indexOf(draggedKey);
    const targetIndex = this.dataOrder.indexOf(targetKey);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged item from its current position
      this.dataOrder.splice(draggedIndex, 1);
      
      // Insert it before the target item
      const newTargetIndex = this.dataOrder.indexOf(targetKey);
      this.dataOrder.splice(newTargetIndex, 0, draggedKey);
      
      // Move DOM element
      container.insertBefore(draggedItem, targetItem);
      
      // Save the new order
      this.saveCurrentOrder();
      
      this.addDebugInfo(`Reordered: moved ${draggedKey} before ${targetKey}`);
    }
  }
  
  saveCurrentOrder() {
    if (this.orderChangedCallback) {
      this.orderChangedCallback(this.dataOrder);
    }
  }
  
  toggleItemVisibility(key) {
    const index = this.hiddenItems.indexOf(key);
    if (index > -1) {
      // Show item - remove from hidden list
      this.hiddenItems.splice(index, 1);
      this.addDebugInfo(`Showing item: ${key}`);
      
      // When unhiding an item, exit "show hidden items" mode so user sees clean list
      this.showHiddenItems = false;
    } else {
      // Hide item
      this.hiddenItems.push(key);
      this.addDebugInfo(`Hiding item: ${key}`);
      
      // When hiding an item, exit "show hidden items" mode so it disappears completely
      this.showHiddenItems = false;
    }
    
    // Save hidden items
    this.saveHiddenItems();
    
    // Trigger immediate re-render with current data
    this.triggerReRender();
  }
  
  createShowHiddenSection(hiddenCount) {
    const section = document.createElement('div');
    section.className = 'show-hidden-section';
    
    const toggle = document.createElement('button');
    toggle.className = 'show-hidden-toggle';
    
    // Set button text based on current state
    if (this.showHiddenItems) {
      toggle.textContent = `🙈 Hide ${hiddenCount} hidden item${hiddenCount > 1 ? 's' : ''}`;
    } else {
      toggle.textContent = `👁 Show ${hiddenCount} hidden item${hiddenCount > 1 ? 's' : ''}`;
    }
    
    toggle.addEventListener('click', () => {
      this.showHiddenItems = !this.showHiddenItems;
      this.addDebugInfo(`${this.showHiddenItems ? 'Showing' : 'Hiding'} hidden items`);
      // Trigger immediate re-render to toggle hidden items visibility
      this.triggerReRender();
    });
    
    section.appendChild(toggle);
    return section;
  }
  
  saveHiddenItems() {
    if (this.hiddenItemsChangedCallback) {
      this.hiddenItemsChangedCallback(this.hiddenItems);
    }
  }
  
  triggerReRender() {
    if (this.reRenderCallback) {
      this.addDebugInfo('Triggering immediate re-render');
      this.reRenderCallback();
    }
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
      
      // Add flash effect on data update
      indicator.classList.add('flash');
      setTimeout(() => {
        indicator.classList.remove('flash');
      }, 300);
    } else {
      indicator.classList.remove('active');
    }
  }
  
  hideButtonsForNonBigShort() {
    document.getElementById('button-container').style.display = 'none';
  }
  
  setupDebugUI() {
    const showDebugBtn = document.getElementById('show-debug-btn');
    const debugSection = document.getElementById('debug-section');
    const debugToggle = document.getElementById('debug-toggle');
    const restartContentBtn = document.getElementById('restart-content-btn');
    
    showDebugBtn.addEventListener('click', () => {
      debugSection.style.display = 'block';
      showDebugBtn.style.display = 'none';
    });
    
    debugToggle.addEventListener('click', () => {
      debugSection.style.display = 'none';
      showDebugBtn.style.display = 'block';
    });
    
    restartContentBtn.addEventListener('click', async () => {
      this.addDebugInfo('Restarting content script...');
      try {
        const tab = await this.getCurrentTab();
        if (tab) {
          const response = await chrome.runtime.sendMessage({ 
            action: 'reinject_content_script', 
            tabId: tab.id 
          });
          if (response.success) {
            this.addDebugInfo('Content script restarted successfully');
          } else {
            this.addDebugInfo(`Content script restart failed: ${response.error}`);
          }
        }
      } catch (error) {
        this.addDebugInfo(`Content script restart error: ${error.message}`);
      }
    });
  }
  
  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }
  
  updateDebugInfo(debugMessages) {
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
      debugInfo.textContent = debugMessages.slice(-20).join('\n'); // Show last 20 messages
    }
  }
}
