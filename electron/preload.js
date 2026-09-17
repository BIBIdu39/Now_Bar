const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window management
  resizeIsland: (dimensions) => ipcRenderer.invoke('resize-island', dimensions),
  setIgnoreMouseEvents: (ignore, forward) => ipcRenderer.invoke('set-ignore-mouse-events', ignore, forward),
  openSettings: (tab) => {
    const targetTab = typeof tab === 'string' && tab ? tab : 'general';
    return ipcRenderer.invoke('open-settings', targetTab);
  },
  onSwitchTab: (callback) => {
    const subscription = (_event, tab) => callback(tab);
    ipcRenderer.on('switch-tab', subscription);
    return () => ipcRenderer.removeListener('switch-tab', subscription);
  },
  closeSettings: () => ipcRenderer.invoke('close-settings'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  onAutoCollapse: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('auto-collapse', subscription);
    return () => ipcRenderer.removeListener('auto-collapse', subscription);
  },
  
  // Configuration & Persistence
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  onConfigChanged: (callback) => {
    const subscription = (_event, config) => callback(config);
    ipcRenderer.on('config-changed', subscription);
    return () => ipcRenderer.removeListener('config-changed', subscription);
  },

  // Display & Screen Mode
  getDisplayInfo: () => ipcRenderer.invoke('get-display-info'),
  onDisplayInfoChanged: (callback) => {
    const subscription = (_event, info) => callback(info);
    ipcRenderer.on('display-info-changed', subscription);
    return () => ipcRenderer.removeListener('display-info-changed', subscription);
  },

  // Media controls (Play/Pause, Next, Previous)
  sendMediaCommand: (action) => ipcRenderer.invoke('send-media-command', action),
  launchMusicMinimized: (providerId) => ipcRenderer.invoke('launch-music-minimized', providerId),
  isMusicRunning: (providerId) => ipcRenderer.invoke('is-music-running', providerId),
  // Audio volume & playback
  getMasterVolume: () => ipcRenderer.invoke('get-master-volume'),
  setMasterVolume: (volume) => ipcRenderer.invoke('set-master-volume', volume),
  onMasterVolumeChanged: (callback) => {
    const subscription = (_event, vol) => callback(vol);
    ipcRenderer.on('master-volume-changed', subscription);
    return () => ipcRenderer.removeListener('master-volume-changed', subscription);
  },
  onTrackInfoChanged: (callback) => {
    const subscription = (_event, info) => callback(info);
    ipcRenderer.on('track-info-changed', subscription);
    return () => ipcRenderer.removeListener('track-info-changed', subscription);
  },
  isAudioPlaying: () => ipcRenderer.invoke('is-audio-playing'),
  onMusicPlaybackChanged: (callback) => {
    const subscription = (_event, isPlaying) => callback(isPlaying);
    ipcRenderer.on('music-playback-changed', subscription);
    return () => ipcRenderer.removeListener('music-playback-changed', subscription);
  },
  onMusicAppClosed: (callback) => {
    const subscription = (_event, provider) => callback(provider);
    ipcRenderer.on('music-app-closed', subscription);
    return () => ipcRenderer.removeListener('music-app-closed', subscription);
  },

  // App Execution & File Picking
  launchApp: (targetPath) => ipcRenderer.invoke('launch-app', targetPath),
  selectExecutable: () => ipcRenderer.invoke('select-executable'),
  
  // System Notifications
  sendNotification: (payload) => ipcRenderer.invoke('send-notification', payload),
  
  // Audio recording storage
  saveAudioRecording: (buffer) => ipcRenderer.invoke('save-audio-recording', buffer),

  // Windows startup
  setStartup: (enabled) => ipcRenderer.invoke('set-startup', enabled),

  // Platform info
  platform: process.platform,
});
