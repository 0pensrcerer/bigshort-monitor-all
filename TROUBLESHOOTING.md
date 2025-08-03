# Trading Data Monitor - Troubleshooting Guide

## 🔧 Common Issues & Solutions

### **Popup Buttons Don't Work**

#### **Problem:** Enable/Disable buttons are unresponsive
**Solutions:**
1. **Reload the page** - The content script may not be loaded yet
2. **Check if you're on BigShort.com** - Extension only works on bigshort.com domains
3. **Close and reopen the popup** - Try clicking the extension icon again
4. **Reload the extension** - Go to `chrome://extensions/` and click the reload button

#### **Problem:** Status shows "ENABLED (reload page to start)"
**Solutions:**
1. **Reload the current tab** - Click the "🔄 Reload Current Tab" button in troubleshooting section
2. **Wait 4 seconds after reload** - The monitor has a 4-second startup delay
3. **Check browser console** - Press F12 and look for Trading Monitor messages

### **Extension Not Working**

#### **Problem:** No console messages or activity
**Solutions:**
1. **Verify domain** - Make sure you're on `https://app.bigshort.com` or similar
2. **Check manifest permissions** - Extension only works on bigshort.com domains
3. **Reload extension** - In `chrome://extensions/`, find "Trading Data Monitor" and click reload
4. **Check for errors** - Look in browser console (F12) for error messages

#### **Problem:** "SVG elements not found" errors
**Solutions:**
1. **Wait for page to load** - Trading charts may take time to render
2. **Check page structure** - The target elements might have changed
3. **Try different page** - Some BigShort pages may not have the required chart elements

### **Table Data Not Appearing**

#### **Problem:** Mouse events trigger but no table data logged
**Solutions:**
1. **Check tooltip structure** - The page's tooltip format may have changed
2. **Verify table selector** - The extension looks for `table` elements with "Stock Price" content
3. **Inspect page elements** - Use browser developer tools to check tooltip HTML structure
4. **Try hovering manually** - See if tooltips appear when you hover over chart elements

### **Multiple Tabs Issues**

#### **Problem:** Settings not working across tabs
**Solutions:**
1. **Enable per tab** - Each BigShort tab needs to be enabled individually
2. **Check tab IDs** - Each tab gets a unique storage key
3. **Use popup on each tab** - Settings are tab-specific, not site-wide

## 🔍 Debug Information

### **Browser Console Commands**
Open browser console (F12) on BigShort page and try these commands:

```javascript
// Check extension status
window.getTradingMonitorStatus();

// Run diagnostics
window.diagnoseTradingMonitor();

// Manual start/stop
window.startTradingDataMonitor();
window.stopTradingDataMonitor();
```

### **Expected Console Messages**
When working correctly, you should see:
- `[Trading Monitor] ✅ Trading data monitor content script loaded`
- `[Trading Monitor] ℹ️ Tab X monitoring permission: true/false`
- `[Trading Monitor] ✅ Starting monitor - running every 0.5 seconds`

### **Storage Inspection**
1. Go to `chrome://extensions/`
2. Click "Details" on Trading Data Monitor
3. Click "Inspect views: background page"
4. In console, run: `chrome.storage.local.get(null, console.log)`

## 🚀 Quick Fixes

### **Reset Everything**
1. Go to `chrome://extensions/`
2. Remove Trading Data Monitor
3. Reload extension from folder
4. Go to BigShort tab
5. Click extension icon
6. Click "Enable"

### **Force Reload Content Script**
1. Open browser console (F12)
2. Run: `location.reload()`
3. Wait 4 seconds
4. Check for console messages

### **Manual Testing**
1. Go to BigShort page
2. Open console (F12)
3. Run: `document.querySelectorAll('svg').length` (should be ≥ 5)
4. Run: `document.querySelectorAll('svg')[4].querySelectorAll('rect').length` (should be ≥ 13)

## 📞 Getting Help

If issues persist:
1. **Capture debug info** - Use the "Show Debug Info" in popup
2. **Check console logs** - Screenshot any error messages
3. **Note page structure** - BigShort updates may change element targets
4. **Browser version** - Ensure you're using recent Chrome/Edge

## 🔄 Version History

**v1.0** - Initial release with tab-specific control
- Manual enable/disable per tab
- Storage-based persistence
- Troubleshooting integration
