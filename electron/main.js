const { app, BrowserWindow, ipcMain, screen, dialog, shell, Tray, Menu, Notification, nativeImage, powerMonitor, session } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { exec, spawn, execFile } = require('child_process');

// Hardware GPU rasterization & zero-copy transfer flags for AMD Radeon graphics
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=96');

// Enforce single instance lock to guarantee only one Now Bar ever runs
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  ensureIslandWindowVisible();
});

let islandWindow = null;
let settingsWindow = null;
let tray = null;
let fullscreenWatcherProcess = null;
let suppressAutoCollapseUntil = 0;

// Determine config and state file paths in AppData
const userDataPath = app.getPath('userData');
const errorLogPath = path.join(userDataPath, 'electron_error.log');
const configFilePath = path.join(userDataPath, 'config.json');
const pidFilePath = path.join(userDataPath, 'nowbar.pid');
const stopFlagPath = path.join(userDataPath, 'nowbar_stopped.flag');

function getHelperExePath() {
  const unpackedPath = path.join(process.resourcesPath, 'scripts', 'nowbar_helper.exe');
  if (fs.existsSync(unpackedPath)) return unpackedPath;
  const devPath = path.join(__dirname, '../scripts/nowbar_helper.exe');
  if (fs.existsSync(devPath)) return devPath;
  return path.join(__dirname, '../../scripts/nowbar_helper.exe');
}

// Default initial configuration
const DEFAULT_CONFIG = {
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
    displayMode: 'auto', // 'auto', 'bubble', 'attached'
    scale: 1.0,
    opacity: 1.0,
  },
  music: {
    activeProvider: 'spotify',
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

function loadConfig() {
  try {
    if (fs.existsSync(configFilePath)) {
      const rawData = fs.readFileSync(configFilePath, 'utf8');
      const parsed = JSON.parse(rawData);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        general: { ...DEFAULT_CONFIG.general, ...(parsed.general || {}) },
        appearance: { ...DEFAULT_CONFIG.appearance, ...(parsed.appearance || {}) },
        music: { ...DEFAULT_CONFIG.music, ...(parsed.music || {}) },
        apps: (() => {
          let userApps = (parsed.apps && parsed.apps.length > 0) ? parsed.apps : DEFAULT_CONFIG.apps;
          const hasTimer = userApps.some(a => a.id === 'app-timer' || a.path === 'internal:timer');
          const hasStopwatch = userApps.some(a => a.id === 'app-stopwatch' || a.path === 'internal:stopwatch');
          const additions = [];
          if (!hasTimer) {
            additions.push({
              id: 'app-timer',
              name: 'Minuteur',
              path: 'internal:timer',
              iconName: 'Timer',
              category: 'tools'
            });
          }
          if (!hasStopwatch) {
            additions.push({
              id: 'app-stopwatch',
              name: 'Chronomètre',
              path: 'internal:stopwatch',
              iconName: 'Clock',
              category: 'tools'
            });
          }
          return [...additions, ...userApps];
        })(),
        timer: { ...DEFAULT_CONFIG.timer, ...(parsed.timer || {}) },
      };
    }
  } catch (err) {
    console.error('Erreur lecture config, utilisation des valeurs par défaut:', err);
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Erreur sauvegarde config:', err);
    return false;
  }
}

let currentConfig = loadConfig();

function getPrimaryDisplayInfo() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const isInternal = primaryDisplay.internal === true;
  const modeSetting = currentConfig?.appearance?.displayMode || 'auto';
  
  const isAttached = modeSetting === 'attached' ? true : (modeSetting === 'bubble' ? false : isInternal);
  const topOffset = isAttached ? 0 : (currentConfig.general.topOffset ?? 8);

  return {
    isInternal,
    isAttached,
    topOffset,
    bounds: primaryDisplay.bounds,
  };
}

