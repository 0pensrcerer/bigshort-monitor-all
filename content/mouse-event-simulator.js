// Mouse Event Simulator Module
window.TradingMonitor = window.TradingMonitor || {};

window.TradingMonitor.MouseEventSimulator = class MouseEventSimulator {
  constructor() {
    this.debugCallback = null;
  }
  
  setDebugCallback(callback) {
    this.debugCallback = callback;
  }
  
  addDebugInfo(message, type = 'info') {
    if (this.debugCallback) {
      this.debugCallback(message, type);
    }
  }
  
  simulateMouseEvents(element, coordinates) {
    const events = this.createMouseEvents(coordinates);
    
    events.forEach(event => {
      element.dispatchEvent(event);
    });
    
    this.addDebugInfo(`Mouse events dispatched at (${coordinates.x}, ${coordinates.y})`);
  }
  
  createMouseEvents(coordinates) {
    const { x, y } = coordinates;
    const eventOptions = {
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
      view: window
    };
    
    const enterOptions = {
      ...eventOptions,
      bubbles: false // mouseenter doesn't bubble
    };

    return [
      new MouseEvent('mouseenter', enterOptions),
      new MouseEvent('mouseover', eventOptions),
      new MouseEvent('mousemove', eventOptions)
    ];
  }
};
