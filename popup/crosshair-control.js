class CrosshairControl {
  constructor() {
    this.statusElement = document.getElementById('status');
    this.coordinatesElement = document.getElementById('coordinates');
    this.showButton = document.getElementById('showCrosshair');
    this.hideButton = document.getElementById('hideCrosshair');
    this.refreshButton = document.getElementById('refreshStatus');
    
    this.initializeEventListeners();
    this.refreshStatus();
  }
  
  initializeEventListeners() {
    this.showButton.addEventListener('click', () => this.showCrosshair());
    this.hideButton.addEventListener('click', () => this.hideCrosshair());
    this.refreshButton.addEventListener('click', () => this.refreshStatus());
  }
  
  async showCrosshair() {
    try {
      this.showButton.disabled = true;
      this.showButton.textContent = 'Activating...';
      
      // Send message to active tab to show crosshair
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'showCrosshair'
      });
      
      if (response && response.success) {
        this.updateStatus(true);
        this.showNotification('Crosshair activated! Drag it to position on the chart.', 'success');
      } else {
        this.showNotification('Failed to activate crosshair. Make sure you are on the trading page.', 'error');
      }
      
    } catch (error) {
      console.error('Error showing crosshair:', error);
      this.showNotification('Error: Could not communicate with page. Refresh and try again.', 'error');
    } finally {
      this.showButton.disabled = false;
      this.showButton.textContent = 'Show Crosshair';
    }
  }
  
  async hideCrosshair() {
    try {
      this.hideButton.disabled = true;
      this.hideButton.textContent = 'Hiding...';
      
      // Send message to active tab to hide crosshair
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'hideCrosshair'
      });
      
      if (response && response.success) {
        this.updateStatus(false);
        this.showNotification('Crosshair hidden', 'success');
      } else {
        this.showNotification('Failed to hide crosshair', 'error');
      }
      
    } catch (error) {
      console.error('Error hiding crosshair:', error);
      this.showNotification('Error: Could not communicate with page', 'error');
    } finally {
      this.hideButton.disabled = false;
      this.hideButton.textContent = 'Hide Crosshair';
    }
  }
  
  async refreshStatus() {
    try {
      this.refreshButton.disabled = true;
      this.refreshButton.textContent = 'Checking...';
      
      // Query current crosshair status
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'getCrosshairCoords'
      });
      
      if (response) {
        this.updateStatus(response.active, response.coordinates);
        this.showNotification('Status updated', 'success');
      } else {
        this.updateStatus(false);
        this.showNotification('Could not get status - make sure you are on the trading page', 'warning');
      }
      
    } catch (error) {
      console.error('Error refreshing status:', error);
      this.updateStatus(false);
      this.showNotification('Page not responding - refresh and try again', 'error');
    } finally {
      this.refreshButton.disabled = false;
      this.refreshButton.textContent = 'Refresh Status';
    }
  }
  
  updateStatus(isActive, coordinates = null) {
    if (isActive) {
      this.statusElement.className = 'status active';
      this.statusElement.textContent = 'Crosshair Active';
      this.hideButton.disabled = false;
    } else {
      this.statusElement.className = 'status inactive';
      this.statusElement.textContent = 'Crosshair Inactive';
      this.hideButton.disabled = true;
    }
    
    if (coordinates && coordinates.x > 0 && coordinates.y > 0) {
      this.coordinatesElement.textContent = `x: ${coordinates.x}, y: ${coordinates.y}`;
    } else {
      this.coordinatesElement.textContent = 'x: ---, y: ---';
    }
  }
  
  showNotification(message, type = 'info') {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      max-width: 250px;
      text-align: center;
      animation: slideIn 0.3s ease;
    `;
    
    // Set colors based on type
    switch (type) {
      case 'success':
        notification.style.background = '#2d5a2d';
        notification.style.color = '#90ff90';
        notification.style.border = '1px solid #4a8a4a';
        break;
      case 'error':
        notification.style.background = '#5a2d2d';
        notification.style.color = '#ff9090';
        notification.style.border = '1px solid #8a4a4a';
        break;
      case 'warning':
        notification.style.background = '#5a4a2d';
        notification.style.color = '#ffcc90';
        notification.style.border = '1px solid #aa8844';
        break;
      default:
        notification.style.background = '#2a2a40';
        notification.style.color = '#ccccff';
        notification.style.border = '1px solid #4488ff';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { top: -50px; opacity: 0; }
        to { top: 10px; opacity: 1; }
      }
      @keyframes slideOut {
        from { top: 10px; opacity: 1; }
        to { top: -50px; opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CrosshairControl();
});
