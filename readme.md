# Trading Data Monitor

A Chrome extension that automatically monitors BigShort trading chart data with real-time threshold alarms and side panel interface.

## Features

- 🎯 **Automatic Data Monitoring** - Simulates mouseover events to extract trading data every 0.5 seconds
- 📊 **Real-time Data Display** - Shows all trading metrics in a clean side panel interface
- 🚨 **Threshold Alarms** - Set custom thresholds with audible alerts when crossed
- ⚖️ **Absolute Thresholds** - Support for ± threshold triggering (e.g., alarm at both +1000 and -1000)
- 🔧 **Modular Architecture** - Clean, maintainable code following Dave Farley principles
- 📱 **Tab-specific Control** - Enable/disable monitoring per browser tab

## Installation & Setup

### Step 1: Download the Extension

Clone or download this repository to your local machine:

```bash
git clone https://github.com/cx-benjamin-simpson/bigshort-monitor-all.git
cd bigshort-monitor-all
```

### Step 2: Enable Developer Mode in Chrome

1. Open Google Chrome
2. Navigate to **Chrome Extensions page**:
   - Type `chrome://extensions/` in the address bar, OR
   - Click the three dots menu → **More Tools** → **Extensions**

3. **Enable Developer Mode**:
   - Look for the "Developer mode" toggle in the top-right corner
   - Click the toggle to turn it **ON** (it should be blue/enabled)

### Step 3: Load the Extension

1. Click the **"Load unpacked"** button (appears after enabling Developer mode)

2. **Navigate to the project folder**:
   - Browse to the folder where you downloaded/cloned this project
   - Select the folder containing `manifest.json` (the root folder)
   - Click **"Select Folder"**

3. **Verify Installation**:
   - The extension should appear in your extensions list
   - You should see "Trading Data Monitor" with a puzzle piece icon
   - Make sure the extension is **enabled** (toggle is blue)

### Step 4: Pin the Extension (Optional but Recommended)

1. Click the **puzzle piece icon** (🧩) in Chrome's toolbar
2. Find "Trading Data Monitor" in the dropdown
3. Click the **pin icon** to add it to your toolbar for easy access

## Usage

### Basic Operation

1. **Navigate to BigShort.com**:
   - Go to any BigShort trading chart page
   - The extension automatically detects BigShort pages

2. **Open the Side Panel**:
   - Click the Trading Data Monitor extension icon in your toolbar
   - The side panel will open on the right side of your browser

3. **Start Monitoring**:
   - Click the **"Enable"** button in the side panel
   - The extension will start monitoring chart data automatically
   - Data will appear in real-time as it's detected

### Setting Thresholds

1. **Click any data item** in the side panel to open the threshold dropdown
2. **Enter a threshold value**:
   - Examples: `100`, `-50`, `1.5k`, `2m`, `1b`
   - Supports: k (thousands), m (millions), g/b (billions)
3. **Choose threshold type**:
   - **Normal**: Triggers when value crosses threshold in one direction
   - **Absolute**: Check the "Absolute" box to trigger on ±threshold
4. **Save the threshold** - You'll get visual and audio alerts when crossed

### Managing Monitoring

- **Enable/Disable**: Use the Enable/Disable buttons per tab
- **Clear Thresholds**: Click any data item → "Clear" to remove thresholds
- **Tab-specific**: Each browser tab can be enabled/disabled independently

## Technical Architecture

### Modular Design

The extension follows Dave Farley's clean architecture principles:

**Content Script Modules** (`content/` folder):
- `ChartTargeting` - SVG element targeting and validation
- `MouseEventSimulator` - Mouse event creation and dispatching  
- `TableDataExtractor` - Tooltip table parsing and data comparison
- `StorageManager` - Chrome storage and tab ID management
- `MonitoringController` - Orchestrates monitoring cycle and timing
- `MessageHandler` - Chrome runtime message processing
- `TradingDataMonitor` - Main orchestrator with dependency injection

**Sidebar Modules** (`js/` folder):
- `TradingMonitorSidebar` - Main sidebar orchestrator
- `ThresholdManager` - Threshold parsing, storage, and validation
- `AlarmSystem` - Audio alerts and alarm state management
- `StorageService` - Chrome storage operations
- `DataService` - Content script communication and data retrieval
- `UIController` - DOM manipulation and user interface

### Data Flow

```
BigShort Chart → Content Script → Background Script → Chrome Storage → Sidebar UI
```

1. Content script simulates mouse events on SVG chart elements
2. Extracts data from tooltip tables that appear
3. Sends data updates to background script
4. Background script stores data in Chrome storage
5. Sidebar reads from storage and displays real-time updates

## Troubleshooting

### Extension Not Loading

- ✅ Verify `manifest.json` exists in the selected folder
- ✅ Check that Developer mode is enabled
- ✅ Look for error messages in the Extensions page
- ✅ Try disabling and re-enabling the extension

### No Data Appearing

- ✅ Ensure you're on a BigShort.com page
- ✅ Click "Enable" in the side panel
- ✅ Check browser console for error messages (F12 → Console)
- ✅ Verify the extension icon shows "enabled" state

### Side Panel Not Opening

- ✅ Make sure you're clicking the correct extension icon
- ✅ Try right-clicking the icon → "Inspect popup" to check for errors
- ✅ Reload the extension from the Extensions page

### Data Not Updating

- ✅ Check if monitoring is enabled for the current tab
- ✅ Verify you're on a supported BigShort chart page
- ✅ Look for console errors in both main page and side panel
- ✅ Try refreshing the page and re-enabling monitoring

## Development

### File Structure

```
├── manifest.json              # Chrome extension configuration
├── content.js                 # Content script entry point
├── background.js              # Service worker
├── sidebar.html               # Side panel UI
├── sidebar.js                 # Side panel entry point
├── content/                   # Content script modules
│   ├── chart-targeting.js
│   ├── mouse-event-simulator.js
│   ├── table-data-extractor.js
│   ├── storage-manager.js
│   ├── monitoring-controller.js
│   ├── message-handler.js
│   └── trading-data-monitor.js
└── js/                        # Sidebar modules
    ├── trading-monitor-sidebar.js
    ├── threshold-manager.js
    ├── alarm-system.js
    ├── storage-service.js
    ├── data-service.js
    └── ui-controller.js
```

### Making Changes

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the **refresh icon** on the Trading Data Monitor extension
4. Refresh any BigShort pages you're testing on

## Requirements

- **Google Chrome** (version 88+)
- **BigShort.com** access
- **Developer mode** enabled in Chrome extensions

## License

This project is for educational and personal use.

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all installation steps were followed correctly
3. Ensure you're using a supported BigShort page
4. Try disabling/re-enabling the extension

---

**Happy Trading! 📈**
