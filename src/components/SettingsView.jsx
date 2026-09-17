import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Palette,
  LayoutGrid,
  Timer,
  X,
  Plus,
  Trash2,
  FolderOpen,
  Volume2,
  Bell,
  Play,
  Check,
  Power,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { ACCENT_PRESETS, THEME_PRESETS, DISPLAY_MODES, MUSIC_PROVIDERS } from '../services/configDefaults';
import { audioService } from '../services/audioService';

const AVAILABLE_ICONS = [
  'Folder',
  'FileText',
  'Calculator',
  'Activity',
  'Terminal',
  'Globe',
  'Code',
  'Music',
  'Gamepad2',
  'Compass',
  'MessageSquare',
  'Cpu',
  'Layers',
  'AppWindow',
];

export default function SettingsView({ config, onUpdateConfig, onClose, initialTab = 'general' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [testChimePlaying, setTestChimePlaying] = useState(false);
  const [testAppFeedback, setTestAppFeedback] = useState(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (window.electronAPI?.onSwitchTab) {
      const cleanup = window.electronAPI.onSwitchTab((newTab) => {
        if (newTab) {
          setActiveTab(newTab);
        }
      });
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, []);

  // New app form state
  const [newAppName, setNewAppName] = useState('');
  const [newAppPath, setNewAppPath] = useState('');
  const [newAppIcon, setNewAppIcon] = useState('AppWindow');

  const accentColor = config?.appearance?.accentColor || '#0078d4';

  const updateSection = (section, updates) => {
    const updated = {
      ...config,
      [section]: {
        ...config[section],
        ...updates,
      },
    };
    onUpdateConfig(updated);
  };

  // Select executable via native Windows file dialog
  const handleBrowseExe = async () => {
    if (window.electronAPI && window.electronAPI.selectExecutable) {
      const result = await window.electronAPI.selectExecutable();
      if (result) {
        setNewAppPath(result.path);
        if (!newAppName) {
          setNewAppName(result.name);
        }
      }
    }
  };

  // Add new app
  const handleAddApp = () => {
    if (!newAppName.trim() || !newAppPath.trim()) return;

    const newApp = {
      id: `app-${Date.now()}`,
      name: newAppName.trim(),
      path: newAppPath.trim(),
      iconName: newAppIcon,
      category: 'custom',
    };

    const updatedApps = [...(config.apps || []), newApp];
    onUpdateConfig({ ...config, apps: updatedApps });

    // Reset form
    setNewAppName('');
    setNewAppPath('');
    setNewAppIcon('AppWindow');
  };

  // Remove app
  const handleRemoveApp = (id) => {
    const updatedApps = (config.apps || []).filter((a) => a.id !== id);
    onUpdateConfig({ ...config, apps: updatedApps });
  };

  // Test launch app
  const handleTestApp = async (app) => {
    setTestAppFeedback(app.id);
    if (window.electronAPI && window.electronAPI.launchApp) {
      await window.electronAPI.launchApp(app.path);
    }
    setTimeout(() => setTestAppFeedback(null), 1500);
  };

  // Test chime sound
  const handleTestChime = () => {
    setTestChimePlaying(true);
    audioService.playChime(config?.timer?.soundVolume ?? 0.8);
    setTimeout(() => setTestChimePlaying(false), 1500);
  };

  // Quit whole application
  const handleQuitApp = () => {
    if (window.electronAPI && window.electronAPI.quitApp) {
      window.electronAPI.quitApp();
    }
  };

  return (
    <div className="w-[760px] h-[560px] flex rounded-2xl overflow-hidden bg-[#0e0e11] text-white border border-white/10 shadow-2xl select-none">
      {/* Sidebar */}
      <div className="w-56 bg-[#08080a] border-r border-white/[0.06] flex flex-col justify-between p-4">
        <div>
          {/* App Header */}
          <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 16px ${accentColor}50`,
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none text-white">
                Now Bar
              </h1>
              <span className="text-[10px] text-white/40 font-mono">
                Windows 11 • v1.0
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'general'
                  ? 'bg-white/10 text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-4 h-4" style={{ color: activeTab === 'general' ? accentColor : undefined }} />
              <span>Général</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'appearance'
                  ? 'bg-white/10 text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette className="w-4 h-4" style={{ color: activeTab === 'appearance' ? accentColor : undefined }} />
              <span>Apparence</span>
            </button>

            <button
              onClick={() => setActiveTab('apps')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'apps'
                  ? 'bg-white/10 text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-4 h-4" style={{ color: activeTab === 'apps' ? accentColor : undefined }} />
              <span>Applications</span>
            </button>

            <button
              onClick={() => setActiveTab('timer')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'timer'
                  ? 'bg-white/10 text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Timer className="w-4 h-4" style={{ color: activeTab === 'timer' ? accentColor : undefined }} />
              <span>Minuteur</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-white/[0.06] space-y-1">
          <button
            onClick={handleQuitApp}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Quitter l'application</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#0d0d10]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold capitalize text-white/90">
            {activeTab === 'general' && 'Configuration générale'}
            {activeTab === 'appearance' && 'Personnalisation & Thème'}
            {activeTab === 'apps' && 'Gestion des applications rapides'}
            {activeTab === 'timer' && 'Options du minuteur'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Fermer les paramètres"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
          {/* TAB: GÉNÉRAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Startup toggle */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">Lancement au démarrage</h3>
                  <p className="text-[11px] text-white/50 mt-0.5">Démarrer Now Bar automatiquement avec Windows 11</p>
                </div>
                <input
                  type="checkbox"
                  checked={config?.general?.launchAtStartup !== false}
                  onChange={(e) => {
                    updateSection('general', { launchAtStartup: e.target.checked });
                    if (window.electronAPI && window.electronAPI.setStartup) {
                      window.electronAPI.setStartup(e.target.checked);
                    }
                  }}
                  className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Fullscreen Auto-Hide toggle */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">Masquer en plein écran</h3>
                  <p className="text-[11px] text-white/50 mt-0.5">Disparaît automatiquement lors des films, vidéos ou jeux plein écran</p>
                </div>
                <input
                  type="checkbox"
                  checked={config?.general?.hideOnFullscreen !== false}
                  onChange={(e) => updateSection('general', { hideOnFullscreen: e.target.checked })}
                  className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Default Music Player Selector */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-white">Lecteur de musique par défaut</h3>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Sélectionnez l'application musicale à lancer en arrière-plan et contrôler depuis la barre
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MUSIC_PROVIDERS.map((p) => {
                    const isSelected = (config?.music?.defaultProvider || 'amazon') === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => updateSection('music', { defaultProvider: p.id })}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-white/40 bg-white/10'
                            : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }}
                          />
                          <span className="text-xs font-medium text-white">{p.name}</span>
                        </div>
                        {isSelected && (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-black"
                            style={{ backgroundColor: p.color }}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hover Delay */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-semibold text-white">Délai d'expansion au survol</h3>
                    <p className="text-[11px] text-white/50 mt-0.5">Temps avant d'afficher l'heure au passage de la souris</p>
                  </div>
                  <span className="text-xs font-mono text-white/70">{config?.general?.hoverDelayMs || 120} ms</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="25"
                  value={config?.general?.hoverDelayMs || 120}
                  onChange={(e) => updateSection('general', { hoverDelayMs: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Collapse Delay */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-semibold text-white">Délai de repli</h3>
                    <p className="text-[11px] text-white/50 mt-0.5">Délai avant retour à la pill compacte lorsque la souris quitte l'île</p>
                  </div>
                  <span className="text-xs font-mono text-white/70">{config?.general?.collapseDelayMs || 400} ms</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1000"
                  step="50"
                  value={config?.general?.collapseDelayMs || 400}
                  onChange={(e) => updateSection('general', { collapseDelayMs: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Top Offset */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-semibold text-white">Marge supérieure</h3>
                    <p className="text-[11px] text-white/50 mt-0.5">Distance en pixels depuis le haut de l'écran</p>
                  </div>
                  <span className="text-xs font-mono text-white/70">{config?.general?.topOffset ?? 8} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="2"
                  value={config?.general?.topOffset ?? 8}
                  onChange={(e) => updateSection('general', { topOffset: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB: APPARENCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Accent Color picker */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-white">Couleur d'accentuation</h3>
                  <p className="text-[11px] text-white/50 mt-0.5">Personnalise les jauges, indicateurs et boutons d'action</p>
                </div>
                <div className="flex items-center gap-3">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => updateSection('appearance', { accentColor: preset.color, accentName: preset.id })}
                      className="group flex flex-col items-center gap-1.5"
                    >
                      <div
                        className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                          config?.appearance?.accentColor === preset.color
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d0d10] scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.color }}
                      >
                        {config?.appearance?.accentColor === preset.color && (
                          <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                        )}
                      </div>
                      <span className="text-[10px] text-white/50 group-hover:text-white truncate max-w-[50px]">
                        {preset.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme style selector */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-white">Style de fond sombre</h3>
                  <p className="text-[11px] text-white/50 mt-0.5">Nuance de verre pour la Dynamic Island</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {THEME_PRESETS.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => updateSection('appearance', { theme: theme.id })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        config?.appearance?.theme === theme.id
                          ? 'border-white/40 bg-white/10'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="w-full h-3 rounded-full mb-2" style={{ backgroundColor: theme.surface }} />
                      <span className="text-xs font-medium text-white">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Mode (Bubble vs Bezel/Edge attached) */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-white">Intégration à l'écran</h3>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Format bulle flottante sur moniteur externe ou intégré au bord sur PC portable
                  </p>
                </div>
                <div className="space-y-2">
                  {DISPLAY_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => updateSection('appearance', { displayMode: mode.id })}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        (config?.appearance?.displayMode || 'auto') === mode.id
                          ? 'border-white/40 bg-white/10'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{mode.name}</div>
                        <div className="text-[10px] text-white/50 mt-0.5">{mode.desc}</div>
                      </div>
                      {(config?.appearance?.displayMode || 'auto') === mode.id && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: APPLICATIONS */}
          {activeTab === 'apps' && (
            <div className="space-y-4">
              {/* Configured Apps List */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <h3 className="text-xs font-semibold text-white">Applications configurées</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {(config.apps || []).map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.06]"
                          style={{ color: accentColor }}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <span>{app.name}</span>
                            {(app.id === 'app-timer' || app.id === 'app-stopwatch') && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-sans">
                                Intégré
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono truncate max-w-[280px]">
                            {app.path.startsWith('internal:') ? 'Outil intégré Now Bar' : app.path}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {app.id !== 'app-timer' && app.id !== 'app-stopwatch' ? (
                          <>
                            <button
                              onClick={() => handleTestApp(app)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors flex items-center gap-1"
                              title="Lancer pour tester"
                            >
                              {testAppFeedback === app.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <ExternalLink className="w-3 h-3" />
                              )}
                              <span>Tester</span>
                            </button>
                            <button
                              onClick={() => handleRemoveApp(app.id)}
                              className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-white/30 px-2 py-1 italic">
                            Par défaut
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New App Form */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <h3 className="text-xs font-semibold text-white">Ajouter une application (.exe)</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/50 block mb-1">Nom affiché</label>
                    <input
                      type="text"
                      placeholder="Ex: Spotify, Chrome..."
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-white/50 block mb-1">Icône</label>
                    <select
                      value={newAppIcon}
                      onChange={(e) => setNewAppIcon(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1a1a20] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
                    >
                      {AVAILABLE_ICONS.map((ico) => (
                        <option key={ico} value={ico}>
                          {ico}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-white/50 block mb-1">Chemin de l'exécutable</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="C:\chemin\vers\application.exe"
                      value={newAppPath}
                      onChange={(e) => setNewAppPath(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 font-mono focus:outline-none focus:border-white/30"
                    />
                    <button
                      onClick={handleBrowseExe}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
                      title="Parcourir les fichiers"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Parcourir</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddApp}
                  disabled={!newAppName.trim() || !newAppPath.trim()}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter aux applications rapides</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: MINUTEUR */}
          {activeTab === 'timer' && (
            <div className="space-y-4">
              {/* Notification toggle */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">Notifications Windows 11</h3>
                  <p className="text-[11px] text-white/50 mt-0.5">Recevoir une notification système à l'expiration du minuteur</p>
                </div>
                <input
                  type="checkbox"
                  checked={config?.timer?.enableNotification !== false}
                  onChange={(e) => updateSection('timer', { enableNotification: e.target.checked })}
                  className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Sound alert toggle & volume */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-white">Carillon sonore cristallin</h3>
                    <p className="text-[11px] text-white/50 mt-0.5">Synthèse audio procédurale Web Audio douce</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.timer?.enableSound !== false}
                    onChange={(e) => updateSection('timer', { enableSound: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                  />
                </div>

                {config?.timer?.enableSound !== false && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-white/60">Volume sonore</span>
                      <span className="text-xs font-mono text-white/70">
                        {Math.round((config?.timer?.soundVolume ?? 0.8) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={config?.timer?.soundVolume ?? 0.8}
                        onChange={(e) => updateSection('timer', { soundVolume: parseFloat(e.target.value) })}
                        className="flex-1 accent-blue-500 cursor-pointer"
                      />
                      <button
                        onClick={handleTestChime}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{testChimePlaying ? 'Lecture...' : 'Tester'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] bg-[#09090b] flex items-center justify-between text-xs text-white/40">
          <span>Modifications enregistrées automatiquement</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
