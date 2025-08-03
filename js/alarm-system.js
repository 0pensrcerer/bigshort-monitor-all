export class AlarmSystem {
  constructor() {
    this.alarmStates = {};
    this.debugCallback = null;
  }
  
  setDebugCallback(callback) {
    this.debugCallback = callback;
  }
  
  addDebugInfo(message) {
    if (this.debugCallback) {
      this.debugCallback(message);
    }
  }
  
  processThresholdResults(thresholdResults) {
    const alarmTriggers = [];
    
    Object.values(thresholdResults).forEach(result => {
      if (result && this.shouldTriggerAlarm(result)) {
        alarmTriggers.push(result.key);
      }
      
      this.updateAlarmState(result.key, result.isAbove);
    });
    
    return alarmTriggers;
  }
  
  shouldTriggerAlarm(result) {
    const previousState = this.alarmStates[result.key] || 'normal';
    return result.isAbove && previousState !== 'above';
  }
  
  updateAlarmState(key, isAbove) {
    this.alarmStates[key] = isAbove ? 'above' : 'normal';
  }
  
  async triggerAlarm(keys) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800 Hz tone
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5); // 0.5 second beep
      
      const keysList = keys.length > 0 ? ` for: ${keys.join(', ')}` : '';
      this.addDebugInfo(`🚨 Alarm triggered${keysList}`);
    } catch (error) {
      this.addDebugInfo(`Alarm failed: ${error.message}`);
    }
  }
  
  resetAlarmState(key) {
    if (this.alarmStates[key]) {
      delete this.alarmStates[key];
      this.addDebugInfo(`Alarm state reset for ${key}`);
    }
  }
  
  resetAllStates() {
    this.alarmStates = {};
    this.addDebugInfo('All alarm states reset');
  }
  
  getAlarmState(key) {
    return this.alarmStates[key] || 'normal';
  }
}
