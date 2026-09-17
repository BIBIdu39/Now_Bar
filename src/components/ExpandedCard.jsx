import React, { useState, useEffect } from 'react';
import { Music, LayoutGrid, Settings, Mic, MicOff, Clock, Timer, Check } from 'lucide-react';
import MusicView from './MusicView';
import QuickAppsView from './QuickAppsView';

export default function ExpandedCard({
  activeTab = 'music',
  onTabChange,
  musicState,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onChangeProvider,
  onLaunchMinimized,
  onLockLaunch,
  timerState,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onStopTimer,
  stopwatchState,
  onStartStopwatch,
  onPauseStopwatch,
  onResumeStopwatch,
  onResetStopwatch,
  onLapStopwatch,
  masterVolume,
  onVolumeChange,
  apps,
  onOpenSettings,
  isRecording,
  onToggleRecording,
  recordingPrompt,
  onSaveRecording,
  onDiscardRecording,
  accentColor,
}) {
  const [currentTime, setCurrentTime] = useState({ time: '--:--', date: '' });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = now.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      setCurrentTime({ time: timeStr, date: dateStr });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-between p-3.5 select-none text-white">
      {/* Top Header without Pin and without Collapse buttons */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.07]">
        {/* Left: Date */}
        <div className="flex items-center gap-1.5 text-xs text-white/50 capitalize font-medium">
          <Clock className="w-3.5 h-3.5 text-white/40" />
          <span>{currentTime.date}</span>
        </div>

        {/* Center: Current Time */}
        <div className="text-base font-semibold tracking-tight text-white/90 tabular-nums">
          {currentTime.time}
        </div>

        {/* Right: Voice recording mic toggle + Settings gear */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleRecording}
            className={`p-1.5 rounded-lg transition-all ${
              isRecording
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'hover:bg-white/10 text-white/40 hover:text-white'
            }`}
            title={isRecording ? 'Arrêter l\'enregistrement vocal' : 'Activer l\'indicateur d\'enregistrement vocal'}
          >
            {isRecording ? (
              <Mic className="w-3.5 h-3.5 animate-pulse text-rose-400" />
            ) : (
              <MicOff className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings?.('general');
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="Ouvrir les Paramètres"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Segment Tab Switcher: Music (Default) & Applications */}
      <div className="flex items-center justify-center my-2">
        <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] gap-1">
          <button
            onClick={() => onTabChange('music')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === 'music'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Music className="w-3.5 h-3.5" style={{ color: activeTab === 'music' ? accentColor || '#0078d4' : undefined }} />
            <span>Musique</span>
            {musicState.isPlaying && (
              <span className="flex items-end gap-0.5 ml-1">
                <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-wave-1" />
                <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-wave-2" />
                <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-wave-3" />
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('apps')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === 'apps'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" style={{ color: activeTab === 'apps' ? accentColor || '#0078d4' : undefined }} />
            <span>Applications</span>
            {(timerState.isActive || stopwatchState?.isActive) && (
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse ml-0.5"
                style={{ backgroundColor: accentColor || '#0078d4' }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Active Tab Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[140px]">
        {activeTab === 'music' ? (
          <MusicView
            musicState={musicState}
            onTogglePlay={onTogglePlay}
            onNextTrack={onNextTrack}
            onPrevTrack={onPrevTrack}
            onChangeProvider={onChangeProvider}
            onLaunchMinimized={onLaunchMinimized}
            onLockLaunch={onLockLaunch}
            masterVolume={masterVolume}
            onVolumeChange={onVolumeChange}
            accentColor={accentColor}
          />
        ) : (
          <QuickAppsView
            apps={apps}
            onOpenSettings={onOpenSettings}
            timerState={timerState}
            onStartTimer={onStartTimer}
            onPauseTimer={onPauseTimer}
            onResumeTimer={onResumeTimer}
            onResetTimer={onResetTimer}
            onStopTimer={onStopTimer}
            stopwatchState={stopwatchState}
            onStartStopwatch={onStartStopwatch}
            onPauseStopwatch={onPauseStopwatch}
            onResumeStopwatch={onResumeStopwatch}
            onResetStopwatch={onResetStopwatch}
            onLapStopwatch={onLapStopwatch}
            accentColor={accentColor}
          />
        )}
      </div>

      {/* Voice Recording Save Prompt Overlay */}
      {recordingPrompt && (
        <div
          className="absolute inset-2 z-30 rounded-2xl bg-[#09090b]/95 backdrop-blur-2xl border flex flex-col items-center justify-center p-4 text-center transition-all duration-200"
          style={{
            borderColor: `${accentColor || '#0078d4'}45`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.7), 0 0 24px ${accentColor || '#0078d4'}25`,
          }}
        >
          {recordingPrompt.status === 'saved' ? (
            <div className="flex flex-col items-center gap-2 animate-chime-celebration">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/20 border border-emerald-500/40"
                style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
              >
                <Check className="w-6 h-6 text-emerald-300 stroke-[2.5]" />
              </div>
              <span className="text-sm font-semibold text-emerald-300">
                Enregistrement sauvegardé !
              </span>
              <span className="text-xs text-white/50">
                Fichier audio conservé avec succès
              </span>
            </div>
          ) : recordingPrompt.status === 'discarded' ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-white/50">
                Enregistrement supprimé
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2"
                style={{
                  backgroundColor: `${accentColor || '#0078d4'}20`,
                  color: accentColor || '#0078d4',
                  boxShadow: `0 0 16px ${accentColor || '#0078d4'}30`,
                }}
              >
                <Mic className="w-5 h-5 animate-pulse" />
              </div>

              <span className="text-sm font-semibold text-white">
                Enregistrement terminé ({formatDuration(recordingPrompt.durationSecs || 0)})
              </span>

              <span className="text-xs text-white/60 mt-1 mb-4">
                Souhaitez-vous sauvegarder cet enregistrement audio ?
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={onDiscardRecording}
                  className="px-4 py-1.5 rounded-xl text-xs font-medium text-white/60 hover:text-white bg-white/10 hover:bg-white/15 transition-all active:scale-95"
                >
                  Supprimer
                </button>

                <button
                  onClick={onSaveRecording}
                  className="px-5 py-1.5 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                  style={{
                    backgroundColor: accentColor || '#0078d4',
                    color: getContrastTextColor(accentColor),
                    boxShadow: `0 4px 16px ${accentColor || '#0078d4'}50`,
                  }}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: getContrastTextColor(accentColor) }} />
                  <span>Sauvegarder</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getContrastTextColor(hexColor) {
  if (!hexColor) return '#ffffff';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#09090b' : '#ffffff';
}

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
