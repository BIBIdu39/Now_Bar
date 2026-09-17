import { DEFAULT_CONFIG } from './configDefaults';

class StorageService {
  async loadConfig() {
    if (window.electronAPI && window.electronAPI.getConfig) {
      try {
        const conf = await window.electronAPI.getConfig();
        return conf || DEFAULT_CONFIG;
      } catch (err) {
        console.error('Failed to load config via IPC:', err);
      }
    }

    // Browser fallback (for preview/dev)
    try {
      const stored = localStorage.getItem('now_bar_config');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    return DEFAULT_CONFIG;
  }

  async saveConfig(config) {
    if (window.electronAPI && window.electronAPI.saveConfig) {
      try {
        await window.electronAPI.saveConfig(config);
        return true;
      } catch (err) {
        console.error('Failed to save config via IPC:', err);
      }
    }

    try {
      localStorage.setItem('now_bar_config', JSON.stringify(config));
      return true;
    } catch (e) {
      console.warn('LocalStorage save error:', e);
      return false;
    }
  }

  subscribe(callback) {
    if (window.electronAPI && window.electronAPI.onConfigChanged) {
      return window.electronAPI.onConfigChanged(callback);
    }
    return () => {};
  }
}

export const storageService = new StorageService();
