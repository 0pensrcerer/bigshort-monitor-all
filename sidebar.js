import { TradingMonitorSidebar } from './js/trading-monitor-sidebar.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Get tabId from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const tabId = urlParams.get('tabId');
  
  const sidebar = new TradingMonitorSidebar(tabId);
  await sidebar.initialize();
});
