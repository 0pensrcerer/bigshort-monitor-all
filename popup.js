document.addEventListener('DOMContentLoaded', async () => {
  // Handle opening the monitor window
  document.getElementById('open-monitor').addEventListener('click', async () => {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        alert('Could not get current tab');
        return;
      }
      
      // Check if this is a BigShort tab
      if (!tab.url.includes('bigshort.com')) {
        alert('This extension only works on BigShort.com pages');
        return;
      }
      
      // Send message to background script to open monitor window
      const response = await chrome.runtime.sendMessage({
        action: 'open_monitor_window',
        tabId: tab.id
      });
      
      if (response && response.success) {
        // Close the popup after opening the window
        window.close();
      } else {
        alert('Failed to open monitor window');
      }
      
    } catch (error) {
      console.error('Error opening monitor window:', error);
      alert('Error opening monitor window: ' + error.message);
    }
  });
});
