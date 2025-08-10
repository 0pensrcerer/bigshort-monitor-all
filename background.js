// Background script for handling tab-specific operations and side panel

// Handle extension icon clicks to open side panel
chrome.action.onClicked.addListener((tab) => {
  // Open side panel when extension icon is clicked
  chrome.sidePanel.open({ tabId: tab.id });
});

// Handle messages from content scripts and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'get_tab_id') {
      // Return the tab ID from sender information
      const tabId = sender.tab ? sender.tab.id : null;
      sendResponse({ tabId });
    } else if (message.action === 'open_side_panel') {
      // Open side panel from content script or other sources
      chrome.sidePanel.open({ tabId: message.tabId });
      sendResponse({ success: true });
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
      // Forward data updates from content script to sidebar
      // Note: We can't directly send to sidebar, so we'll store in chrome.storage for sidebar to pick up
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

// Function to reinject content script
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
});

// Handle extension installation/startup
chrome.runtime.onInstalled.addListener(() => {
  console.log('Trading Data Monitor extension installed/updated');
});

console.log('Trading Data Monitor background script loaded');
