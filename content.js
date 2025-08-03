// Content script entry point - Check module loading
console.log('[ContentScript] Starting content script execution...');
console.log('[ContentScript] Available TradingMonitor classes:', window.TradingMonitor ? Object.keys(window.TradingMonitor) : 'TradingMonitor namespace not found');

// Initialize the trading data monitor
async function initializeMonitor() {
    try {
        // Check if TradingMonitor namespace exists
        if (!window.TradingMonitor) {
            console.error('[TradingMonitor] TradingMonitor namespace not found - modules may not have loaded');
            return;
        }
        
        // Check if TradingDataMonitor class exists
        if (!window.TradingMonitor.TradingDataMonitor) {
            console.error('[TradingMonitor] TradingDataMonitor class not found');
            return;
        }
        
        const monitor = new window.TradingMonitor.TradingDataMonitor();
        
        const success = await monitor.initialize();
        if (success) {
            console.log('[TradingMonitor] Content script loaded and initialized successfully');
            
            // Store global reference for debugging
            window.tradingDataMonitor = monitor;
        } else {
            console.error('[TradingMonitor] Failed to initialize content script');
        }
    } catch (error) {
        console.error('[TradingMonitor] Error during initialization:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMonitor);
} else {
    initializeMonitor();
}

// Global functions for manual control in console
window.manualStart = () => window.tradingDataMonitor?.manualStart();
window.manualStop = () => window.tradingDataMonitor?.manualStop();
window.manualExtract = () => window.tradingDataMonitor?.manualExtract();
window.getStatus = () => window.tradingDataMonitor?.getStatus();
window.getDiagnostics = () => window.tradingDataMonitor?.getDiagnostics();