function loadContent(win, windowMode, queryParams = {}) {
  const query = { window: windowMode, ...queryParams };
  if (process.env.VITE_DEV_SERVER_URL) {
    const qs = new URLSearchParams(query).toString();
    win.loadURL(`${process.env.VITE_DEV_SERVER_URL}?${qs}`);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    win.loadFile(indexPath, { query }).catch(err => {
      try { fs.appendFileSync(errorLogPath, `[LOAD_FILE_ERROR] ${err.message}\n`); } catch {}
    });
  }
}

function createIslandWindow() {
  const displayInfo = getPrimaryDisplayInfo();
  const topOffset = displayInfo.topOffset;
  const initialWidth = 420;
  const initialHeight = (displayInfo.isAttached ? 40 : 44) + topOffset;
  const initialX = Math.round(displayInfo.bounds.x + (displayInfo.bounds.width - initialWidth) / 2);
  const initialY = displayInfo.bounds.y;

  islandWindow = new BrowserWindow({
    title: 'Now Bar Island',
    width: initialWidth,
    height: initialHeight,
    x: initialX,
    y: initialY,
    frame: false,
    transparent: true,
    alwaysOnTop: currentConfig.general.alwaysOnTop,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    thickFrame: false,
    roundedCorners: false,
    focusable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  if (currentConfig.general.alwaysOnTop) {
    islandWindow.setAlwaysOnTop(true, 'screen-saver');
  }
  islandWindow.setVisibleOnAllWorkspaces(true);

  // Auto-collapse when user clicks outside the window
  islandWindow.on('blur', () => {
    if (settingsWindow && !settingsWindow.isDestroyed() && settingsWindow.isVisible()) {
      return; // Do not auto-collapse while settings window is open and being interacted with!
    }
    if (islandWindow && !islandWindow.isDestroyed()) {
      islandWindow.webContents.send('auto-collapse');
    }
  });

  islandWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    try { fs.appendFileSync(errorLogPath, `[RENDERER][lvl ${level}] ${message} (${sourceId}:${line})\n`); } catch {}
  });

  // Auto-recovery if renderer process crashes or becomes unresponsive
  islandWindow.webContents.on('render-process-gone', (_event, details) => {
    try { fs.appendFileSync(errorLogPath, `[RENDERER GONE] details: ${JSON.stringify(details)}\n`); } catch {}
    if (islandWindow && !islandWindow.isDestroyed()) {
      islandWindow.destroy();
    }
    islandWindow = null;
    createIslandWindow();
  });

  islandWindow.on('unresponsive', () => {
    console.warn('Island window unresponsive, reloading...');
    if (islandWindow && !islandWindow.isDestroyed()) {
      islandWindow.reload();
    }
  });

  islandWindow.webContents.on('did-finish-load', () => {
    try { fs.appendFileSync(errorLogPath, `[ISLAND] did-finish-load\n`); } catch {}
    if (islandWindow && !islandWindow.isDestroyed()) {
      islandWindow.show();
    }
  });

  islandWindow.webContents.on('did-fail-load', (_e, errorCode, errorDescription, validatedURL) => {
    try { fs.appendFileSync(errorLogPath, `[ISLAND] did-fail-load: ${errorCode} ${errorDescription} url=${validatedURL}\n`); } catch {}
  });

  loadContent(islandWindow, 'island');

  islandWindow.on('closed', () => {
    islandWindow = null;
  });
}

function ensureIslandWindowVisible() {
  if (!islandWindow || islandWindow.isDestroyed()) {
    createIslandWindow();
    return;
  }

  const displayInfo = getPrimaryDisplayInfo();
  const topOffset = displayInfo.topOffset;
  const width = 420;
  const height = (displayInfo.isAttached ? 40 : 44) + topOffset;
  const newX = Math.round(displayInfo.bounds.x + (displayInfo.bounds.width - width) / 2);
  const newY = displayInfo.bounds.y;

  islandWindow.setBounds({
    x: newX,
    y: newY,
    width: width,
    height: Math.round(height),
  }, false);

  if (islandWindow.isMinimized()) islandWindow.restore();
  islandWindow.show();
  islandWindow.setAlwaysOnTop(true, 'screen-saver');
  islandWindow.setVisibleOnAllWorkspaces(true);
  islandWindow.focus();
}

