// Background script for handling tab-specific operations and monitor windows

let monitorWindows = new Map(); // Track monitor windows by tab ID

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'get_tab_id') {
      // Return the tab ID from sender information
      const tabId = sender.tab ? sender.tab.id : null;
      sendResponse({ tabId });
    } else if (message.action === 'open_monitor_window') {
      // Open monitor window for specific tab
      openMonitorWindow(message.tabId)
        .then((windowId) => sendResponse({ success: true, windowId }))
        .catch(error => sendResponse({ error: error.message }));
    } else if (message.action === 'reinject_content_script') {
      // Reinject content script if it's not responding
      const tabId = message.tabId;
      if (tabId) {
        reinjectContentScript(tabId)
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ error: error.message }));
      } else {
        sendResponse({ error: 'No tab ID provided' });
      }
    } else if (message.action === 'dataUpdate') {
      // Forward data updates from content script to monitor window
      const tabId = sender.tab ? sender.tab.id : message.tabId;
      if (tabId) {
        const storageKey = `latest_data_${tabId}`;
        chrome.storage.local.set({ 
          [storageKey]: {
            data: message.data,
            timestamp: Date.now()
          }
        });
      }
      sendResponse({ success: true });
    } else if (message.action === 'thresholdBreach') {
      // Forward threshold breach notifications
      const tabId = sender.tab ? sender.tab.id : message.tabId;
      if (tabId) {
        const storageKey = `threshold_breach_${tabId}`;
        chrome.storage.local.set({ 
          [storageKey]: {
            breach: message.breach,
            timestamp: Date.now()
          }
        });
      }
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Background script error:', error);
    sendResponse({ error: error.message });
  }
  
  return true; // Keep message channel open
});

// Function to open monitor window for a specific tab
async function openMonitorWindow(tabId) {
  try {
    // Check if tab exists and is accessible
    const tab = await chrome.tabs.get(tabId);
    
    if (!tab.url.includes('bigshort.com')) {
      throw new Error('Tab is not on BigShort domain');
    }
    
    // Check if window already exists for this tab
    if (monitorWindows.has(tabId)) {
      const existingWindowId = monitorWindows.get(tabId);
      try {
        // Try to focus existing window
        const existingWindow = await chrome.windows.get(existingWindowId);
        await chrome.windows.update(existingWindowId, { focused: true });
        return existingWindowId;
      } catch (error) {
        // Window doesn't exist anymore, remove from tracking
        monitorWindows.delete(tabId);
      }
    }
    
    // Create new monitor window
    const window = await chrome.windows.create({
      url: `sidebar.html?tabId=${tabId}`,
      type: 'popup',
      width: 450,
      height: 700,
      focused: true
    });
    
    // Track the window
    monitorWindows.set(tabId, window.id);
    
    console.log(`Monitor window created for tab ${tabId}: window ${window.id}`);
    return window.id;
  } catch (error) {
    console.error(`Failed to open monitor window for tab ${tabId}:`, error);
    throw error;
  }
}
async function reinjectContentScript(tabId) {
  try {
    // Check if tab exists and is accessible
    const tab = await chrome.tabs.get(tabId);
    
    if (!tab.url.includes('bigshort.com')) {
      throw new Error('Tab is not on BigShort domain');
    }
    
    // Inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    
    console.log(`Content script reinjected for tab ${tabId}`);
    return true;
  } catch (error) {
    console.error(`Failed to reinject content script for tab ${tabId}:`, error);
    throw error;
  }
}

// Clean up storage when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  // Clean up storage for closed tab
  const tabKey = `monitor_enabled_${tabId}`;
  chrome.storage.local.remove([tabKey]).catch(() => {
    // Ignore errors - storage might not exist
  });
  
  // Close monitor window if it exists
  if (monitorWindows.has(tabId)) {
    const windowId = monitorWindows.get(tabId);
    chrome.windows.remove(windowId).catch(() => {
      // Ignore errors - window might already be closed
    });
    monitorWindows.delete(tabId);
  }
});

// Clean up tracking when windows are closed
chrome.windows.onRemoved.addListener((windowId) => {
  // Find and remove the window from our tracking
  for (const [tabId, trackedWindowId] of monitorWindows.entries()) {
    if (trackedWindowId === windowId) {
      monitorWindows.delete(tabId);
      break;
    }
  }
});

// Handle extension installation/startup
chrome.runtime.onInstalled.addListener(() => {
  console.log('Trading Data Monitor extension installed/updated');
});

console.log('Trading Data Monitor background script loaded');
