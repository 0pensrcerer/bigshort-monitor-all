document.addEventListener('DOMContentLoaded', async () => {
  let debugInfo = [];
  
  function addDebugInfo(info) {
    debugInfo.push(`${new Date().toLocaleTimeString()}: ${info}`);
    updateDebugDisplay();
  }
  
  function updateDebugDisplay() {
    document.getElementById('debug-text').innerHTML = debugInfo.join('<br>');
  }
  
  // Toggle troubleshooting section
  document.getElementById('show-troubleshoot').addEventListener('click', (e) => {
    e.preventDefault();
    const troubleshoot = document.getElementById('troubleshoot');
    troubleshoot.style.display = troubleshoot.style.display === 'none' ? 'block' : 'none';
  });
  
  // Toggle debug section
  document.getElementById('show-debug').addEventListener('click', (e) => {
    e.preventDefault();
    const debug = document.getElementById('debug-info');
    debug.style.display = debug.style.display === 'none' ? 'block' : 'none';
  });
  
  // Reload button
  document.getElementById('reload-btn').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.reload(tab.id);
        window.close();
      }
    } catch (error) {
      addDebugInfo(`Reload error: ${error.message}`);
    }
  });
  
  try {
    addDebugInfo('Popup script started');
    
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      updateStatus('error', 'Could not get current tab');
      addDebugInfo('ERROR: No active tab found');
      return;
    }
    
    addDebugInfo(`Tab found: ${tab.url}`);
    
    // Check if this is a BigShort tab
    if (!tab.url.includes('bigshort.com')) {
      updateStatus('info', 'Not a BigShort tab');
      document.getElementById('current-url').textContent = 'Not on BigShort.com';
      document.getElementById('button-container').style.display = 'none';
      addDebugInfo('Not on BigShort domain');
      return;
    }
    
    addDebugInfo('BigShort domain detected');
    
    // Display current URL (truncated for display)
    const displayUrl = tab.url.length > 60 ? tab.url.substring(0, 60) + '...' : tab.url;
    document.getElementById('current-url').textContent = displayUrl;
    
    // Create unique key for this tab
    const tabKey = `monitor_enabled_${tab.id}`;
    addDebugInfo(`Storage key: ${tabKey}`);
    
    // Check current status
    const result = await chrome.storage.local.get([tabKey]);
    const isEnabled = result[tabKey] || false;
    
    addDebugInfo(`Current status: ${isEnabled ? 'enabled' : 'disabled'}`);
    updateStatus(isEnabled ? 'enabled' : 'disabled', isEnabled ? 'MONITORING ACTIVE' : 'MONITORING DISABLED');
    
    // Enable button click handler
    document.getElementById('enable-btn').addEventListener('click', async () => {
      try {
        addDebugInfo('Enable button clicked');
        
        // Store enabled state
        await chrome.storage.local.set({ [tabKey]: true });
        addDebugInfo('Storage updated: enabled');
        
        // Try to send message to content script
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'start_monitor' });
          addDebugInfo(`Content script response: ${JSON.stringify(response)}`);
          updateStatus('enabled', 'MONITORING ACTIVE');
        } catch (error) {
          addDebugInfo(`Content script not responding: ${error.message}`);
          updateStatus('warning', 'ENABLED (reload page to start)');
          
          // Show troubleshooting automatically if content script fails
          document.getElementById('troubleshoot').style.display = 'block';
        }
        
      } catch (error) {
        addDebugInfo(`Enable error: ${error.message}`);
        updateStatus('error', 'Failed to enable monitoring');
      }
    });
    
    // Disable button click handler
    document.getElementById('disable-btn').addEventListener('click', async () => {
      try {
        addDebugInfo('Disable button clicked');
        
        // Store disabled state
        await chrome.storage.local.set({ [tabKey]: false });
        addDebugInfo('Storage updated: disabled');
        
        // Try to send message to content script
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'stop_monitor' });
          addDebugInfo(`Content script response: ${JSON.stringify(response)}`);
          updateStatus('disabled', 'MONITORING DISABLED');
        } catch (error) {
          addDebugInfo(`Content script not responding: ${error.message}`);
          updateStatus('disabled', 'MONITORING DISABLED');
        }
        
      } catch (error) {
        addDebugInfo(`Disable error: ${error.message}`);
        updateStatus('error', 'Failed to disable monitoring');
      }
    });
    
    addDebugInfo('Popup initialization complete');
    
  } catch (error) {
    addDebugInfo(`Popup error: ${error.message}`);
    console.error('Popup error:', error);
    updateStatus('error', 'Error loading popup');
  }
});

function updateStatus(type, message) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

// Additional troubleshooting functions
window.testExtensionAPI = async function() {
  try {
    const tabs = await chrome.tabs.query({});
    console.log('Extension API working, found tabs:', tabs.length);
    return true;
  } catch (error) {
    console.error('Extension API test failed:', error);
    return false;
  }
};

window.testStorage = async function() {
  try {
    await chrome.storage.local.set({ test: 'value' });
    const result = await chrome.storage.local.get(['test']);
    console.log('Storage test result:', result);
    return result.test === 'value';
  } catch (error) {
    console.error('Storage test failed:', error);
    return false;
  }
};

// Export debug info for troubleshooting
window.getDebugInfo = function() {
  return document.getElementById('debug-text').innerHTML;
};
