// Chart Targeting Module
console.log('[ChartTargeting] Loading chart targeting module...');
window.TradingMonitor = window.TradingMonitor || {};

window.TradingMonitor.ChartTargeting = class ChartTargeting {
  constructor() {
    this.targetSvgIndex = 4; // SVG 5 (0-indexed)
    this.targetRectIndex = 12; // rect 13 (0-indexed)
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
  
  findTargetElement() {
    const svgs = this.getAllSvgElements();
    
    if (!this.validateSvgCount(svgs)) {
      this.addDebugInfo(`Less than 5 SVG elements found. Total SVGs: ${svgs.length}`, 'error');
      return null;
    }

    const targetSvg = svgs[this.targetSvgIndex];
    const rects = this.getRectsInSvg(targetSvg);
    
    if (!this.validateRectCount(rects)) {
      this.addDebugInfo(`SVG 5 does not have 13 rect elements. Found: ${rects.length}`, 'error');
      return null;
    }

    return rects[this.targetRectIndex];
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
    return {
      x: bounds.right - 2,
      y: bounds.top + bounds.height / 2
    };
  }
  
  getDiagnostics() {
    const svgs = this.getAllSvgElements();
    const targetSvg = svgs[this.targetSvgIndex];
    const rects = targetSvg ? this.getRectsInSvg(targetSvg) : [];
    
    return {
      svgCount: svgs.length,
      hasTargetSvg: !!targetSvg,
      rectCount: rects.length,
      hasTargetRect: rects.length >= 13,
      targetSvgIndex: this.targetSvgIndex,
      targetRectIndex: this.targetRectIndex
    };
  }
};
