import { TradingMonitorSidebar } from './js/trading-monitor-sidebar.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const sidebar = new TradingMonitorSidebar();
  await sidebar.initialize();
});
