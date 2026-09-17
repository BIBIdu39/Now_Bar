import React, { useState } from 'react';
import {
  Folder,
  FileText,
  Calculator,
  Activity,
  Terminal,
  Globe,
  Code,
  Music,
  Gamepad2,
  Compass,
  MessageSquare,
  Cpu,
  Layers,
  AppWindow,
  Plus,
  Check,
  Timer,
  Clock,
  Watch,
  ChevronLeft,
} from 'lucide-react';
import TimerView from './TimerView';
import StopwatchView from './StopwatchView';

const ICON_MAP = {
  Folder,
  FileText,
  Calculator,
  Activity,
  Terminal,
  Globe,
  Code,
  Music,
  Gamepad2,
  Compass,
  MessageSquare,
  Cpu,
  Layers,
  AppWindow,
  Timer,
  Clock,
  Watch,
};

export default function QuickAppsView({
  apps = [],
  onOpenSettings,
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
  accentColor = '#0078d4',
}) {
  const [launchFeedbackId, setLaunchFeedbackId] = useState(null);
  const [activeSubView, setActiveSubView] = useState(null); // 'timer' | 'stopwatch' | null

  const handleLaunch = async (app) => {
    if (app.id === 'app-timer' || app.path === 'internal:timer') {
      setActiveSubView('timer');
      return;
    }
    if (app.id === 'app-stopwatch' || app.path === 'internal:stopwatch') {
      setActiveSubView('stopwatch');
      return;
    }

    setLaunchFeedbackId(app.id);
    if (window.electronAPI && window.electronAPI.launchApp) {
      await window.electronAPI.launchApp(app.path);
    }
    setTimeout(() => {
      setLaunchFeedbackId(null);
    }, 1200);
  };

  const renderIcon = (iconName, className = "w-5 h-5") => {
    const IconComponent = ICON_MAP[iconName] || AppWindow;
    return <IconComponent className={className} />;
  };

  // If user clicked Minuteur inside Apps, show the timer interface
  if (activeSubView === 'timer') {
    return (
      <div className="w-full h-full flex flex-col justify-between py-1 text-white">
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] mb-1">
          <button
            onClick={() => setActiveSubView(null)}
            className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Retour aux applications</span>
          </button>
          <span className="text-[11px] font-semibold text-white/80">Minuteur</span>
        </div>
        <div className="flex-1 flex flex-col justify-center overflow-y-auto no-scrollbar max-h-[145px] py-0.5">
          <TimerView
            timerState={timerState}
            onStartTimer={onStartTimer}
            onPauseTimer={onPauseTimer}
            onResumeTimer={onResumeTimer}
            onResetTimer={onResetTimer}
            onStopTimer={onStopTimer}
            accentColor={accentColor}
          />
        </div>
      </div>
    );
  }

  // If user clicked Chronomètre inside Apps, show the stopwatch interface
  if (activeSubView === 'stopwatch') {
    return (
      <StopwatchView
        stopwatchState={stopwatchState}
        onStartStopwatch={onStartStopwatch}
        onPauseStopwatch={onPauseStopwatch}
        onResumeStopwatch={onResumeStopwatch}
        onResetStopwatch={onResetStopwatch}
        onLapStopwatch={onLapStopwatch}
        accentColor={accentColor}
        onBack={() => setActiveSubView(null)}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between py-1 text-white">
      {/* App Grid */}
      <div className="grid grid-cols-5 gap-2 px-1 py-1 max-h-[135px] overflow-y-auto no-scrollbar">
        {apps.map((app) => {
          const isTimerApp = app.id === 'app-timer' || app.path === 'internal:timer';
          const isStopwatchApp = app.id === 'app-stopwatch' || app.path === 'internal:stopwatch';
          const isLaunched = launchFeedbackId === app.id;

          const isAppActive =
            (isTimerApp && timerState?.isActive) ||
            (isStopwatchApp && stopwatchState?.isActive);

          return (
            <button
              key={app.id}
              onClick={() => handleLaunch(app)}
              className={`group relative flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-200 active:scale-90 text-center ${
                isLaunched
                  ? 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-app-launch'
                  : 'bg-white/[0.04] hover:bg-white/[0.1] border-white/[0.06] hover:border-white/20'
              }`}
              title={
                isTimerApp
                  ? 'Minuteur'
                  : isStopwatchApp
                  ? 'Chronomètre'
                  : `${app.name} (${app.path})`
              }
            >
              {/* Expanding launch shockwave */}
              {isLaunched && (
                <span
                  className="absolute inset-0 rounded-2xl border-2 border-emerald-400/60 animate-ping pointer-events-none"
                  style={{ animationDuration: '0.7s', animationIterationCount: 1 }}
                />
              )}

              {/* Active pulse badge for Timer / Stopwatch */}
              {isAppActive && (
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: accentColor || '#0078d4' }}
                />
              )}

              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 mb-1.5 ${
                  isLaunched
                    ? 'bg-emerald-500/25 scale-110 shadow-lg'
                    : 'bg-white/[0.05] group-hover:bg-white/[0.12]'
                }`}
                style={{
                  color: isLaunched ? '#34d399' : accentColor || '#0078d4',
                }}
              >
                {isLaunched ? (
                  <Check className="w-5 h-5 text-emerald-300 stroke-[2.5] animate-chime-celebration" />
                ) : isTimerApp ? (
                  <Timer className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                ) : isStopwatchApp ? (
                  <Clock className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                ) : (
                  renderIcon(app.iconName, "w-4 h-4 group-hover:scale-110 transition-transform duration-200")
                )}
              </div>
              <span className={`text-[11px] font-medium truncate max-w-[55px] transition-colors ${
                isLaunched ? 'text-emerald-300 font-semibold' : 'text-white/80 group-hover:text-white'
              }`}>
                {isLaunched ? 'Lancé !' : app.name}
              </span>
            </button>
          );
        })}

        {/* Add app tile */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings?.('apps');
          }}
          className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/[0.02] hover:bg-white/[0.07] border border-dashed border-white/15 hover:border-white/30 text-white/40 hover:text-white transition-all duration-200 active:scale-95"
          title="Ajouter et gérer les applications dans les Paramètres"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.03] mb-1.5">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium truncate max-w-[55px]">
            Ajouter
          </span>
        </button>
      </div>

      {/* Bottom info count: naturally counts all configured apps including Timer and Stopwatch */}
      <div className="flex items-center justify-center pt-2 border-t border-white/[0.06] px-1 text-[11px] text-white/40">
        <span>{apps.length} application{apps.length > 1 ? 's' : ''} configurée{apps.length > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
