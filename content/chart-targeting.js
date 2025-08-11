// Chart Targeting Module
console.log('[ChartTargeting] Loading chart targeting module...');
window.TradingMonitor = window.TradingMonitor || {};

window.TradingMonitor.ChartTargeting = class ChartTargeting {
  constructor() {
    // Draggable crosshair targeting system
    this.debugCallback = null;
    this.elementFoundLogged = false;
    
    // Crosshair state
    this.crosshairActive = false;
    this.targetCoordinates = { x: 0, y: 0 };
    this.crosshairElement = null;
    this.isDragging = false;
    
    // Initialize crosshair system
    this.initializeCrosshair();
  }
  
  setDebugCallback(callback) {
    this.debugCallback = callback;
  }
  
  addDebugInfo(message, type = 'info') {
    if (this.debugCallback) {
      this.debugCallback(message, type);
    }
  }
  
  // ============== CROSSHAIR SYSTEM ==============
  
  initializeCrosshair() {
    // Create crosshair overlay
    this.createCrosshairElement();
    
    // Load saved coordinates if any
    this.loadSavedCoordinates();
    
    // Add global message listener for crosshair commands
    this.addMessageListener();
  }
  
  createCrosshairElement() {
    // Remove existing crosshair if any
    if (this.crosshairElement) {
      this.crosshairElement.remove();
    }
    
    // Create crosshair container
    this.crosshairElement = document.createElement('div');
    this.crosshairElement.id = 'trading-monitor-crosshair';
    this.crosshairElement.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      pointer-events: none;
      z-index: 10000;
      display: none;
      user-select: none;
    `;
    
    // Create crosshair visual
    this.crosshairElement.innerHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 2px;
        background: #ff4444;
        box-shadow: 0 0 4px rgba(255,68,68,0.8);
        transform: translateY(-50%);
      "></div>
      <div style="
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #ff4444;
        box-shadow: 0 0 4px rgba(255,68,68,0.8);
        transform: translateX(-50%);
      "></div>
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        width: 8px;
        height: 8px;
        background: #ff4444;
        border: 2px solid white;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 6px rgba(255,68,68,0.8);
        pointer-events: auto;
        cursor: move;
      " class="crosshair-handle"></div>
      <div style="
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        white-space: nowrap;
        pointer-events: none;
      " class="crosshair-coords">x: 0, y: 0</div>
    `;
    
    document.body.appendChild(this.crosshairElement);
    
    // Add drag functionality
    this.addCrosshairDragHandlers();
  }
  
  addCrosshairDragHandlers() {
    const handle = this.crosshairElement.querySelector('.crosshair-handle');
    
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDragging = true;
      
      const moveHandler = (e) => {
        if (!this.isDragging) return;
        
        this.targetCoordinates.x = e.clientX;
        this.targetCoordinates.y = e.clientY;
        
        this.updateCrosshairPosition();
        this.saveCoordinates();
      };
      
      const upHandler = () => {
        this.isDragging = false;
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        
        this.addDebugInfo(`Crosshair positioned at: x=${this.targetCoordinates.x}, y=${this.targetCoordinates.y}`);
      };
      
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
    });
  }
  
  updateCrosshairPosition() {
    if (!this.crosshairElement) return;
    
    this.crosshairElement.style.left = (this.targetCoordinates.x - 20) + 'px';
    this.crosshairElement.style.top = (this.targetCoordinates.y - 20) + 'px';
    
    // Update coordinate display
    const coordsDisplay = this.crosshairElement.querySelector('.crosshair-coords');
    if (coordsDisplay) {
      coordsDisplay.textContent = `x: ${this.targetCoordinates.x}, y: ${this.targetCoordinates.y}`;
    }
  }
  
  showCrosshair() {
    if (!this.crosshairElement) this.createCrosshairElement();
    
    this.crosshairActive = true;
    this.crosshairElement.style.display = 'block';
    this.crosshairElement.querySelector('.crosshair-handle').style.pointerEvents = 'auto';
    
    // Position at saved coordinates or center of screen
    if (this.targetCoordinates.x === 0 && this.targetCoordinates.y === 0) {
      this.targetCoordinates.x = window.innerWidth / 2;
      this.targetCoordinates.y = window.innerHeight / 2;
    }
    
    this.updateCrosshairPosition();
    this.addDebugInfo('Crosshair activated - drag to set target position');
  }
  
  hideCrosshair() {
    if (!this.crosshairElement) return;
    
    this.crosshairActive = false;
    this.crosshairElement.style.display = 'none';
    this.crosshairElement.querySelector('.crosshair-handle').style.pointerEvents = 'none';
    
    this.addDebugInfo('Crosshair hidden');
  }
  
  addMessageListener() {
    // Listen for messages from popup/sidebar to show/hide crosshair
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'showCrosshair') {
          this.showCrosshair();
          sendResponse({ success: true });
        } else if (message.action === 'hideCrosshair') {
          this.hideCrosshair();
          sendResponse({ success: true });
        } else if (message.action === 'getCrosshairCoords') {
          sendResponse({ 
            coordinates: this.targetCoordinates,
            active: this.crosshairActive 
          });
        }
        return true;
      });
    }
  }
  
  saveCoordinates() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const key = `crosshair_coords_${window.location.hostname}`;
        chrome.storage.local.set({ 
          [key]: this.targetCoordinates 
        });
      }
    } catch (error) {
      // Ignore storage errors
    }
  }
  
  loadSavedCoordinates() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const key = `crosshair_coords_${window.location.hostname}`;
        chrome.storage.local.get([key], (result) => {
          if (result[key]) {
            this.targetCoordinates = result[key];
            this.addDebugInfo(`Loaded saved coordinates: x=${this.targetCoordinates.x}, y=${this.targetCoordinates.y}`);
          }
        });
      }
    } catch (error) {
      // Ignore storage errors
    }
  }
  
  findTargetElement() {
    // Use XPath only to find the exact element
    try {
      const xpathResult = document.evaluate(
        this.targetXPath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      
      const targetElement = xpathResult.singleNodeValue;
      
      if (!targetElement) {
        this.addDebugInfo(`Target element not found via XPath: ${this.targetXPath}`, 'error');
        
        // Try to find alternative elements for debugging
        this.diagnosePageStructure();
        
        // Try fallback method
        return this.findTargetElementFallback();
      }
      
      // Only log success once per session to reduce spam
      if (!this.elementFoundLogged) {
        this.addDebugInfo('Target element found via XPath');
        this.elementFoundLogged = true;
      }
      
      return targetElement;
      
    } catch (error) {
      this.addDebugInfo(`Error finding target element via XPath: ${error.message}`, 'error');
      return this.findTargetElementFallback();
    }
  }
  
  diagnosePageStructure() {
    try {
      // Check if basic structure exists
      const body = document.querySelector('body');
      const firstDiv = document.querySelector('body > div:first-child');
      const mainElement = document.querySelector('main');
      const svgs = document.querySelectorAll('svg');
      
      this.addDebugInfo(`Page diagnosis: body=${!!body}, firstDiv=${!!firstDiv}, main=${!!mainElement}, svgCount=${svgs.length}`);
      
      // Check if any SVG has rect elements
      svgs.forEach((svg, index) => {
        const rects = svg.querySelectorAll('rect');
        if (rects.length > 0) {
          this.addDebugInfo(`SVG ${index}: ${rects.length} rect elements`);
        }
      });
      
    } catch (error) {
      this.addDebugInfo(`Diagnosis failed: ${error.message}`, 'error');
    }
  }
  
  findTargetElementFallback() {
    try {
      this.addDebugInfo('Trying fallback element selection...');
      
      // Try to find SVGs and look for rect elements
      const svgs = document.querySelectorAll('svg');
      
      if (svgs.length >= 5) {
        // Try the original logic of SVG 5, rect 13
        const targetSvg = svgs[4]; // 5th SVG (0-indexed)
        const rects = targetSvg.querySelectorAll('rect');
        
        if (rects.length >= 13) {
          this.addDebugInfo('Using fallback: SVG 5, rect 13');
          return rects[12]; // 13th rect (0-indexed)
        }
      }
      
      // If that fails, try any SVG with multiple rects
      for (let i = 0; i < svgs.length; i++) {
        const rects = svgs[i].querySelectorAll('rect');
        if (rects.length >= 2) {
          this.addDebugInfo(`Using fallback: SVG ${i + 1}, rect 2`);
          return rects[1]; // 2nd rect (0-indexed)
        }
      }
      
      this.addDebugInfo('No suitable fallback element found', 'error');
      return null;
      
    } catch (error) {
      this.addDebugInfo(`Fallback search failed: ${error.message}`, 'error');
      return null;
    }
  }
  
  getAllSvgElements() {
    return document.querySelectorAll('svg');
  }
  
  getRectsInSvg(svg) {
    return svg.querySelectorAll('rect');
  }
  
  validateSvgCount(svgs) {
    return svgs.length >= 5;
  }
  
  validateRectCount(rects) {
    return rects.length >= 13;
  }
  
  getTargetCoordinates(element) {
    const bounds = element.getBoundingClientRect();
    
    // Target exactly 1 pixel from the inside right edge of the element
    const targetX = bounds.right - 1; // 1 pixel from inside right edge
    const targetY = bounds.top + bounds.height / 2; // Vertical center
    
    return {
      x: targetX,
      y: targetY
    };
  }
  
  getDiagnostics() {
    // Use XPath only for diagnostics
    let targetRectXPath = null;
    try {
      const xpathResult = document.evaluate(
        this.targetXPath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      targetRectXPath = xpathResult.singleNodeValue;
    } catch (error) {
      // XPath failed
    }
    
    const allSvgs = this.getAllSvgElements();
    
    // Get detailed SVG information
    const svgDetails = [];
    allSvgs.forEach((svg, index) => {
      const rects = svg.querySelectorAll('rect');
      svgDetails.push({
        index: index,
        rectCount: rects.length,
        hasParent: !!svg.parentElement,
        parentTagName: svg.parentElement ? svg.parentElement.tagName : 'none'
      });
    });
    
    return {
      svgCount: allSvgs.length,
      svgDetails: svgDetails,
      targetXPath: this.targetXPath,
      targetElementFound: !!targetRectXPath,
      elementType: targetRectXPath ? targetRectXPath.tagName : 'not found',
      elementId: targetRectXPath ? targetRectXPath.id : 'none',
      pageStructure: {
        hasBody: !!document.querySelector('body'),
        hasMain: !!document.querySelector('main'),
        firstDivExists: !!document.querySelector('body > div:first-child')
      }
    };
  }
  
  // ============== MOUSE EVENT SIMULATION ==============
  
  simulateMouseEvent() {
    try {
      // Use crosshair coordinates if available
      if (this.targetCoordinates.x > 0 && this.targetCoordinates.y > 0) {
        const element = document.elementFromPoint(this.targetCoordinates.x, this.targetCoordinates.y);
        
        if (element) {
          this.performMouseEvent(element, this.targetCoordinates.x, this.targetCoordinates.y);
          this.addDebugInfo(`✓ Mouse event simulated at crosshair position: x=${this.targetCoordinates.x}, y=${this.targetCoordinates.y}`);
          return;
        } else {
          this.addDebugInfo('⚠ No element found at crosshair coordinates', 'warning');
        }
      }
      
      // Fallback: attempt XPath targeting
      this.addDebugInfo('⚠ No crosshair coordinates available, attempting XPath fallback');
      this.attemptXPathTargeting();
      
    } catch (error) {
      this.addDebugInfo(`❌ Error in simulateMouseEvent: ${error.message}`, 'error');
    }
  }
  
  attemptXPathTargeting() {
    try {
      const targetElement = this.findTargetElement();
      
      if (targetElement) {
        const coords = this.getTargetCoordinates(targetElement);
        this.performMouseEvent(targetElement, coords.x, coords.y);
        this.addDebugInfo(`✓ XPath fallback successful: x=${coords.x}, y=${coords.y}`);
      } else {
        this.addDebugInfo('❌ XPath fallback failed - no element found', 'error');
      }
    } catch (error) {
      this.addDebugInfo(`❌ XPath fallback error: ${error.message}`, 'error');
    }
  }
  
  performMouseEvent(element, x, y) {
    const events = ['mouseover', 'mouseenter', 'mousemove'];
    
    events.forEach(eventType => {
      const event = new MouseEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y
      });
      
      element.dispatchEvent(event);
    });
  }
};
