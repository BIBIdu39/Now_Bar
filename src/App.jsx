import React, { useState, useEffect } from 'react';
import DynamicIsland from './components/DynamicIsland';
import SettingsView from './components/SettingsView';
import { storageService } from './services/storageService';
import { DEFAULT_CONFIG } from './services/configDefaults';

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Determine window mode ('island' or 'settings') from URL query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const windowMode = searchParams.get('window') || 'island';
  const initialTab = searchParams.get('tab') || 'general';

  useEffect(() => {
    // Initial config load
    storageService.loadConfig().then((loaded) => {
      setConfig(loaded);
      setIsLoading(false);
    });

    // Subscribe to IPC config updates (e.g. settings changed in another window)
    const unsubscribe = storageService.subscribe((updatedConfig) => {
      setConfig(updatedConfig);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateConfig = async (newConfig) => {
    setConfig(newConfig);
    await storageService.saveConfig(newConfig);
  };

  const handleOpenSettings = (tab = 'general') => {
    const targetTab = typeof tab === 'string' && tab ? tab : 'general';
    if (window.electronAPI && window.electronAPI.openSettings) {
      window.electronAPI.openSettings(targetTab);
    }
  };

  const handleCloseSettings = () => {
    if (window.electronAPI && window.electronAPI.closeSettings) {
      window.electronAPI.closeSettings();
    }
  };

  if (isLoading) {
    return null; // Silent seamless mount
  }

  // Settings window mode
  if (windowMode === 'settings') {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent p-4">
        <SettingsView
          config={config}
          initialTab={initialTab}
          onUpdateConfig={handleUpdateConfig}
          onClose={handleCloseSettings}
        />
      </div>
    );
  }

  // Dynamic Island window mode
  return (
    <DynamicIsland
      config={config}
      onOpenSettings={handleOpenSettings}
    />
  );
}
