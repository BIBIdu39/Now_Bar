export const ACCENT_PRESETS = [
  { id: 'blue', name: 'Bleu Windows 11', color: '#0078d4', glow: 'rgba(0, 120, 212, 0.4)' },
  { id: 'emerald', name: 'Vert Émeraude', color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  { id: 'purple', name: 'Violet Néon', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
  { id: 'amber', name: 'Ambre Solaire', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
  { id: 'rose', name: 'Rose Fushia', color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)' },
  { id: 'white', name: 'Blanc Pur', color: '#f4f4f5', glow: 'rgba(255, 255, 255, 0.3)' },
];

export const THEME_PRESETS = [
  { id: 'deep-black', name: 'Noir Absolu', bg: '#09090b', surface: '#121215' },
  { id: 'midnight', name: 'Nuit Bleutée', bg: '#0b0f19', surface: '#111827' },
  { id: 'obsidian', name: 'Obsidienne', bg: '#141416', surface: '#1c1c20' },
];

export const DISPLAY_MODES = [
  { id: 'auto', name: 'Automatique', desc: 'Bulle sur écran externe, bordure intégrée sur écran de PC portable' },
  { id: 'bubble', name: 'Bulle flottante', desc: 'Toujours en format pilule flottante détachée' },
  { id: 'attached', name: 'Intégré au bord', desc: 'Toujours intégré au bord supérieur de l\'écran' },
];

export const MUSIC_PROVIDERS = [
  { id: 'amazon', name: 'Amazon Music', color: '#00a8e1', glow: 'rgba(0, 168, 225, 0.4)' },
  { id: 'spotify', name: 'Spotify', color: '#1ed760', glow: 'rgba(30, 215, 96, 0.4)' },
  { id: 'deezer', name: 'Deezer', color: '#a238ff', glow: 'rgba(162, 56, 255, 0.4)' },
  { id: 'apple', name: 'Apple Music', color: '#fa243c', glow: 'rgba(250, 36, 60, 0.4)' },
];

export const DEFAULT_CONFIG = {
  general: {
    launchAtStartup: true,
    hoverDelayMs: 0,
    collapseDelayMs: 220,
    topOffset: 8,
    alwaysOnTop: true,
    hideOnFullscreen: true,
  },
  appearance: {
    theme: 'deep-black',
    accentColor: '#0078d4',
    accentName: 'blue',
    displayMode: 'auto',
    scale: 1.0,
    opacity: 1.0,
  },
  music: {
    defaultProvider: 'amazon', // Amazon Music is the user's primary player
    autoLaunchMinimized: true,
  },
  apps: [
    {
      id: 'app-timer',
      name: 'Minuteur',
      path: 'internal:timer',
      iconName: 'Timer',
      category: 'tools'
    },
    {
      id: 'app-stopwatch',
      name: 'Chronomètre',
      path: 'internal:stopwatch',
      iconName: 'Clock',
      category: 'tools'
    },
    {
      id: 'app-explorer',
      name: 'Explorateur',
      path: 'explorer.exe',
      iconName: 'Folder',
      category: 'system'
    },
    {
      id: 'app-notepad',
      name: 'Bloc-notes',
      path: 'notepad.exe',
      iconName: 'FileText',
      category: 'productivity'
    },
    {
      id: 'app-calc',
      name: 'Calculatrice',
      path: 'calc.exe',
      iconName: 'Calculator',
      category: 'tools'
    },
    {
      id: 'app-taskmgr',
      name: 'Gestionnaire',
      path: 'taskmgr.exe',
      iconName: 'Activity',
      category: 'system'
    },
    {
      id: 'app-cmd',
      name: 'Terminal',
      path: 'cmd.exe',
      iconName: 'Terminal',
      category: 'dev'
    }
  ],
  timer: {
    defaultMinutes: 5,
    enableSound: true,
    soundVolume: 0.8,
    enableNotification: true,
    presets: [1, 5, 15, 25, 45]
  }
};