function startWatchdogDaemon() {
  try {
    const helperExe = getHelperExePath();
    if (fs.existsSync(helperExe)) {
      const p = spawn(helperExe, ['watchdog'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      p.unref();
    }
  } catch (err) {
    console.warn('Failed to start watchdog daemon:', err);
  }
}

function registerAutostart(enable) {
  try {
    const helperExe = getHelperExePath();
    if (fs.existsSync(helperExe)) {
      exec(`"${helperExe}" autostart ${enable ? 'install' : 'remove'}`);
    }
  } catch (err) {
    console.warn('Failed to configure autostart:', err);
  }
}

function handleQuit() {
  app.isQuitting = true;
  try {
    fs.writeFileSync(stopFlagPath, 'stopped', 'utf8');
    if (fs.existsSync(pidFilePath)) fs.unlinkSync(pidFilePath);
  } catch {}
  if (fullscreenWatcherProcess) {
    try {
      fullscreenWatcherProcess.kill();
    } catch (e) {}
  }
  app.quit();
}

function createSettingsWindow(tab = 'general') {
  const targetTab = typeof tab === 'string' && tab ? tab : 'general';

  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.setAlwaysOnTop(true);
    settingsWindow.show();
    settingsWindow.focus();
    if (targetTab) {
      settingsWindow.webContents.send('switch-tab', targetTab);
    }
    return;
  }

  settingsWindow = new BrowserWindow({
    title: 'Now Bar — Paramètres',
    width: 760,
    height: 560,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    maximizable: false,
    alwaysOnTop: true,
    center: true,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  settingsWindow.once('ready-to-show', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.show();
      settingsWindow.focus();
    }
  });

  settingsWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    try { fs.appendFileSync(errorLogPath, `[SETTINGS][lvl ${level}] ${message} (${sourceId}:${line})\n`); } catch {}
  });

  loadContent(settingsWindow, 'settings', { tab: targetTab });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function createSystemTray() {
  const iconCanvas = nativeImage.createFromBuffer(
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAExJREFUOE9jZKAQMFKon2H4//9/hpmZmahyDAwMDGNjY0PFR2H2AwMyZkAlIzsO2fH/f+z2wQxAGPj/H5sBYQ2DsbGx0fxHMW2M5AUGAFEjKgnlV4rSAAAAAElFTkSuQmCC', 'base64')
  );

  tray = new Tray(iconCanvas);
  tray.setToolTip('Now Bar — Dynamic Island Windows 11');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Now Bar Windows 11',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Afficher Dynamic Island',
      click: () => {
        if (islandWindow && !islandWindow.isDestroyed()) {
          islandWindow.show();
          islandWindow.focus();
        } else {
          createIslandWindow();
        }
      }
    },
    {
      label: 'Paramètres...',
      click: () => {
        createSettingsWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'Toujours au premier plan',
      type: 'checkbox',
      checked: currentConfig.general.alwaysOnTop,
      click: (item) => {
        currentConfig.general.alwaysOnTop = item.checked;
        saveConfig(currentConfig);
        if (islandWindow && !islandWindow.isDestroyed()) {
          islandWindow.setAlwaysOnTop(item.checked, 'screen-saver');
        }
      }
    },
    {
      label: 'Relancer Now Bar',
      click: () => {
        if (islandWindow && !islandWindow.isDestroyed()) {
          islandWindow.reload();
          ensureIslandWindowVisible();
        } else {
          createIslandWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quitter Now Bar',
      click: () => {
        handleQuit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (islandWindow && !islandWindow.isDestroyed()) {
      islandWindow.focus();
    }
  });
}

// Fullscreen Watcher
function startFullscreenWatcher() {
  try {
    const helperExe = getHelperExePath();
    if (!fs.existsSync(helperExe)) {
      console.warn('nowbar_helper.exe not found, skipping fullscreen watcher.');
      return;
    }

    let islandHwndStr = '0';
    if (islandWindow && !islandWindow.isDestroyed()) {
      try {
        const handleBuf = islandWindow.getNativeWindowHandle();
        const hwndVal = handleBuf.length >= 8 ? handleBuf.readBigUInt64LE(0) : BigInt(handleBuf.readUInt32LE(0));
        islandHwndStr = hwndVal.toString();
      } catch (e) {
        console.warn('Could not read island native handle:', e);
      }
    }

    fullscreenWatcherProcess = spawn(helperExe, ['watcher', islandHwndStr], {
      stdio: ['pipe', 'pipe', 'ignore'],
      windowsHide: true,
    });

    fullscreenWatcherProcess.stdout.on('data', (chunk) => {
      const text = chunk.toString();

      // Real-time track & artist dynamic detection from Windows window titles (Spotify, Amazon Music, Deezer)
      const trackMatches = text.match(/TRACK_INFO:([a-zA-Z0-9]+):([^:\r\n]*):([^\r\n]*)/);
      if (trackMatches) {
        const provider = trackMatches[1];
        const artist = trackMatches[2];
        const title = trackMatches[3];
        if (islandWindow && !islandWindow.isDestroyed()) {
          islandWindow.webContents.send('track-info-changed', {
            provider,
            artist,
            title,
          });
        }
      }

      // Fullscreen handling (ignore during app launch or focus shifts)
      if (currentConfig.general.hideOnFullscreen !== false) {
        if (Date.now() < suppressAutoCollapseUntil) {
          // Never hide Now Bar while an app is launching or focus is shifting!
        } else if (text.includes('FULLSCREEN:TRUE')) {
          if (islandWindow && !islandWindow.isDestroyed() && islandWindow.isVisible()) {
            islandWindow.hide();
          }
        } else if (text.includes('FULLSCREEN:FALSE')) {
          if (islandWindow && !islandWindow.isDestroyed() && !islandWindow.isVisible()) {
            islandWindow.show();
            if (currentConfig.general.alwaysOnTop) {
              islandWindow.setAlwaysOnTop(true, 'screen-saver');
            }
          }
        }
      }

      // Music process running status handling
      const matches = text.match(/MUSIC_STATE:([a-zA-Z0-9]+):(RUNNING|STOPPED)/g);
      if (matches) {
        for (const m of matches) {
          const parts = m.split(':');
          const provider = parts[1].toLowerCase();
          const state = parts[2];
          const activeProv = (currentConfig?.music?.defaultProvider || 'amazon').toLowerCase();

          if (provider === activeProv && state === 'STOPPED') {
            if (islandWindow && !islandWindow.isDestroyed()) {
              islandWindow.webContents.send('music-app-closed', provider);
            }
          }
        }
      }

      // Music window closed handling (when user clicks X or closes window)
      const winMatches = text.match(/MUSIC_WINDOW:([a-zA-Z0-9]+):CLOSED/g);
      if (winMatches) {
        for (const wm of winMatches) {
          const parts = wm.split(':');
          const provider = parts[1].toLowerCase();
          const activeProv = (currentConfig?.music?.defaultProvider || 'amazon').toLowerCase();

          if (provider === activeProv) {
            if (islandWindow && !islandWindow.isDestroyed()) {
              islandWindow.webContents.send('music-app-closed', provider);
            }
          }
        }
      }

      // Audio playback real-time synchronization from CoreAudio peak detector
      if (text.includes('AUDIO_PLAYBACK:PLAYING')) {
        if (islandWindow && !islandWindow.isDestroyed()) {
          islandWindow.webContents.send('music-playback-changed', true);
        }
      } else if (text.includes('AUDIO_PLAYBACK:PAUSED')) {
        if (islandWindow && !islandWindow.isDestroyed()) {
          islandWindow.webContents.send('music-playback-changed', false);
        }
      }

      // Master audio volume synchronization
      if (text.includes('AUDIO_VOLUME:')) {
        const match = text.match(/AUDIO_VOLUME:(\d+)/);
        if (match) {
          const vol = parseInt(match[1], 10);
          if (islandWindow && !islandWindow.isDestroyed()) {
            islandWindow.webContents.send('master-volume-changed', vol);
          }
        }
      }

      // External click or foreground window change from native helper
      if (text.includes('CLICK_OUTSIDE') || text.includes('FOREGROUND:EXTERNAL')) {
        if (Date.now() < suppressAutoCollapseUntil) {
          // Do not collapse while an app or settings window is opening
        } else if (!settingsWindow || settingsWindow.isDestroyed() || !settingsWindow.isVisible()) {
          if (islandWindow && !islandWindow.isDestroyed() && islandWindow.isVisible()) {
            islandWindow.webContents.send('auto-collapse');
          }
        }
      }
    });

    fullscreenWatcherProcess.on('error', (err) => {
      console.error('Fullscreen watcher process error:', err);
    });
  } catch (err) {
    console.error('Failed to start fullscreen watcher:', err);
  }
}

function setupIpcHandlers() {
  // Dynamic resize of the island window (height only, width stays strictly fixed at 420px)
  ipcMain.handle('resize-island', async (_event, { height }) => {
    if (!islandWindow || islandWindow.isDestroyed()) return false;

    const displayInfo = getPrimaryDisplayInfo();
    const topOffset = displayInfo.topOffset;
    const windowWidth = 420;
    const newX = Math.round(displayInfo.bounds.x + (displayInfo.bounds.width - windowWidth) / 2);
    const newY = displayInfo.bounds.y;
    const totalHeight = Math.round(height + topOffset);

    islandWindow.setBounds({
      x: newX,
      y: newY,
      width: windowWidth,
      height: totalHeight,
    }, false);

    if (height > 100) {
      islandWindow.focus();
    }

    return true;
  });

  ipcMain.handle('set-ignore-mouse-events', async (_event, ignore, forward) => {
    if (!islandWindow || islandWindow.isDestroyed()) return false;
    islandWindow.setIgnoreMouseEvents(ignore, { forward: forward || false });
    return true;
  });

  ipcMain.handle('get-config', async () => {
    return currentConfig;
  });

  ipcMain.handle('get-display-info', async () => {
    return getPrimaryDisplayInfo();
  });

  ipcMain.handle('save-config', async (_event, newConfig) => {
    currentConfig = { ...currentConfig, ...newConfig };
    saveConfig(currentConfig);

    // Apply startup setting immediately to Windows Run and Startup folder
    if (typeof currentConfig.general.launchAtStartup === 'boolean') {
      registerAutostart(currentConfig.general.launchAtStartup);
    }

    // Broadcast config updates
    if (islandWindow && !islandWindow.isDestroyed()) {
      islandWindow.webContents.send('config-changed', currentConfig);
    }
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('config-changed', currentConfig);
    }

    // Refresh display info in case displayMode setting changed
    const displayInfo = getPrimaryDisplayInfo();
    if (islandWindow && !islandWindow.isDestroyed()) {
      islandWindow.webContents.send('display-info-changed', displayInfo);
    }

    return true;
  });

  ipcMain.handle('open-settings', async (_event, tab) => {
    const targetTab = typeof tab === 'string' && tab ? tab : 'general';
    suppressAutoCollapseUntil = Date.now() + 5000;
    createSettingsWindow(targetTab);
    return true;
  });

  ipcMain.handle('close-settings', async () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
    }
    return true;
  });

  ipcMain.handle('quit-app', async () => {
    handleQuit();
  });

  // Media Controls: Play/Pause, Next, Previous
  ipcMain.handle('send-media-command', async (_event, action) => {
    const helperExe = getHelperExePath();
    if (fs.existsSync(helperExe)) {
      return new Promise((resolve) => {
        execFile(helperExe, ['media', action], { windowsHide: true }, () => {
          if (islandWindow && !islandWindow.isDestroyed() && islandWindow.isVisible()) {
            islandWindow.focus();
          }
          resolve(true);
        });
      });
    }
    return false;
  });

  ipcMain.handle('is-audio-playing', async () => {
    const helperExe = getHelperExePath();
    if (fs.existsSync(helperExe)) {
      return new Promise((resolve) => {
        execFile(helperExe, ['isplaying'], { windowsHide: true }, (err, stdout) => {
          if (err) return resolve(false);
          resolve((stdout || '').includes('PLAYING'));
        });
      });
    }
    return false;
  });

  ipcMain.handle('get-master-volume', async () => {
    const helperExe = getHelperExePath();
    if (fs.existsSync(helperExe)) {
      return new Promise((resolve) => {
        execFile(helperExe, ['volume'], { windowsHide: true }, (err, stdout) => {
          if (err) return resolve(50);
          const m = (stdout || '').match(/VOLUME:(\d+)/);
          resolve(m ? parseInt(m[1], 10) : 50);
        });
      });
    }
    return 50;
  });

  ipcMain.handle('set-master-volume', async (_event, volume) => {
    const vol = Math.max(0, Math.min(100, Math.round(volume)));
    if (fullscreenWatcherProcess && fullscreenWatcherProcess.stdin && !fullscreenWatcherProcess.stdin.destroyed) {
      try {
        fullscreenWatcherProcess.stdin.write(`SET_VOLUME:${vol}\n`);
        return true;
      } catch (e) {}
    }
    const helperExe = getHelperExePath();
    if (fs.existsSync(helperExe)) {
      return new Promise((resolve) => {
        execFile(helperExe, ['setvolume', vol.toString()], { windowsHide: true }, () => resolve(true));
      });
    }
    return false;
  });

  // Music App Launch Minimized (Directly to Taskbar)
  ipcMain.handle('launch-music-minimized', async (_event, providerId) => {
    const prov = (providerId || currentConfig?.music?.defaultProvider || 'amazon').toLowerCase().trim();
    suppressAutoCollapseUntil = Date.now() + 10000; // 10s protection during app launch & initialization

    const helperExe = getHelperExePath();
    if (fs.existsSync(helperExe)) {
      exec(`"${helperExe}" launchmin ${prov}`);
    } else {
      if (prov === 'amazon') {
        shell.openPath('shell:AppsFolder\\AmazonMobileLLC.AmazonMusic_kc6t79cpj4tp0!AmazonMobileLLC.AmazonMusic');
      } else if (prov === 'spotify') {
        shell.openPath('shell:AppsFolder\\SpotifyAB.SpotifyMusic_zpdnekdrzrea0!Spotify');
      }
    }

    // Regain and hold focus on island window so it stays open and doesn't get dismissed
    const restoreFocus = () => {
      if (islandWindow && !islandWindow.isDestroyed() && islandWindow.isVisible()) {
        islandWindow.focus();
      }
    };
    setTimeout(restoreFocus, 300);
    setTimeout(restoreFocus, 800);
    setTimeout(restoreFocus, 1600);
    setTimeout(restoreFocus, 2800);
    setTimeout(restoreFocus, 4500);

    return true;
  });

  ipcMain.handle('is-music-running', async (_event, providerId) => {
    const prov = (providerId || currentConfig?.music?.defaultProvider || 'amazon').toLowerCase().trim();
    const helperExe = getHelperExePath();
    if (fs.existsSync(helperExe)) {
      return new Promise((resolve) => {
        execFile(helperExe, ['checkproc', prov], { windowsHide: true }, (err, stdout) => {
          if (islandWindow && !islandWindow.isDestroyed() && islandWindow.isVisible()) {
            islandWindow.focus();
          }
          if (err) return resolve(false);
          resolve((stdout || '').includes('RUNNING'));
        });
      });
    }
    return false;
  });

  ipcMain.handle('launch-app', async (_event, targetPath) => {
    try {
      if (!targetPath) return { success: false, error: 'Chemin vide' };
      suppressAutoCollapseUntil = Date.now() + 5000;

      return new Promise((resolve) => {
        exec(`start "" "${targetPath}"`, (err) => {
          if (err) {
            shell.openPath(targetPath)
              .then((result) => resolve({ success: !result, error: result }))
              .catch((e) => resolve({ success: false, error: e.message }));
          } else {
            resolve({ success: true });
          }
        });
      });
    } catch (err) {
      console.error('Erreur lancement application:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('select-executable', async () => {
    const parentWin = settingsWindow || islandWindow;
    const result = await dialog.showOpenDialog(parentWin, {
      title: 'Sélectionner une application (.exe ou .lnk)',
      properties: ['openFile'],
      filters: [
        { name: 'Applications exécutables (*.exe, *.lnk)', extensions: ['exe', 'lnk'] },
        { name: 'Tous les fichiers (*.*)', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const selectedPath = result.filePaths[0];
    const parsed = path.parse(selectedPath);
    return {
      path: selectedPath,
      name: parsed.name,
    };
  });

  ipcMain.handle('send-notification', async (_event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({
        title: title || 'Now Bar — Minuteur',
        body: body || 'Le minuteur est terminé !',
        silent: false,
      }).show();
    }
    return true;
  });

  // Audio Recording storage in Documents\Enregistrements audio
  ipcMain.handle('save-audio-recording', async (_event, arrayBuffer) => {
    try {
      const docsPath = app.getPath('documents');
      const recordingsDir = path.join(docsPath, 'Enregistrements audio');
      if (!fs.existsSync(recordingsDir)) {
        fs.mkdirSync(recordingsDir, { recursive: true });
      }

      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      const fileName = `Enregistrement_${timestamp}.webm`;
      const filePath = path.join(recordingsDir, fileName);

      fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
      return { success: true, fileName, filePath };
    } catch (err) {
      console.error('Erreur sauvegarde enregistrement audio:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('set-startup', async (_event, enabled) => {
    registerAutostart(enabled);
    return true;
  });
}

app.whenReady().then(() => {
  // Record PID file for native watchdog
  try {
    if (fs.existsSync(stopFlagPath)) fs.unlinkSync(stopFlagPath);
    fs.writeFileSync(pidFilePath, process.pid.toString(), 'utf8');
  } catch (err) {
    console.error('Error writing PID file:', err);
  }

  // Ensure autostart is registered in Windows Run & Startup folder
  registerAutostart(currentConfig.general.launchAtStartup !== false);

  // Launch background watchdog daemon to monitor unlock and auto-recover from crashes
  startWatchdogDaemon();

  // Auto-grant media (microphone) permissions for background audio recording
  if (session && session.defaultSession) {
    session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
      if (permission === 'media') return true;
      return false;
    });
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === 'media') return callback(true);
      callback(false);
    });
  }

  setupIpcHandlers();
  createIslandWindow();
  createSystemTray();
  startFullscreenWatcher();

  // Listen to Windows session lock, unlock, suspend, and resume events
  powerMonitor.on('lock-screen', () => {
    if (global.gc) {
      try { global.gc(); } catch (e) {}
    }
  });

  powerMonitor.on('suspend', () => {
    if (global.gc) {
      try { global.gc(); } catch (e) {}
    }
  });

  powerMonitor.on('unlock-screen', () => {
    console.log('Windows session unlocked -> ensuring island is visible and active');
    ensureIslandWindowVisible();
  });

  powerMonitor.on('resume', () => {
    console.log('System resumed from sleep -> ensuring island is visible and active');
    ensureIslandWindowVisible();
  });

  const handleDisplayChange = () => {
    const displayInfo = getPrimaryDisplayInfo();
    if (islandWindow && !islandWindow.isDestroyed()) {
      islandWindow.webContents.send('display-info-changed', displayInfo);
    }
  };
  screen.on('display-metrics-changed', handleDisplayChange);
  screen.on('display-added', handleDisplayChange);
  screen.on('display-removed', handleDisplayChange);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createIslandWindow();
    }
  });
});

app.on('will-quit', () => {
  try {
    if (fs.existsSync(pidFilePath)) fs.unlinkSync(pidFilePath);
  } catch {}
  if (fullscreenWatcherProcess) {
    try {
      fullscreenWatcherProcess.kill();
    } catch (e) {
      // Ignore kill error
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
